import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Subscription } from 'rxjs';
import { retryWhen, delay, take } from 'rxjs/operators';
import {
  UserOperation,
  CommunityUser,
  SortType,
  ListingType,
  UserView,
  UserSettingsForm,
  LoginResponse,
  DeleteAccountForm,
  WebSocketJsonResponse,
  GetSiteResponse,
  Site,
  UserDetailsView,
  UserDetailsResponse,
  GetSiteModeratorsResponse,
  CommunityModsState,
  BanUserForm,
  UserTagResponse,
} from '../interfaces';
import { WebSocketService, UserService } from '../services';
import {
  wsJsonToRes,
  fetchLimit,
  routeSortTypeToEnum,
  capitalizeFirstLetter,
  // themes,
  languages,
  showAvatars,
  toast,
  setupTippy,
  mapSiteModeratorsResponse,
  canMod,
  getAllUserModeratedCommunities,
} from '../utils';
import { UserListing } from './user-listing';
import { SortSelect } from './sort-select';
import { ListingTypeSelect } from './listing-type-select';
import { MomentTime } from './moment-time';
import { i18n } from '../i18next';
import moment from 'moment';
import { UserDetails } from './user-details';
import { Icon } from './icon';
import { linkEvent } from '../linkEvent';
import { changeTheme, ThemeSelector } from '../theme';
import Button from './elements/Button';
// import { Button } from 'theme-ui';
// import { changeTheme } from './ThemeSystemProvider';

interface UserState {
  user: UserView;
  user_id: number;
  username: string;
  follows: Array<CommunityUser>;
  moderates: Array<CommunityUser>;
  view: UserDetailsView;
  sort: SortType;
  page: number;
  loading: boolean;
  avatarLoading: boolean;
  userSettingsForm: UserSettingsForm;
  userSettingsLoading: boolean;
  deleteAccountLoading: boolean;
  deleteAccountShowConfirm: boolean;
  deleteAccountForm: DeleteAccountForm;
  site: Site;
  siteModerators: CommunityModsState | null;
  admins: Array<UserView>;
  sitemods: Array<UserView>;
  banUserShow: boolean;
  banReason: string;
  pronouns: string | null;
  additionalPronouns: string | null;
}

interface UserProps {
  view: UserDetailsView;
  sort: SortType;
  page: number;
  user_id: number | null;
  username: string;
}

interface UrlParams {
  view?: string;
  sort?: string;
  page?: number;
}

function getViewFromProps(view: any): UserDetailsView {
  return view
    ? UserDetailsView[capitalizeFirstLetter(view)]
    : UserDetailsView.Overview;
}

function getSortTypeFromProps(sort: any): SortType {
  return sort ? routeSortTypeToEnum(sort) : SortType.New;
}

function getPageFromProps(page: any): number {
  return page ? Number(page) : 1;
}

class BaseUser extends Component<any, UserState> {
  private subscription: Subscription;
  private emptyState: UserState = {
    user: {
      id: null,
      name: null,
      published: null,
      number_of_posts: null,
      post_score: null,
      number_of_comments: null,
      comment_score: null,
      banned: null,
      avatar: null,
      show_avatars: null,
      send_notifications_to_email: null,
      actor_id: null,
      local: null,
    },
    user_id: null,
    username: null,
    follows: [],
    moderates: [],
    loading: true,
    avatarLoading: false,
    view: getViewFromProps(this.props.match.view),
    sort: getSortTypeFromProps(this.props.match.sort),
    page: getPageFromProps(this.props.match.page),
    userSettingsForm: {
      show_nsfw: null,
      theme: null,
      default_sort_type: null,
      default_listing_type: null,
      lang: null,
      show_avatars: null,
      send_notifications_to_email: null,
      auth: null,
    },
    userSettingsLoading: null,
    deleteAccountLoading: null,
    deleteAccountShowConfirm: false,
    deleteAccountForm: {
      password: null,
    },
    site: {
      id: undefined,
      name: undefined,
      creator_id: undefined,
      published: undefined,
      creator_name: undefined,
      number_of_users: undefined,
      number_of_posts: undefined,
      number_of_comments: undefined,
      number_of_communities: undefined,
      enable_create_communities: undefined,
      enable_downvotes: undefined,
      open_registration: undefined,
      enable_nsfw: undefined,
    },
    siteModerators: null,
    admins: [],
    sitemods: [],
    banUserShow: false,
    banReason: null,
    pronouns: 'none',
    additionalPronouns: 'none',
  };

  state = this.emptyState

  constructor(props: any, context: any) {
    super(props, context);

    this.handleSortChange = this.handleSortChange.bind(this);
    this.handleUserSettingsSortTypeChange = this.handleUserSettingsSortTypeChange.bind(
      this
    );
    this.handleUserSettingsListingTypeChange = this.handleUserSettingsListingTypeChange.bind(
      this
    );
    this.handlePageChange = this.handlePageChange.bind(this);
    this.isModerator = this.isModerator.bind(this);
    this.handlePronounsChange = this.handlePronounsChange.bind(this);
    this.handleAdditionalPronounsChange = this.handleAdditionalPronounsChange.bind(
      this
    );
    this.handleLogoutClick = this.handleLogoutClick.bind(this);
  }

  componentDidMount() {
    this.subscription = WebSocketService.Instance.subject
      .pipe(retryWhen(errors => errors.pipe(delay(3000), take(10))))
      .subscribe(
        msg => this.parseMessage(msg),
        err => console.error(err),
        () => console.log('complete')
      );

    WebSocketService.Instance.getSite();
    WebSocketService.Instance.getSiteModerators();
  }

  get isCurrentUser() {
    return (
      UserService.Instance.user &&
      UserService.Instance.user.id === this.state.user.id
    );
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  static getDerivedStateFromProps(props: any): UserProps {
    return {
      view: getViewFromProps(props.match.params.view),
      sort: getSortTypeFromProps(props.match.params.sort),
      page: getPageFromProps(props.match.params.page),
      user_id: Number(props.match.params.id) || null,
      username: props.match.params.username,
    };
  }

  componentDidUpdate(lastProps: any, _lastState: UserState, _snapshot: any) {
    // Necessary if you are on a post and you click another post (same route)
    if (
      lastProps.location.pathname.split('/')[2] !==
      lastProps.history.location.pathname.split('/')[2]
    ) {
      // Couldnt get a refresh working. This does for now.
      location.reload();
    }
    document.title = `/u/${this.state.username} - ${this.state.site.name}`;
    setupTippy();
  }

  render() {
    return (
      <div className="container">
        <h5>
          {this.state.user.avatar && showAvatars() && (
            <img
              height="80"
              width="80"
              src={this.state.user.avatar}
              alt={`Avatar for user ${this.state.username}`}
              className="rounded-circle mr-2"
            />
          )}
          <span>/u/{this.state.username}</span>
        </h5>
        {this.state.loading && (
          <h5>
            <svg className="icon icon-spinner spin">
              <use xlinkHref="#icon-spinner" />
            </svg>
          </h5>
        )}
        <div className="row">
          <main className="col-12 col-md-8" role="main">
            {!this.state.loading && this.selects()}
            <UserDetails
              user_id={this.state.user_id}
              username={this.state.username}
              sort={SortType[this.state.sort]}
              page={this.state.page}
              limit={fetchLimit}
              enableDownvotes={this.state.site.enable_downvotes}
              enableNsfw={this.state.site.enable_nsfw}
              view={this.state.view}
              onPageChange={this.handlePageChange}
              siteModerators={this.state.siteModerators}
            />
          </main>
          {!this.state.loading && (
            <aside className="col-12 col-md-4 sidebar">
              {(this.canAdmin || this.canSitemod || this.isModerator()) &&
                !this.isCurrentUser &&
                this.modActions()}
              {this.userInfo()}
              {this.isCurrentUser && this.userSettings()}
              {this.moderates()}
              {this.follows()}
            </aside>
          )}
        </div>
      </div>
    );
  }

  viewRadios() {
    return (
      <div className="btn-group btn-group-toggle">
        <label
          className={`btn btn-sm btn-secondary pointer btn-outline-light
            ${this.state.view == UserDetailsView.Overview && 'active'}
          `}
        >
          <input
            type="radio"
            value={UserDetailsView.Overview}
            checked={this.state.view === UserDetailsView.Overview}
            onChange={linkEvent(this, this.handleViewChange)}
          />
          {i18n.t('overview')}
        </label>
        <label
          className={`btn btn-sm btn-secondary pointer btn-outline-light
            ${this.state.view == UserDetailsView.Comments && 'active'}
          `}
        >
          <input
            type="radio"
            value={UserDetailsView.Comments}
            checked={this.state.view == UserDetailsView.Comments}
            onChange={linkEvent(this, this.handleViewChange)}
          />
          {i18n.t('comments')}
        </label>
        <label
          className={`btn btn-sm btn-secondary pointer btn-outline-light
            ${this.state.view == UserDetailsView.Posts && 'active'}
          `}
        >
          <input
            type="radio"
            value={UserDetailsView.Posts}
            checked={this.state.view == UserDetailsView.Posts}
            onChange={linkEvent(this, this.handleViewChange)}
          />
          {i18n.t('posts')}
        </label>
        <label
          className={`btn btn-sm btn-secondary pointer btn-outline-light
            ${this.state.view == UserDetailsView.Saved && 'active'}
          `}
        >
          <input
            type="radio"
            value={UserDetailsView.Saved}
            checked={this.state.view == UserDetailsView.Saved}
            onChange={linkEvent(this, this.handleViewChange)}
          />
          {i18n.t('saved')}
        </label>
      </div>
    );
  }

  selects() {
    return (
      <div className="mb-2">
        <div className="mr-3 mb-2 user-view-toggle">{this.viewRadios()}</div>
        <SortSelect
          sort={this.state.sort}
          onChange={this.handleSortChange}
          hideHot
        />
        <a
          href={`/feeds/u/${this.state.username}.xml?sort=${
            SortType[this.state.sort]
          }`}
          target="_blank"
          rel="noopener"
          title="RSS"
        >
          <Icon name="rss" className="icon mx-2 text-muted small" />
        </a>
      </div>
    );
  }

  userInfo() {
    let user = this.state.user;
    return (
      <div>
        <div className="card border-secondary mb-3">
          <div className="card-body">
            <h5>
              <ul className="list-inline mb-0">
                <li className="list-inline-item">
                  <UserListing user={user} realLink />
                </li>
                {user.banned && (
                  <li
                    className="list-inline-item badge badge-danger"
                    key={user.id}
                  >
                    {i18n.t('banned')}
                  </li>
                )}
              </ul>
            </h5>
            <div className="d-flex align-items-center mb-2">
              <svg className="icon">
                <use xlinkHref="#icon-cake" />
              </svg>
              <span className="ml-2">
                {i18n.t('cake_day_title')}{' '}
                {moment.utc(user.published).local().format('MMM DD, YYYY')}
              </span>
            </div>
            <div>
              {i18n.t('joined')} <MomentTime data={user} showAgo />
            </div>
            <div className="table-responsive mt-1">
              <table className="table table-bordered table-sm mt-2 mb-0">
                {/*
                <tr>
                  <td className="text-center" colSpan={2}>
                    {i18n.t('number_of_points', {
                      count: user.post_score + user.comment_score,
                    })}
                  </td>
                </tr>
                */}
                <tr>
                  {/*
                  <td>
                    {i18n.t('number_of_points', { count: user.post_score })}
                  </td>
                  */}
                  <td>
                    {i18n.t('number_of_posts', { count: user.number_of_posts })}
                  </td>
                  {/*
                </tr>
                <tr>
                  <td>
                    {i18n.t('number_of_points', { count: user.comment_score })}
                  </td>
                  */}
                  <td>
                    {i18n.t('number_of_comments', {
                      count: user.number_of_comments,
                    })}
                  </td>
                </tr>
              </table>
            </div>
            {this.isCurrentUser ? (
              <Button css={{ width: '100%' }} mt={3} onClick={this.handleLogoutClick}>
                {i18n.t('logout')}
              </Button>
            ) : (
              <>
                <a
                  className={`btn btn-block btn-secondary mt-3 ${
                    !this.state.user.matrix_user_id && 'disabled'
                  }`}
                  target="_blank"
                  rel="noopener"
                  href={`https://matrix.to/#/${this.state.user.matrix_user_id}`}
                >
                  {i18n.t('send_secure_message')}
                </a>
                <Link
                  className="btn btn-block btn-secondary mt-3"
                  to={`/create_private_message?recipient_id=${this.state.user.id}`}
                >
                  {i18n.t('send_message')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  userSettings() {
    return (
      <div>
        <div className="card border-secondary mb-3">
          <div className="card-body">
            <h5>{i18n.t('settings')}</h5>
            <form onSubmit={linkEvent(this, this.handleUserSettingsSubmit)}>
              {/* <div className="form-group">
                <label>{i18n.t('avatar')}</label>
                <form className="d-inline">
                  <label
                    htmlFor="file-upload"
                    className="pointer ml-4 text-muted small font-weight-bold"
                  >
                    {!this.checkSettingsAvatar ? (
                      <span className="btn btn-sm btn-secondary">
                        {i18n.t('upload_avatar')}
                      </span>
                    ) : (
                      <img
                        height="80"
                        width="80"
                        src={this.state.userSettingsForm.avatar}
                        className="rounded-circle"
                      />
                    )}
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*,video/*"
                    name="file"
                    className="d-none"
                    disabled={!UserService.Instance.user}
                    onChange={linkEvent(this, this.handleImageUpload)}
                  />
                </form>
              </div>
              {this.checkSettingsAvatar && (
                <div className="form-group">
                  <button
                    className="btn btn-secondary btn-block"
                    onClick={linkEvent(this, this.removeAvatar)}
                  >
                    {`${capitalizeFirstLetter(i18n.t('remove'))} ${i18n.t(
                      'avatar'
                    )}`}
                  </button>
                </div>
              )} */}
              <div className="form-group row">
                <label
                  className="col-lg-5 col-form-label"
                  htmlFor="user-pronouns"
                >
                  {i18n.t('pronouns')}
                </label>
                <div className="col-lg-7">
                  <select
                    id="user-pronouns"
                    value={this.state.pronouns}
                    className="custom-select custom-select-sm"
                    onChange={this.handlePronounsChange}
                  >
                    <option value="none">none</option>
                    <option value="they/them">they/them</option>
                    <option value="she/her">she/her</option>
                    <option value="he/him">he/him</option>
                    <option value="any pronoun">any</option>
                  </select>
                </div>
              </div>

              {!(
                this.state.pronouns === '' || this.state.pronouns === 'none'
              ) && (
                <div className="form-group row">
                  <label
                    className="col-lg-5 col-form-label"
                    htmlFor="user-secondary-pronouns"
                  >
                    {i18n.t('additional_pronouns')}
                  </label>
                  <div className="col-lg-7">
                    <select
                      id="user-secondary-pronouns"
                      value={this.state.additionalPronouns}
                      className="custom-select custom-select-sm"
                      onChange={this.handleAdditionalPronounsChange}
                    >
                      <option value="none">none</option>
                      <option value="they/them">they/them</option>
                      <option value="she/her">she/her</option>
                      <option value="he/him">he/him</option>
                      <option value="any pronoun">any</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="form-group">
                <label>{i18n.t('language')}</label>
                <select
                  value={this.state.userSettingsForm.lang}
                  onChange={linkEvent(this, this.handleUserSettingsLangChange)}
                  className="ml-2 custom-select custom-select-sm w-auto"
                >
                  <option disabled>{i18n.t('language')}</option>
                  <option value="browser">{i18n.t('browser_default')}</option>
                  <option disabled>──</option>
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{i18n.t('theme')}</label>
                <ThemeSelector
                  value={this.state.userSettingsForm.theme}
                  onChange={this.handleUserSettingsThemeChange}
                />
              </div>
              <form className="form-group">
                <label>
                  <div className="mr-2">{i18n.t('sort_type')}</div>
                </label>
                <ListingTypeSelect
                  type_={this.state.userSettingsForm.default_listing_type}
                  onChange={this.handleUserSettingsListingTypeChange}
                />
              </form>
              <form className="form-group">
                <label>
                  <div className="mr-2">{i18n.t('type')}</div>
                </label>
                <SortSelect
                  sort={parseInt(
                    // @ts-ignore
                    this.state.userSettingsForm.default_sort_type,
                    10
                  )}
                  onChange={this.handleUserSettingsSortTypeChange}
                />
              </form>
              <div className="form-group row">
                <label className="col-lg-3 col-form-label" htmlFor="user-email">
                  {i18n.t('email')}
                </label>
                <div className="col-lg-9">
                  <input
                    type="email"
                    id="user-email"
                    className="form-control"
                    placeholder={i18n.t('optional')}
                    value={this.state.userSettingsForm.email}
                    onInput={linkEvent(
                      this,
                      this.handleUserSettingsEmailChange
                    )}
                    minLength={3}
                  />
                </div>
              </div>
              <div className="form-group row">
                <label className="col-lg-5 col-form-label">
                  <a
                    href="https://about.riot.im/"
                    target="_blank"
                    rel="noopener"
                  >
                    {i18n.t('matrix_user_id')}
                  </a>
                </label>
                <div className="col-lg-7">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="@user:example.com"
                    value={this.state.userSettingsForm.matrix_user_id}
                    onInput={linkEvent(
                      this,
                      this.handleUserSettingsMatrixUserIdChange
                    )}
                    minLength={3}
                  />
                </div>
              </div>
              <div className="form-group row">
                <label
                  className="col-lg-5 col-form-label"
                  htmlFor="user-password"
                >
                  {i18n.t('new_password')}
                </label>
                <div className="col-lg-7">
                  <input
                    type="password"
                    id="user-password"
                    className="form-control"
                    value={this.state.userSettingsForm.new_password}
                    autoComplete="new-password"
                    onInput={linkEvent(
                      this,
                      this.handleUserSettingsNewPasswordChange
                    )}
                  />
                </div>
              </div>
              <div className="form-group row">
                <label
                  className="col-lg-5 col-form-label"
                  htmlFor="user-verify-password"
                >
                  {i18n.t('verify_password')}
                </label>
                <div className="col-lg-7">
                  <input
                    type="password"
                    id="user-verify-password"
                    className="form-control"
                    value={this.state.userSettingsForm.new_password_verify}
                    autoComplete="new-password"
                    onInput={linkEvent(
                      this,
                      this.handleUserSettingsNewPasswordVerifyChange
                    )}
                  />
                </div>
              </div>
              <div className="form-group row">
                <label
                  className="col-lg-5 col-form-label"
                  htmlFor="user-old-password"
                >
                  {i18n.t('old_password')}
                </label>
                <div className="col-lg-7">
                  <input
                    type="password"
                    id="user-old-password"
                    className="form-control"
                    value={this.state.userSettingsForm.old_password}
                    autoComplete="new-password"
                    onInput={linkEvent(
                      this,
                      this.handleUserSettingsOldPasswordChange
                    )}
                  />
                </div>
              </div>
              {this.state.site.enable_nsfw && (
                <div className="form-group">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      id="user-show-nsfw"
                      type="checkbox"
                      checked={this.state.userSettingsForm.show_nsfw}
                      onChange={linkEvent(
                        this,
                        this.handleUserSettingsShowNsfwChange
                      )}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="user-show-nsfw"
                    >
                      {i18n.t('show_nsfw')}
                    </label>
                  </div>
                </div>
              )}
              <div className="form-group">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    id="user-show-avatars"
                    type="checkbox"
                    checked={this.state.userSettingsForm.show_avatars}
                    onChange={linkEvent(
                      this,
                      this.handleUserSettingsShowAvatarsChange
                    )}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="user-show-avatars"
                  >
                    {i18n.t('show_avatars')}
                  </label>
                </div>
              </div>
              <div className="form-group">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    id="user-send-notifications-to-email"
                    type="checkbox"
                    disabled={!this.state.user.email}
                    checked={
                      this.state.userSettingsForm.send_notifications_to_email
                    }
                    onChange={linkEvent(
                      this,
                      this.handleUserSettingsSendNotificationsToEmailChange
                    )}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="user-send-notifications-to-email"
                  >
                    {i18n.t('send_notifications_to_email')}
                  </label>
                </div>
              </div>
              <div className="form-group">
                <Button
                  type="submit"
                  mr={4}
                  loading={this.state.userSettingsLoading}
                  block
                >
                  {capitalizeFirstLetter(i18n.t('save'))}
                </Button>
              </div>
              <hr />
              <div className="form-group mb-0">
                <Button
                  variant="danger"
                  block
                  onClick={linkEvent(
                    this,
                    this.handleDeleteAccountShowConfirmToggle
                  )}
                >
                  {i18n.t('delete_account')}
                </Button>
                  {this.state.deleteAccountShowConfirm && (
                  <>
                    <div className="my-2 alert alert-danger" role="alert">
                      {i18n.t('delete_account_confirm')}
                    </div>
                    <input
                      type="password"
                      value={this.state.deleteAccountForm.password}
                      autoComplete="new-password"
                      onInput={linkEvent(
                        this,
                        this.handleDeleteAccountPasswordChange
                      )}
                      className="form-control my-2"
                    />
                    <Button
                      variant="danger"
                      mr={4}
                      disabled={!this.state.deleteAccountForm.password}
                      onClick={linkEvent(this, this.handleDeleteAccount)}
                    >
                      {this.state.deleteAccountLoading ? (
                        <svg className="icon icon-spinner spin">
                          <use xlinkHref="#icon-spinner" />
                        </svg>
                      ) : (
                        capitalizeFirstLetter(i18n.t('delete'))
                      )}
                    </Button>
                    <button
                      className="btn btn-secondary"
                      onClick={linkEvent(
                        this,
                        this.handleDeleteAccountShowConfirmToggle
                      )}
                    >
                      {i18n.t('cancel')}
                    </button>
                  </>
                  )}
                {/* <button
                  className="btn btn-block btn-danger"

                >

                </button> */}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  modActions() {
    return (
      <div>
        <div className="card border-secondary mb-3">
          <div className="card-body">
            <h5>Mod Actions</h5>
            {(this.canAdmin || this.canSitemod || this.isModerator()) && (
              <button
                className="btn btn-secondary"
                onClick={linkEvent(this, this.handleBanUserShow)}
              >
                {this.isModerator
                  ? i18n.t('ban_from_my_communities')
                  : i18n.t('ban_from_site')}
              </button>
            )}
            {this.state.banUserShow && (
              <form onSubmit={linkEvent(this, this.handleBan)}>
                <div
                  style={{
                    display: 'flex',
                  }}
                >
                  <input
                    id="reason"
                    placeholder="reason"
                    onChange={linkEvent(this, this.handleBanReasonChange)}
                  />
                  <button
                    className="btn btn-secondary btn-danger ml-2"
                    type="submit"
                  >
                    Ban
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  moderates() {
    return (
      <div>
        {this.state.moderates.length > 0 && (
          <div className="card border-secondary mb-3">
            <div className="card-body">
              <h5>{i18n.t('moderates')}</h5>
              <ul className="list-unstyled mb-0">
                {this.state.moderates.map(community => (
                  <li key={community.id}>
                    <Link to={`/c/${community.community_name}`}>
                      {community.community_name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }

  follows() {
    return (
      <div>
        {this.state.follows.length > 0 && (
          <div className="card border-secondary mb-3">
            <div className="card-body">
              <h5>{i18n.t('subscribed')}</h5>
              <ul className="list-unstyled mb-0">
                {this.state.follows.map(community => (
                  <li key={community.id}>
                    <Link to={`/c/${community.community_name}`}>
                      {community.community_name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }

  get canAdmin(): boolean {
    return (
      this.state.admins &&
      canMod(
        UserService.Instance.user,
        this.state.admins.map(a => a.id),
        this.state.user_id
      )
    );
  }

  get canSitemod(): boolean {
    return (
      this.state.sitemods &&
      canMod(
        UserService.Instance.user,
        this.state.sitemods.map(a => a.id),
        this.state.user_id
      )
    );
  }

  isModerator() {
    return (
      getAllUserModeratedCommunities({
        siteModerators: this.state.siteModerators || {},
        moderatorId: UserService.Instance.user?.id,
      }).length > 0
    );
  }

  updateUrl(paramUpdates: UrlParams) {
    const page = paramUpdates.page || this.state.page;
    const viewStr =
      paramUpdates.view || UserDetailsView[this.state.view].toLowerCase();
    const sortStr =
      paramUpdates.sort || SortType[this.state.sort].toLowerCase();
    this.props.history.push(
      `/u/${this.state.username}/view/${viewStr}/sort/${sortStr}/page/${page}`
    );
  }

  handlePageChange(page: number) {
    this.updateUrl({ page });
  }

  handleSortChange(val: SortType) {
    this.updateUrl({ sort: SortType[val].toLowerCase(), page: 1 });
  }

  handleViewChange(i: BaseUser, event: any) {
    i.updateUrl({
      view: UserDetailsView[Number(event.target.value)].toLowerCase(),
      page: 1,
    });
  }

  handleUserSettingsShowNsfwChange(i: BaseUser, event: any) {
    i.state.userSettingsForm.show_nsfw = event.target.checked;
    i.setState(i.state);
  }

  handleUserSettingsShowAvatarsChange(i: BaseUser, event: any) {
    i.state.userSettingsForm.show_avatars = event.target.checked;
    UserService.Instance.user.show_avatars = event.target.checked; // Just for instant updates
    i.setState(i.state);
  }

  handleUserSettingsSendNotificationsToEmailChange(i: BaseUser, event: any) {
    i.state.userSettingsForm.send_notifications_to_email = event.target.checked;
    i.setState(i.state);
  }

  handleUserSettingsThemeChange = (value) => {
    changeTheme(value);
    this.setState({ userSettingsForm: { ...this.state.userSettingsForm, theme: value } });
  }

  handleUserSettingsLangChange(i: BaseUser, event: any) {
    i.state.userSettingsForm.lang = event.target.value;
    i18n.changeLanguage(i.state.userSettingsForm.lang);
    i.setState(i.state);
  }

  handleUserSettingsSortTypeChange(val: SortType) {
    // @ts-ignore
    this.state.userSettingsForm.default_sort_type = parseInt(val, 10);
    this.setState(this.state);
  }

  handleUserSettingsListingTypeChange(val: ListingType) {
    this.state.userSettingsForm.default_listing_type = val;
    this.setState(this.state);
  }

  handleUserSettingsEmailChange(i: BaseUser, event: any) {
    i.state.userSettingsForm.email = event.target.value;
    if (i.state.userSettingsForm.email == '' && !i.state.user.email) {
      i.state.userSettingsForm.email = undefined;
    }
    i.setState(i.state);
  }

  handleUserSettingsMatrixUserIdChange(i: BaseUser, event: any) {
    i.state.userSettingsForm.matrix_user_id = event.target.value;
    if (
      i.state.userSettingsForm.matrix_user_id == '' &&
      !i.state.user.matrix_user_id
    ) {
      i.state.userSettingsForm.matrix_user_id = undefined;
    }
    i.setState(i.state);
  }

  handleUserSettingsNewPasswordChange(i: BaseUser, event: any) {
    i.state.userSettingsForm.new_password = event.target.value;
    if (i.state.userSettingsForm.new_password == '') {
      i.state.userSettingsForm.new_password = undefined;
    }
    i.setState(i.state);
  }

  handleUserSettingsNewPasswordVerifyChange(i: BaseUser, event: any) {
    i.state.userSettingsForm.new_password_verify = event.target.value;
    if (i.state.userSettingsForm.new_password_verify == '') {
      i.state.userSettingsForm.new_password_verify = undefined;
    }
    i.setState(i.state);
  }

  handleUserSettingsOldPasswordChange(i: BaseUser, event: any) {
    i.state.userSettingsForm.old_password = event.target.value;
    if (i.state.userSettingsForm.old_password == '') {
      i.state.userSettingsForm.old_password = undefined;
    }
    i.setState(i.state);
  }

  handleImageUpload(i: BaseUser, event: any) {
    event.preventDefault();
    let file = event.target.files[0];
    const imageUploadUrl = `/pictrs/image`;
    const formData = new FormData();
    formData.append('images[]', file);

    i.state.avatarLoading = true;
    i.setState(i.state);

    fetch(imageUploadUrl, {
      method: 'POST',
      body: formData,
    })
      .then(res => res.json())
      .then(res => {
        console.log('pictrs upload:');
        console.log(res);
        if (res.msg == 'ok') {
          let hash = res.files[0].file;
          let url = `${window.location.origin}/pictrs/image/${hash}`;
          i.state.userSettingsForm.avatar = url;
          i.state.avatarLoading = false;
          i.setState(i.state);
        } else {
          i.state.avatarLoading = false;
          i.setState(i.state);
          toast(JSON.stringify(res), 'danger');
        }
      })
      .catch(error => {
        i.state.avatarLoading = false;
        i.setState(i.state);
        toast(error, 'danger');
      });
  }

  removeAvatar(i: BaseUser, event: any) {
    event.preventDefault();
    i.state.userSettingsLoading = true;
    i.state.userSettingsForm.avatar = '';
    i.setState(i.state);

    WebSocketService.Instance.saveUserSettings(i.state.userSettingsForm);
  }

  get checkSettingsAvatar(): boolean {
    return (
      this.state.userSettingsForm.avatar &&
      this.state.userSettingsForm.avatar != ''
    );
  }

  handleUserSettingsSubmit(i: BaseUser, event: any) {
    event.preventDefault();
    i.state.userSettingsLoading = true;
    i.setState(i.state);

    WebSocketService.Instance.saveUserSettings(i.state.userSettingsForm);

    let pronounsValue = null;

    if (i.state.pronouns !== 'none' && i.state.pronouns !== '') {
      pronounsValue = i.state.pronouns;

      if (
        i.state.additionalPronouns !== 'none' &&
        i.state.additionalPronouns !== ''
      ) {
        pronounsValue += `,${i.state.additionalPronouns}`;
      }
    }

    WebSocketService.Instance.setUserTags({
      tag: 'pronouns',
      value: pronounsValue,
    });
  }

  handlePronounsChange(e: any) {
    this.setState({ pronouns: e.target.value });
  }

  handleAdditionalPronounsChange(e: any) {
    this.setState({ additionalPronouns: e.target.value });
  }

  handleDeleteAccountShowConfirmToggle(i: BaseUser, event: any) {
    event.preventDefault();
    i.state.deleteAccountShowConfirm = !i.state.deleteAccountShowConfirm;
    i.setState(i.state);
  }

  handleDeleteAccountPasswordChange(i: BaseUser, event: any) {
    i.state.deleteAccountForm.password = event.target.value;
    i.setState(i.state);
  }

  handleLogoutClick() {
    UserService.Instance.logout();
    this.props.history.push('/');
  }

  handleDeleteAccount(i: BaseUser, event: any) {
    event.preventDefault();
    i.state.deleteAccountLoading = true;
    i.setState(i.state);

    WebSocketService.Instance.deleteAccount(i.state.deleteAccountForm);
  }

  handleBanUserShow(i: BaseUser) {
    i.state.banUserShow = !i.state.banUserShow;
    i.setState(i.state);
  }

  handleBanReasonChange(i: BaseUser, event: any) {
    i.state.banReason = event.target.value;
    i.setState(i.state);
  }

  handleBan(i: BaseUser, event: any) {
    event.preventDefault();
    if (i.canAdmin || i.canSitemod) {
      const form: BanUserForm = {
        user_id: i.state.user.id,
        ban: true,
        reason: i.state.banReason,
      };
      WebSocketService.Instance.banUser(form);
    }

    if (i.isModerator()) {
      const communityIds = getAllUserModeratedCommunities({
        siteModerators: i.state.siteModerators,
        moderatorId: UserService.Instance.user.id,
      });

      communityIds.forEach(communityId => {
        WebSocketService.Instance.banFromCommunity({
          community_id: communityId,
          user_id: i.state.user.id,
          ban: true,
          reason: i.state.banReason,
        });
      });
    }

    i.state.banReason = null;
    i.state.banUserShow = false;

    i.setState(i.state);
  }

  parseMessage(msg: WebSocketJsonResponse) {
    console.log(msg);
    const res = wsJsonToRes(msg);
    if (msg.error) {
      toast(i18n.t(msg.error), 'danger');
      if (msg.error == 'couldnt_find_that_username_or_email') {
        this.props.history.push('/');
      }
      this.setState({
        deleteAccountLoading: false,
        avatarLoading: false,
        userSettingsLoading: false,
      });
      return;
    } else if (res.op == UserOperation.GetUserDetails) {
      // Since the UserDetails contains posts/comments as well as some general user info we listen here as well
      // and set the parent state if it is not set or differs
      const data = res.data as UserDetailsResponse;
      if (this.state.user.id !== data.user.id) {
        this.state.user = data.user;
        this.state.follows = data.follows;
        this.state.moderates = data.moderates;

        WebSocketService.Instance.getUserTags({ user: data.user.id });

        if (this.isCurrentUser) {
          this.state.userSettingsForm.show_nsfw =
            UserService.Instance.user.show_nsfw;
          this.state.userSettingsForm.theme = UserService.Instance.user.theme
            ? UserService.Instance.user.theme
            : 'darkly';
          this.state.userSettingsForm.default_sort_type =
            UserService.Instance.user.default_sort_type;
          this.state.userSettingsForm.default_listing_type =
            UserService.Instance.user.default_listing_type;
          this.state.userSettingsForm.lang = UserService.Instance.user.lang;
          this.state.userSettingsForm.avatar = UserService.Instance.user.avatar;
          this.state.userSettingsForm.email = this.state.user.email;
          this.state.userSettingsForm.send_notifications_to_email = this.state.user.send_notifications_to_email;
          this.state.userSettingsForm.show_avatars =
            UserService.Instance.user.show_avatars;
          this.state.userSettingsForm.matrix_user_id = this.state.user.matrix_user_id;
        }
        this.state.loading = false;
        this.setState(this.state);
      }
    } else if (res.op == UserOperation.SaveUserSettings) {
      const data = res.data as LoginResponse;
      UserService.Instance.login(data);
      this.setState({
        userSettingsLoading: false,
      });
      window.scrollTo(0, 0);
    } else if (res.op == UserOperation.DeleteAccount) {
      this.setState({
        deleteAccountLoading: false,
        deleteAccountShowConfirm: false,
      });
      this.props.history.push('/');
    } else if (res.op == UserOperation.GetSite) {
      const data = res.data as GetSiteResponse;
      this.setState({
        site: data.site,
        admins: data.admins,
        sitemods: data.sitemods,
      });
    } else if (res.op == UserOperation.GetSiteModerators) {
      const data = res.data as GetSiteModeratorsResponse;

      this.setState({
        siteModerators: mapSiteModeratorsResponse(data),
      });
    } else if (res.op == UserOperation.GetUserTag) {
      const data = res.data as UserTagResponse;
      const pronouns = data.tags.pronouns == null ? '' : data.tags.pronouns;
      const pronounsArray = pronouns.split(',');

      this.setState({
        pronouns: pronounsArray[0] || 'none',
        additionalPronouns: pronounsArray[1] || 'none',
      });
    }
  }
}

export const User = withRouter(BaseUser);
