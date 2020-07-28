import {
  Community,
  ListCommunitiesForm,
  SortType,
  GetUserDetailsForm,
  WebSocketJsonResponse,
  UserOperation,
  ListCommunitiesResponse,
  UserDetailsResponse,
  CommunityUser,
} from '../interfaces';
import { Component, linkEvent } from 'inferno';
import { Subscription } from 'rxjs';
import { WebSocketService, UserService } from '../services';
import { retryWhen, delay, take } from 'rxjs/operators';
import { wsJsonToRes, toast } from '../utils';
import { i18n } from '../i18next';
import { Link } from 'inferno-router';
import {
  disableBodyScroll,
  enableBodyScroll,
  clearAllBodyScrollLocks,
} from 'body-scroll-lock';

interface CommunityDropdownState {
  favorites: Array<Community> /*not used right now */;
  subscriptions: Array<CommunityUser>;
  communities: Array<Community>;
  filter: string;
  page: number;
  loading: boolean;
}

interface CommunityDropdownProps {
  posX: number;
  removeDropdown(): any;
}

export class CommunityDropdown extends Component<
  CommunityDropdownProps,
  CommunityDropdownState
> {
  private maxLoad = 100;
  private mainElement;

  private subscription: Subscription;
  private emptyState: CommunityDropdownState = {
    favorites: null,
    subscriptions: null,
    communities: null,
    filter: '',
    page: 1,
    loading: true,
  };

  constructor(props: any, context: any) {
    super(props, context);
    this.state = this.emptyState;
    this.subscription = WebSocketService.Instance.subject
      .pipe(retryWhen(errors => errors.pipe(delay(3000), take(10))))
      .subscribe(
        msg => this.parseMessage(msg),
        err => console.error(err),
        () => console.log('complete')
      );
    this.fetch();
  }

  componentWillUnmount() {
    clearAllBodyScrollLocks();
  }

  render() {
    return (
      <>
        <div class="dropdown-block" id="blocking-element"></div>
        <div
          class="floating-container"
          style={this.getContainerLoc()}
          id="floating-container"
        >
          {!this.state.loading && (
            <div class="dropdown-content">
              <div style="display:flex">
                <input
                  class="dropdown-filter form-control"
                  placeholder="Filter"
                  onInput={linkEvent(this, this.handleFilterChange)}
                ></input>
                <button
                  class="dropdown-exit btn"
                  onClick={linkEvent(this, this.handleDropdownClose)}
                >
                  <svg class="icon icon-inline">
                    <use xlinkHref="#icon-cancel"></use>
                  </svg>
                </button>
              </div>
              <div class="dropdown-categories">
                <div class="dropdown-category">
                  <h6>Subscribed</h6>
                  {this.state.subscriptions
                    .filter(community =>
                      community.community_name.startsWith(this.state.filter)
                    )
                    .sort(undefined)
                    .map(community => (
                      <>
                        <div class="community-listing">
                          <span
                            class="community-icon"
                            style={
                              'background: ' +
                              this.generateColor(community.community_name)
                            }
                          ></span>
                          <Link
                            class="community-listing-title"
                            to={`/c/${community.community_name}`}
                            onClick={linkEvent(this, this.handleDropdownClose)}
                          >
                            {community.community_name}
                          </Link>
                        </div>
                      </>
                    ))}
                </div>
                <div class="dropdown-category">
                  <h6>Communities</h6>
                  {this.state.communities
                    .filter(community =>
                      community.name.startsWith(this.state.filter)
                    )
                    .map(community => (
                      <>
                        <div class="community-listing">
                          <span
                            class="community-icon"
                            style={
                              'background: ' +
                              this.generateColor(community.name)
                            }
                          ></span>
                          <Link
                            class="community-listing-title"
                            to={`/c/${community.name}`}
                            onClick={linkEvent(this, this.handleDropdownClose)}
                          >
                            {community.name}
                          </Link>
                        </div>
                      </>
                    ))}
                </div>
              </div>
              <Link
                class="dropdown-subtext"
                to="/communities"
                onClick={linkEvent(this, this.handleDropdownClose)}
              >
                More detail
              </Link>
            </div>
          )}
        </div>
      </>
    );
  }

  fetch() {
    let listCommunitiesForm: ListCommunitiesForm = {
      sort: SortType[SortType.TopAll],
      limit: this.maxLoad,
      page: this.state.page,
    };
    let getUserDetailsForm: GetUserDetailsForm = {
      user_id: UserService.Instance.user.id,
      sort: SortType[0],
      saved_only: false,
      page: 1,
      limit: 1,
    };
    WebSocketService.Instance.listCommunities(listCommunitiesForm);
    WebSocketService.Instance.getUserDetails(getUserDetailsForm);
  }

  generateColor(str: string): string {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    var color = '#';
    for (i = 0; i < 3; i++) {
      var value = (hash >> (i * 8)) & 0xff;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  }

  onLoadingComplete() {
    /*are we on mobile?*/
    if (window.matchMedia('only screen and (max-width: 728px)').matches) {
      disableBodyScroll(this.mainElement);
    }
  }

  getContainerLoc() {
    if (!window.matchMedia('only screen and (max-width: 728px)').matches) {
      return {
        left: Math.round(this.props.posX).toString() + 'px',
      };
    } else {
      return {};
    }
  }

  handleDropdownClose(i: CommunityDropdown, event: any) {
    clearAllBodyScrollLocks();
    i.props.removeDropdown();
  }

  handleFilterChange(i: CommunityDropdown, event: any) {
    i.state.filter = event.target.value;
    console.log('filter changed to ' + i.state.filter);
    i.setState(i.state);
  }

  parseMessage(msg: WebSocketJsonResponse) {
    console.log(msg);
    let res = wsJsonToRes(msg);
    if (msg.error) {
      toast(i18n.t(msg.error), 'danger');
      return;
    } else if (res.op == UserOperation.ListCommunities) {
      let data = res.data as ListCommunitiesResponse;
      this.state.communities = data.communities;
      this.setState(this.state);
    } else if (res.op == UserOperation.GetUserDetails) {
      let data = res.data as UserDetailsResponse;
      this.state.subscriptions = data.follows;
      this.state.loading = false;
      this.setState(this.state);
      this.onLoadingComplete();
    }
  }
}
