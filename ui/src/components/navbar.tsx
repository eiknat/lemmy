import React, { Component, createRef, RefObject } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Subscription } from 'rxjs';
import { retryWhen, delay, take } from 'rxjs/operators';
import { WebSocketService, UserService } from '../services';
import {
  UserOperation,
  GetRepliesForm,
  GetRepliesResponse,
  GetUserMentionsForm,
  GetUserMentionsResponse,
  GetPrivateMessagesForm,
  PrivateMessagesResponse,
  SortType,
  GetSiteResponse,
  Comment,
  CommentResponse,
  PrivateMessage,
  UserView,
  PrivateMessageResponse,
  WebSocketJsonResponse,
} from '../interfaces';
import {
  wsJsonToRes,
  pictrsAvatarThumbnail,
  showAvatars,
  fetchLimit,
  isCommentType,
  toast,
  messageToastify,
  md,
  imagesDownsize,
  setTheme,
} from '../utils';
import { BASE_PATH } from '../isProduction';
import { version } from '../version';
import { i18n } from '../i18next';
import { Icon } from './icon';
import { CommunityDropdown } from './community-dropdown';
import { linkEvent } from '../linkEvent';
import { Box } from 'theme-ui';

interface NavbarState {
  isLoggedIn: boolean;
  expanded: boolean;
  replies: Array<Comment>;
  mentions: Array<Comment>;
  messages: Array<PrivateMessage>;
  unreadCount: number;
  siteName: string;
  version: string;
  admins: Array<UserView>;
  sitemods: Array<UserView>;
  searchParam: string;
  toggleSearch: boolean;
  creatingCommunitiesEnabled: boolean;
  communityDropdownShown: boolean;
  siteLoading: boolean;
}

class UnwrappedNavbar extends Component<any, NavbarState> {
  private wsSub: Subscription;
  private userSub: Subscription;
  private unreadCountSub: Subscription;
  private searchTextField: RefObject<HTMLInputElement>;
  emptyState: NavbarState = {
    isLoggedIn: false,
    unreadCount: 0,
    replies: [],
    mentions: [],
    messages: [],
    expanded: false,
    siteName: undefined,
    version: undefined,
    admins: [],
    sitemods: [],
    searchParam: '',
    toggleSearch: false,
    creatingCommunitiesEnabled: false,
    communityDropdownShown: false,
    siteLoading: true,
  };

  state = this.emptyState;

  componentDidMount() {
    // Subscribe to user changes
    this.userSub = UserService.Instance.jwtSub.subscribe(res => {
      if (res !== undefined) {
        this.requestNotificationPermission();
      } else {
        this.state.isLoggedIn = false;
      }
      WebSocketService.Instance.getSite();
      this.setState(this.state);
    });

    this.wsSub = WebSocketService.Instance.subject
      .pipe(retryWhen(errors => errors.pipe(delay(3000), take(10))))
      .subscribe(
        msg => this.parseMessage(msg),
        err => console.error(err),
        () => console.log('complete')
      );

    this.unreadCountSub = UserService.Instance.unreadCountSub.subscribe(res => {
      this.setState({ unreadCount: res });
    });

    this.searchTextField = createRef();
  }

  handleSearchParam(i: UnwrappedNavbar, event: any) {
    i.state.searchParam = event.target.value;
    i.setState(i.state);
  }

  updateUrl() {
    const searchParam = this.state.searchParam;
    this.setState({ searchParam: '' });
    this.setState({ toggleSearch: false });
    if (searchParam === '') {
      this.props.history.push(`/search/`);
    } else {
      this.props.history.push(
        `/search/q/${searchParam}/type/all/sort/topall/page/1`
      );
    }
  }

  handleSearchSubmit(i: UnwrappedNavbar, event: any) {
    event.preventDefault();
    i.updateUrl();
  }

  handleSearchBtn(i: UnwrappedNavbar, event: any) {
    event.preventDefault();
    i.setState({ toggleSearch: true });

    i.searchTextField.current.focus();
    const offsetWidth = i.searchTextField.current.offsetWidth;
    if (i.state.searchParam && offsetWidth > 100) {
      i.updateUrl();
    }
  }

  handleSearchBlur(i: UnwrappedNavbar, event: any) {
    if (!(event.relatedTarget && event.relatedTarget.name !== 'search-btn')) {
      i.state.toggleSearch = false;
      i.setState(i.state);
    }
  }

  render() {
    return this.navbar();
  }

  // when the route is changed, close the navbar
  componentDidUpdate(_lastProps: any) {
    if (_lastProps.location.pathname !== this.props.location.pathname) {
      this.setState({ expanded: false });
    }
  }

  componentWillUnmount() {
    this.wsSub.unsubscribe();
    this.userSub.unsubscribe();
    this.unreadCountSub.unsubscribe();
  }

  showCreateCommunityNav() {
    if (this.canAdmin) return true;

    return this.state.creatingCommunitiesEnabled;
  }

  // TODO class active corresponding to current page
  navbar() {
    return (
      <>
        <Box
          as="nav"
          bg="background"
          color="text"
          className="container-fluid navbar navbar-expand-md navbar-light main-navbar shadow p-0 px-3"
        >
          <a className="navbar-brand" href="/">
            <img
              src={`${BASE_PATH}hexbear_head.svg`}
              className="icon icon-navbar"
              alt="vaporwave hammer and sickle logo, courtesy of ancestral potato"
            />
          </a>
          {!this.state.siteLoading ? (
            <Link title={this.state.version} className="navbar-brand" to="/">
              {this.state.siteName}
            </Link>
          ) : (
            <div className="navbar-item">
              <svg className="icon icon-spinner spin">
                <use xlinkHref="#icon-spinner" />
              </svg>
            </div>
          )}
          {this.state.isLoggedIn && (
            <Link
              className="ml-auto p-0 navbar-toggler nav-link"
              to="/inbox"
              title={i18n.t('inbox')}
            >
              <Icon name="notification" />
              {this.state.unreadCount > 0 && (
                <span className="ml-1 badge badge-light badge-pink">
                  {this.state.unreadCount}
                </span>
              )}
            </Link>
          )}
          <button
            className="navbar-toggler"
            type="button"
            aria-label="menu"
            onClick={linkEvent(this, this.expandNavbar)}
            data-tippy-content={i18n.t('expand_here')}
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div
            className={`${!this.state.expanded && 'collapse'} navbar-collapse`}
          >
            <ul className="navbar-nav my-2 mr-auto">
              <li className="nav-item">
                <button
                  className="nav-link btn btn-inline "
                  //to="/communities"
                  title={i18n.t('communities')}
                  id="community-button"
                  onClick={linkEvent(this, this.showCommunityDropdown)}
                >
                  {i18n.t('communities')}
                </button>
              </li>
              <li className="nav-item">
                <Link
                  className="nav-link"
                  to={{
                    pathname: '/create_post',
                    state: { prevPath: this.currentLocation },
                  }}
                  title={i18n.t('create_post')}
                >
                  {i18n.t('create_post')}
                </Link>
              </li>
              {this.showCreateCommunityNav() && (
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/create_community"
                    title={i18n.t('create_community')}
                  >
                    {i18n.t('create_community')}
                  </Link>
                </li>
              )}
              <li className="nav-item">
                <Link
                  className="nav-link"
                  to="/contributing"
                  title={i18n.t('donate_to_lemmy')}
                >
                  <Icon name="contribute" /> {i18n.t('donate')}
                </Link>
              </li>
            </ul>
            {!this.props.history.location.pathname.match(/^\/search/) && (
              <form
                className="form-inline"
                onSubmit={linkEvent(this, this.handleSearchSubmit)}
              >
                <input
                  className={`form-control mr-0 search-input ${
                    this.state.toggleSearch ? 'show-input' : 'hide-input'
                  }`}
                  onChange={linkEvent(this, this.handleSearchParam)}
                  value={this.state.searchParam}
                  ref={this.searchTextField}
                  type="text"
                  placeholder={i18n.t('search')}
                  onBlur={linkEvent(this, this.handleSearchBlur)}
                />
                <button
                  name="search-btn"
                  onClick={linkEvent(this, this.handleSearchBtn)}
                  className={`btn btn-link ${
                    this.state.toggleSearch ? 'px-2' : 'px-0'
                  }`}
                  style={{ color: 'var(--gray)' }}
                >
                  <Icon name="search" />
                </button>
              </form>
            )}
            <ul className="navbar-nav my-2 navbar-right">
              {this.canAdmin && (
                <li className="nav-item">
                  <Link
                    className="nav-link p-0 px-2 nav-icon"
                    to="/admin"
                    title={i18n.t('admin_settings')}
                  >
                    <svg className="icon">
                      <use xlinkHref="#icon-settings" />
                    </svg>
                  </Link>
                </li>
              )}
            </ul>
            {this.state.isLoggedIn ? (
              <>
                <ul className="navbar-nav my-2">
                  <li className="nav-item">
                    <Link
                      className="nav-link p-0 px-2 nav-icon"
                      to="/inbox"
                      title={i18n.t('inbox')}
                    >
                      <Icon name="notification" />
                      {this.state.unreadCount > 0 && (
                        <span className="ml-1 badge badge-light badge-pink">
                          {this.state.unreadCount}
                        </span>
                      )}
                    </Link>
                  </li>
                </ul>
                <ul className="navbar-nav">
                  <li className="nav-item">
                    <Link
                      className="nav-link"
                      to={`/u/${UserService.Instance.user.name}`}
                      title={i18n.t('settings')}
                    >
                      <span>
                        {UserService.Instance.user.avatar && showAvatars() && (
                          <img
                            src={pictrsAvatarThumbnail(
                              UserService.Instance.user.avatar
                            )}
                            alt="user avatar"
                            height="32"
                            width="32"
                            className="rounded-circle mr-2"
                          />
                        )}
                        {UserService.Instance.user.name}
                      </span>
                    </Link>
                  </li>
                </ul>
              </>
            ) : (
              <ul className="navbar-nav my-2">
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/login"
                    title={i18n.t('login_sign_up')}
                  >
                    {i18n.t('login_sign_up')}
                  </Link>
                </li>
              </ul>
            )}
          </div>
          {this.state.communityDropdownShown && (
            <CommunityDropdown
              posX={this.communityButtonLoc}
              removeDropdown={() => this.showCommunityDropdown(this)}
            />
          )}
        </Box>
        {/* empty space below navbar */}
        <div className="navbar-spacer" />
      </>
    );
  }

  expandNavbar(i: UnwrappedNavbar) {
    i.state.expanded = !i.state.expanded;
    i.setState(i.state);
  }

  showCommunityDropdown(i: UnwrappedNavbar) {
    i.state.communityDropdownShown = !i.state.communityDropdownShown;
    i.setState(i.state);
  }

  parseMessage(msg: WebSocketJsonResponse) {
    // console.log(msg);
    let res = wsJsonToRes(msg);
    if (msg.error) {
      if (msg.error == 'not_logged_in') {
        UserService.Instance.logout();
        location.reload();
      }
      return;
    } else if (msg.reconnect) {
      this.fetchUnreads();
    } else if (res.op == UserOperation.GetReplies) {
      let data = res.data as GetRepliesResponse;
      let unreadReplies = data.replies.filter(r => !r.read);

      this.state.replies = unreadReplies;
      this.state.unreadCount = this.calculateUnreadCount();
      this.setState(this.state);
      this.sendUnreadCount();
    } else if (res.op == UserOperation.GetUserMentions) {
      let data = res.data as GetUserMentionsResponse;
      let unreadMentions = data.mentions.filter(r => !r.read);

      this.state.mentions = unreadMentions;
      this.state.unreadCount = this.calculateUnreadCount();
      this.setState(this.state);
      this.sendUnreadCount();
    } else if (res.op == UserOperation.GetPrivateMessages) {
      let data = res.data as PrivateMessagesResponse;
      let unreadMessages = data.messages.filter(r => !r.read);

      this.state.messages = unreadMessages;
      this.state.unreadCount = this.calculateUnreadCount();
      this.setState(this.state);
      this.sendUnreadCount();
    } else if (res.op == UserOperation.CreateComment) {
      let data = res.data as CommentResponse;

      if (this.state.isLoggedIn) {
        if (data.recipient_ids.includes(UserService.Instance.user.id)) {
          this.state.replies.push(data.comment);
          this.state.unreadCount++;
          this.setState(this.state);
          this.sendUnreadCount();
          this.notify(data.comment);
        }
      }
    } else if (res.op == UserOperation.CreatePrivateMessage) {
      let data = res.data as PrivateMessageResponse;

      if (this.state.isLoggedIn) {
        if (data.message.recipient_id == UserService.Instance.user.id) {
          this.state.messages.push(data.message);
          this.state.unreadCount++;
          this.setState(this.state);
          this.sendUnreadCount();
          this.notify(data.message);
        }
      }
    } else if (res.op == UserOperation.GetSite) {
      let data = res.data as GetSiteResponse;

      if (data.site && !this.state.siteName) {
        this.state.siteName = data.site.name;
        this.state.admins = data.admins;
        this.state.creatingCommunitiesEnabled =
          data.site.enable_create_communities;
      }

      if (data.my_user) {
        UserService.Instance.setUser(data.my_user);

        if (this.state.isLoggedIn == false) {
          this.requestNotificationPermission();
          this.fetchUnreads();
          setTheme(data.my_user.theme, true);
        }

        this.state.isLoggedIn = true;
      }

      this.state.siteLoading = false;
      this.setState(this.state);
    }
  }

  fetchUnreads() {
    let repliesForm: GetRepliesForm = {
      sort: SortType[SortType.New],
      unread_only: true,
      page: 1,
      limit: fetchLimit,
    };

    let userMentionsForm: GetUserMentionsForm = {
      sort: SortType[SortType.New],
      unread_only: true,
      page: 1,
      limit: fetchLimit,
    };

    let privateMessagesForm: GetPrivateMessagesForm = {
      unread_only: true,
      page: 1,
      limit: fetchLimit,
    };

    if (this.currentLocation !== '/inbox') {
      WebSocketService.Instance.getReplies(repliesForm);
      WebSocketService.Instance.getUserMentions(userMentionsForm);
      WebSocketService.Instance.getPrivateMessages(privateMessagesForm);
    }
  }

  get currentLocation() {
    return this.props.history.location.pathname;
  }

  get communityButtonLoc() {
    let doc = document.getElementById('community-button');
    return doc.getBoundingClientRect().left;
  }

  sendUnreadCount() {
    UserService.Instance.unreadCountSub.next(this.state.unreadCount);
  }

  calculateUnreadCount(): number {
    return (
      this.state.replies.filter(r => !r.read).length +
      this.state.mentions.filter(r => !r.read).length +
      this.state.messages.filter(r => !r.read).length
    );
  }

  get canAdmin(): boolean {
    return (
      UserService.Instance.user &&
      this.state.admins.map(a => a.id).includes(UserService.Instance.user.id)
    );
  }

  requestNotificationPermission() {
    if (UserService.Instance.user) {
      document.addEventListener('DOMContentLoaded', function () {
        if (typeof Notification === 'undefined' && window.innerWidth > 768) {
          toast(i18n.t('notifications_error'), 'danger');
          return;
        }

        if (Notification.permission !== 'granted')
          Notification.requestPermission();
      });
    }
  }

  notify(reply: Comment | PrivateMessage) {
    let creator_name = reply.creator_name;
    let creator_avatar = reply.creator_avatar
      ? reply.creator_avatar
      : `${window.location.protocol}//${window.location.host}/apple-touch-icon.png`;
    let link = isCommentType(reply)
      ? `/post/${reply.post_id}/comment/${reply.id}`
      : `/inbox`;
    let htmlBody = imagesDownsize(md.render(reply.content), true, false);
    let body = reply.content; // Unfortunately the notifications API can't do html

    messageToastify(creator_name, creator_avatar, htmlBody, link, {
      history: this.props.history,
    });

    if (Notification.permission !== 'granted') Notification.requestPermission();
    else {
      var notification = new Notification(reply.creator_name, {
        icon: creator_avatar,
        body: body,
      });

      notification.onclick = () => {
        event.preventDefault();
        this.props.history.push(link);
      };
    }
  }
}

export const Navbar = withRouter(UnwrappedNavbar);
