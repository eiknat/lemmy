import { Component, linkEvent } from 'inferno';
import {
  WebSocketJsonResponse,
  UserOperation,
  UserDetailsResponse,
  CommunityUser,
  CommentReport,
  PostReport,
  ListCommentReportsResponse,
  ListPostReportsResponse,
  BanFromCommunityForm,
} from '../interfaces';
import { UserService, WebSocketService } from '../services';
import { retryWhen, delay, take, last } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { wsJsonToRes, toast, getUnixTime } from '../utils';
import { i18n } from '../i18next';
import { MomentTime } from './moment-time';
import { Link } from 'inferno-router';
import { report } from 'process';

interface ReportsState {
  moderates: Array<CommunityUser>;
  open: number[];
  commentReportsByCommunity: {
    [communityId: number]: CommentReport[];
  };
  postReportsByCommunity: {
    [communityId: number]: PostReport[];
  };
  currentBanDialog: CommentReport | PostReport | null;
  banReason: string;
  currentRemoveDialog: CommentReport | PostReport | null;
  removeReason: string;
}

export class Reports extends Component<{}, ReportsState> {
  private subscription: Subscription;
  constructor(props: any, context: any) {
    super(props);

    this.state = {
      moderates: [],
      open: [],
      postReportsByCommunity: {},
      commentReportsByCommunity: {},
      banReason: '',
      currentBanDialog: null,
      removeReason: '',
      currentRemoveDialog: null,
    };

    this.handleToggleCommunityDisclosure = this.handleToggleCommunityDisclosure.bind(
      this
    );
    this.handleOpenBanDialog = this.handleOpenBanDialog.bind(this);

    this.subscription = WebSocketService.Instance.subject
      .pipe(retryWhen(errors => errors.pipe(delay(3000), take(10))))
      .subscribe(
        msg => this.parseMessage(msg),
        err => console.error(err),
        () => console.log('complete')
      );
  }

  componentDidMount() {
    this.fetchUserData();
  }

  fetchReports(communityId: number) {
    WebSocketService.Instance.listCommentReports({
      community: communityId,
      limit: 200,
    });

    WebSocketService.Instance.listPostReports({
      community: communityId,
      limit: 200,
    });
  }

  fetchUserData() {
    const user_id = UserService.Instance.user.id;

    WebSocketService.Instance.getUserDetails({
      user_id,
      saved_only: false,
      sort: 'New',
    });
  }

  render() {
    const {
      moderates,
      open,
      postReportsByCommunity,
      commentReportsByCommunity,
    } = this.state;
    console.log(this.state);
    return (
      <div class="container">
        {moderates.map(communityUser => {
          const { community_id, community_name } = communityUser;

          return (
            <div class="mx-3">
              <div class="row">
                <h4>{community_name}</h4>
                <button
                  class="btn btn-sm"
                  onClick={() => {
                    this.fetchReports(community_id);
                    this.handleToggleCommunityDisclosure(community_id);
                  }}
                >
                  {i18n.t('show')}
                </button>
              </div>
              {open.includes(community_id) && (
                <div class="container">
                  <div class="row">
                    <div class="col">
                      <h5>Post reports</h5>
                      {postReportsByCommunity[community_id] == null ? (
                        <p>no reports</p>
                      ) : (
                        postReportsByCommunity[community_id].map(report => (
                          <div class="mb-4">
                            <div
                              style={{
                                width: '100%',
                                display: 'flex',
                                'justify-content': 'space-between',
                              }}
                            >
                              <p class="small my-0">
                                {report.user_name} submitted{' '}
                                <MomentTime
                                  data={{ published: report.time }}
                                  showAgo={true}
                                />
                              </p>
                              <Link to={`/post/${report.post_id}`}>
                                View Original
                              </Link>
                            </div>
                            <p class="my-0">{report.reason}</p>
                            <div class="card p-1">
                              <p class="mb-0">Post Title: {report.post_name}</p>
                              <p class="mb-0">Post Body: {report.post_body}</p>
                              <p class="mb-0">
                                Submitted by:{' '}
                                <Link to={`/u/${report.creator_name}`}>
                                  {report.creator_name}
                                </Link>
                              </p>
                              {report.post_url && (
                                <a href={report.post_url}>URL</a>
                              )}
                            </div>
                            <div style={{ display: 'flex' }}>
                              <button
                                onClick={() => this.handleOpenBanDialog(report)}
                                class="btn"
                              >
                                ban
                              </button>
                              <button class="btn">resolve</button>
                            </div>
                            {this.state.currentBanDialog &&
                              this.state.currentBanDialog.id === report.id && (
                                <div style={{ display: 'flex' }}>
                                  <form
                                    onSubmit={linkEvent(
                                      this,
                                      this.handleBanSubmit
                                    )}
                                  >
                                    <textarea
                                      placeholder={i18n.t('reason')}
                                      class="form-control report-handle-form"
                                      id="ban-reason"
                                      onInput={linkEvent(
                                        this,
                                        this.handleBanReasonChange
                                      )}
                                      value={this.state.banReason}
                                    ></textarea>
                                    <button
                                      class="btn btn-danger mt-1"
                                      type="submit"
                                    >
                                      {i18n.t('ban')}{' '}
                                      {this.state.currentBanDialog.creator_name}
                                    </button>
                                  </form>
                                </div>
                              )}
                          </div>
                        ))
                      )}
                    </div>
                    <div class="col">
                      <h5>comment reports</h5>
                      {commentReportsByCommunity[community_id] == null ? (
                        <p>no reports</p>
                      ) : (
                        commentReportsByCommunity[community_id].map(report => (
                          <div class="mb-4">
                            <div
                              style={{
                                width: '100%',
                                display: 'flex',
                                'justify-content': 'space-between',
                              }}
                            >
                              <p class="small my-0">
                                submitted{' '}
                                <MomentTime
                                  data={{ published: report.time }}
                                  showAgo={true}
                                />
                                {' • '}
                              </p>
                            </div>
                            <p class="my-0">{report.reason}</p>
                            <div class="card p-1">
                              <p class="mb-0">{report.comment_text}</p>
                            </div>
                            <div style={{ display: 'flex' }}>
                              <button
                                onClick={() => this.handleOpenBanDialog(report)}
                                class="btn"
                              >
                                ban
                              </button>
                              <button class="btn">remove</button>
                              <button class="btn">resolve</button>
                            </div>
                            {this.state.currentBanDialog &&
                              this.state.currentBanDialog.id === report.id && (
                                <div style={{ display: 'flex' }}>
                                  <form
                                    onSubmit={linkEvent(
                                      this,
                                      this.handleBanSubmit
                                    )}
                                  >
                                    <textarea
                                      placeholder={i18n.t('reason')}
                                      class="form-control report-handle-form"
                                      onChange={linkEvent(
                                        this,
                                        this.handleBanReasonChange
                                      )}
                                      value={this.state.banReason}
                                    ></textarea>
                                    <button class="btn" type="submit">
                                      ban
                                    </button>
                                  </form>
                                </div>
                              )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  handleToggleCommunityDisclosure(communityId: number) {
    if (this.state.open.includes(communityId)) {
      this.setState({
        open: [...this.state.open].filter(id => id !== communityId),
      });
      return;
    }

    this.setState({ open: [...this.state.open, communityId] });
  }

  handleOpenBanDialog(report: PostReport | CommentReport) {
    this.setState({ currentBanDialog: report, banReason: '' });
  }

  handleOpenRemoveDialog(report: PostReport | CommentReport) {
    this.setState({ currentRemoveDialog: report, removeReason: '' });
  }

  handleBanSubmit(i: Reports, event: any) {
    event.preventDefault();

    const form: BanFromCommunityForm = {
      user_id: i.state.currentBanDialog.creator_id,
      community_id: i.state.currentBanDialog.community_id,
      ban: true,
      reason: i.state.banReason,
      expires: null,
    };

    WebSocketService.Instance.banFromCommunity(form);

    i.setState({
      currentBanDialog: null,
      banReason: '',
    });
  }

  handleBanReasonChange(i: Reports, event: any) {
    i.state.banReason = event.target.value;
    i.setState(i.state);
  }

  parseMessage(msg: WebSocketJsonResponse) {
    console.log(msg);
    const res = wsJsonToRes(msg);

    if (msg.error) {
      toast(i18n.t(msg.error), 'danger');
      if (msg.error === 'couldnt_find_that_username_or_email') {
        this.context.router.history.push('/');
      }
      return;
    } else if (res.op === UserOperation.GetUserDetails) {
      const data = res.data as UserDetailsResponse;
      this.setState({
        moderates: data.moderates,
      });
    } else if (res.op === UserOperation.ListCommentReports) {
      const data = res.data as ListCommentReportsResponse;

      if (data.reports.length === 0) {
        return;
      }

      const community_id = data.reports[0].community_id;

      this.setState({
        commentReportsByCommunity: {
          ...this.state.commentReportsByCommunity,
          [community_id]: data.reports,
        },
      });
    } else if (res.op === UserOperation.ListPostReports) {
      const data = res.data as ListPostReportsResponse;

      if (data.reports.length === 0) {
        return;
      }

      const community_id = data.reports[0].community_id;

      this.setState({
        postReportsByCommunity: {
          ...this.state.postReportsByCommunity,
          [community_id]: data.reports,
        },
      });
    }
  }
}
