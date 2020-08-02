/* eslint @typescript-eslint/require-array-sort-compare: 0 */

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
import React, { Component, createRef } from 'react';
import { Subscription } from 'rxjs';
import { WebSocketService, UserService } from '../services';
import { retryWhen, delay, take } from 'rxjs/operators';
import { wsJsonToRes, toast } from '../utils';
import { i18n } from '../i18next';
import { Link } from 'react-router-dom';
import { disableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock';
import { linkEvent } from '../linkEvent';

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
  private thisRef;
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

    this.thisRef = createRef();
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    clearAllBodyScrollLocks();
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  render() {
    return (
      <>
        <div className="dropdown-block" id="blocking-element"></div>
        <div
          className="floating-container"
          style={this.getContainerLoc()}
          id="floating-container"
          ref={this.thisRef}
        >
          {!this.state.loading && (
            <div className="dropdown-content">
              <div style="display:flex">
                <input
                  className="dropdown-filter form-control"
                  placeholder="Filter"
                  onInput={linkEvent(this, this.handleFilterChange)}
                ></input>
                <button
                  className="dropdown-exit btn"
                  onClick={linkEvent(this, this.handleDropdownClose)}
                >
                  <svg className="icon icon-inline">
                    <use xlinkHref="#icon-cancel"></use>
                  </svg>
                </button>
              </div>
              {this.sortedCommunities.length > 0 ? (
                <div className="dropdown-categories">
                  {this.sortedSubscriptions.length > 0 && (
                    <div className="dropdown-category">
                      <h6>Subscribed</h6>
                      {this.sortedSubscriptions.map(community => (
                        <>
                          <div className="community-listing">
                            <span
                              className="community-icon"
                              style={
                                'background: ' +
                                this.generateColor(community.community_name)
                              }
                            ></span>
                            <Link
                              className="community-listing-title"
                              to={`/c/${community.community_name}`}
                              onClick={linkEvent(
                                this,
                                this.handleDropdownClose
                              )}
                            >
                              {community.community_name}
                            </Link>
                          </div>
                        </>
                      ))}
                    </div>
                  )}
                  <div className="dropdown-category">
                    <h6>Communities</h6>
                    {this.sortedCommunities.map(community => (
                      <>
                        <div className="community-listing">
                          <span
                            className="community-icon"
                            style={
                              'background: ' +
                              this.generateColor(community.name)
                            }
                          ></span>
                          <Link
                            className="community-listing-title"
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
              ) : (
                <div>
                  <h5>
                    Yikes! Community &apos;{this.state.filter}&apos; does not
                    exist
                  </h5>
                  <p>
                    Suggest new communities to be added on{' '}
                    <Link
                      to="/c/commrequest"
                      onClick={linkEvent(this, this.handleDropdownClose)}
                    >
                      /c/commrequest
                    </Link>
                  </p>
                </div>
              )}
              <Link
                className="dropdown-subtext"
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

  get sortedSubscriptions(): Array<CommunityUser> {
    if (this.state.subscriptions) {
      return this.state.subscriptions
        .filter(community =>
          community.community_name.startsWith(this.state.filter)
        )
        .sort();
    }
    return this.state.subscriptions;
  }

  get sortedCommunities(): Array<Community> {
    return this.state.communities.filter(community => {
      // don't show subscribed communities twice
      let isSubscribed: boolean;
      if (this.state.subscriptions) {
        isSubscribed = this.state.subscriptions.some(
          subscription => subscription.community_id === community.id
        );
      }
      return community.name.startsWith(this.state.filter) && !isSubscribed;
    });
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
    //are we on mobile?
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
    i.setState(i.state);
  }

  handleClickOutside(event: any) {
    if (
      this.thisRef &&
      !this.thisRef.current.contains(event.target) &&
      event.target.id != 'community-button'
    ) {
      this.handleDropdownClose(this, event);
    }
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
