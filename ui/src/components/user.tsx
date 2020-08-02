import React, { Component,  } from 'react';
import { Link } from 'react-router-dom';
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
} from '../interfaces';
import { WebSocketService, UserService } from '../services';
import {
  wsJsonToRes,
  fetchLimit,
  routeSortTypeToEnum,
  capitalizeFirstLetter,
  themes,
  setTheme,
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
  banUserShow: boolean;
  banReason: string;
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

export class User extends Component<any, UserState> {
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
    view: User.getViewFromProps(this.props.match.view),
    sort: User.getSortTypeFromProps(this.props.match.sort),
    page: User.getPageFromProps(this.props.match.page),
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
    banUserShow: false,
    banReason: null,
  };

  constructor(props: any, context: any) {
    super(props, context);

    this.state = this.emptyState;
    this.handleSortChange = this.handleSortChange.bind(this);
    this.handleUserSettingsSortTypeChange = this.handleUserSettingsSortTypeChange.bind(
      this
    );
    this.handleUserSettingsListingTypeChange = this.handleUserSettingsListingTypeChange.bind(
      this
    );
    this.handlePageChange = this.handlePageChange.bind(this);
    this.isModerator = this.isModerator.bind(this);

    this.state.user_id = Number(this.props.match.params.id) || null;
    this.state.username = this.props.match.params.username;

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
      UserService.Instance.user.id == this.state.user.id
    );
  }

  static getViewFromProps(view: any): UserDetailsView {
    return view
      ? UserDetailsView[capitalizeFirstLetter(view)]
      : UserDetailsView.Overview;
  }

  static getSortTypeFromProps(sort: any): SortType {
    return sort ? routeSortTypeToEnum(sort) : SortType.New;
  }

  static getPageFromProps(page: any): number {
    return page ? Number(page) : 1;
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  static getDerivedStateFromProps(props: any): UserProps {
    return {
      view: this.getViewFromProps(props.match.params.view),
      sort: this.getSortTypeFromProps(props.match.params.sort),
      page: this.getPageFromProps(props.match.params.page),
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
              className="rounded-circle mr-2"
            />
          )}
          <span>/u/{this.state.username}</span>
        </h5>
        {this.state.loading && (
          <h5>
            <svg className="icon icon-spinner spin">
              <use xlinkHref="#icon-spinner"></use>
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
              {(this.canAdmin || this.isModerator()) &&
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
                  <li className="list-inline-item badge badge-danger">
                    {i18n.t('banned')}
                  </li>
                )}
              </ul>
            </h5>
            <div className="d-flex align-items-center mb-2">
              <svg className="icon">
                <use xlinkHref="#icon-cake"></use>
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
              <button
                className="btn btn-block btn-secondary mt-3"
                onClick={linkEvent(this, this.handleLogoutClick)}
              >
                {i18n.t('logout')}
              </button>
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
                    <option value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{i18n.t('theme')}</label>
                <select
                  value={this.state.userSettingsForm.theme}
                  onChange={linkEvent(this, this.handleUserSettingsThemeChange)}
                  className="ml-2 custom-select custom-select-sm w-auto"
                >
                  <option disabled>{i18n.t('theme')}</option>
                  {themes.map(theme => (
                    <option value={theme}>{theme}</option>
                  ))}
                </select>
                <div className="small alert alert-warning my-2">
                  Stick with Darkly for the best ChapoChat experience. Themes are bugged right now, but we'll be rebuilding themes soon so they're extra fancy.
                </div>
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
                <label className="col-lg-5 col-form-label" htmlFor="user-password">
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
                    <label className="form-check-label" htmlFor="user-show-nsfw">
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
                  <label className="form-check-label" htmlFor="user-show-avatars">
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
                <button type="submit" className="btn btn-block btn-secondary mr-4">
                  {this.state.userSettingsLoading ? (
                    <svg className="icon icon-spinner spin">
                      <use xlinkHref="#icon-spinner"></use>
                    </svg>
                  ) : (
                    capitalizeFirstLetter(i18n.t('save'))
                  )}
                </button>
              </div>
              <hr />
              <div className="form-group mb-0">
                <button
                  className="btn btn-block btn-danger"
                  onClick={linkEvent(
                    this,
                    this.handleDeleteAccountShowConfirmToggle
                  )}
                >
                  {i18n.t('delete_account')}
                </button>
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
                    <button
                      className="btn btn-danger mr-4"
                      disabled={!this.state.deleteAccountForm.password}
                      onClick={linkEvent(this, this.handleDeleteAccount)}
                    >
                      {this.state.deleteAccountLoading ? (
                        <svg className="icon icon-spinner spin">
                          <use xlinkHref="#icon-spinner"></use>
                        </svg>
                      ) : (
                        capitalizeFirstLetter(i18n.t('delete'))
                      )}
                    </button>
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
            {(this.canAdmin || this.isModerator()) && (
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
                <div style="display: flex">
                  <input
                    id="reason"
                    placeholder="reason"
                    onChange={linkEvent(this, this.handleBanReasonChange)}
                  ></input>
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
                  <li>
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
                  <li>
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

  isModerator() {
    return (
      getAllUserModeratedCommunities({
        siteModerators: this.state.siteModerators || {},
        moderatorId: UserService.Instance.user.id,
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

  handleViewChange(i: User, event: any) {
    i.updateUrl({
      view: UserDetailsView[Number(event.target.value)].toLowerCase(),
      page: 1,
    });
  }

  handleUserSettingsShowNsfwChange(i: User, event: any) {
    i.state.userSettingsForm.show_nsfw = event.target.checked;
    i.setState(i.state);
  }

  handleUserSettingsShowAvatarsChange(i: User, event: any) {
    i.state.userSettingsForm.show_avatars = event.target.checked;
    UserService.Instance.user.show_avatars = event.target.checked; // Just for instant updates
    i.setState(i.state);
  }

  handleUserSettingsSendNotificationsToEmailChange(i: User, event: any) {
    i.state.userSettingsForm.send_notifications_to_email = event.target.checked;
    i.setState(i.state);
  }

  handleUserSettingsThemeChange(i: User, event: any) {
    i.state.userSettingsForm.theme = event.target.value;
    setTheme(event.target.value, true);
    i.setState(i.state);
  }

  handleUserSettingsLangChange(i: User, event: any) {
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

  handleUserSettingsEmailChange(i: User, event: any) {
    i.state.userSettingsForm.email = event.target.value;
    if (i.state.userSettingsForm.email == '' && !i.state.user.email) {
      i.state.userSettingsForm.email = undefined;
    }
    i.setState(i.state);
  }

  handleUserSettingsMatrixUserIdChange(i: User, event: any) {
    i.state.userSettingsForm.matrix_user_id = event.target.value;
    if (
      i.state.userSettingsForm.matrix_user_id == '' &&
      !i.state.user.matrix_user_id
    ) {
      i.state.userSettingsForm.matrix_user_id = undefined;
    }
    i.setState(i.state);
  }

  handleUserSettingsNewPasswordChange(i: User, event: any) {
    i.state.userSettingsForm.new_password = event.target.value;
    if (i.state.userSettingsForm.new_password == '') {
      i.state.userSettingsForm.new_password = undefined;
    }
    i.setState(i.state);
  }

  handleUserSettingsNewPasswordVerifyChange(i: User, event: any) {
    i.state.userSettingsForm.new_password_verify = event.target.value;
    if (i.state.userSettingsForm.new_password_verify == '') {
      i.state.userSettingsForm.new_password_verify = undefined;
    }
    i.setState(i.state);
  }

  handleUserSettingsOldPasswordChange(i: User, event: any) {
    i.state.userSettingsForm.old_password = event.target.value;
    if (i.state.userSettingsForm.old_password == '') {
      i.state.userSettingsForm.old_password = undefined;
    }
    i.setState(i.state);
  }

  handleImageUpload(i: User, event: any) {
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

  removeAvatar(i: User, event: any) {
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

  handleUserSettingsSubmit(i: User, event: any) {
    event.preventDefault();
    i.state.userSettingsLoading = true;
    i.setState(i.state);

    WebSocketService.Instance.saveUserSettings(i.state.userSettingsForm);
  }

  handleDeleteAccountShowConfirmToggle(i: User, event: any) {
    event.preventDefault();
    i.state.deleteAccountShowConfirm = !i.state.deleteAccountShowConfirm;
    i.setState(i.state);
  }

  handleDeleteAccountPasswordChange(i: User, event: any) {
    i.state.deleteAccountForm.password = event.target.value;
    i.setState(i.state);
  }

  handleLogoutClick(i: User) {
    UserService.Instance.logout();
    i.context.router.history.push('/');
  }

  handleDeleteAccount(i: User, event: any) {
    event.preventDefault();
    i.state.deleteAccountLoading = true;
    i.setState(i.state);

    WebSocketService.Instance.deleteAccount(i.state.deleteAccountForm);
  }

  handleBanUserShow(i: User) {
    i.state.banUserShow = !i.state.banUserShow;
    i.setState(i.state);
  }

  handleBanReasonChange(i: User, event: any) {
    i.state.banReason = event.target.value;
    i.setState(i.state);
  }

  handleBan(i: User, event: any) {
    event.preventDefault();
    if (i.canAdmin) {
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
        this.context.router.history.push('/');
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
      this.context.router.history.push('/');
    } else if (res.op == UserOperation.GetSite) {
      const data = res.data as GetSiteResponse;
      this.setState({
        site: data.site,
        admins: data.admins,
      });
    } else if (res.op == UserOperation.GetSiteModerators) {
      const data = res.data as GetSiteModeratorsResponse;

      this.setState({
        siteModerators: mapSiteModeratorsResponse(data),
      });
    }
  }
}
