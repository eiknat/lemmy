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
  CommentForm,
  PostForm,
  GetReportCountResponse,
  GetCommunityResponse,
  Community as CommunityI,
} from '../interfaces';
import { UserService, WebSocketService } from '../services';
import { retryWhen, delay, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { wsJsonToRes, toast } from '../utils';
import { i18n } from '../i18next';
import { MomentTime } from './moment-time';
import { Link } from 'inferno-router';

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
  reportCountByCommunity: {
    [communityId: number]: {
      commentReports: number;
      postReports: number;
    };
  };
  communitiesById: {
    [communityId: number]: CommunityI;
  };
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
      reportCountByCommunity: {},
      banReason: '',
      currentBanDialog: null,
      removeReason: '',
      currentRemoveDialog: null,
      communitiesById: {},
    };

    this.handleToggleCommunityDisclosure = this.handleToggleCommunityDisclosure.bind(
      this
    );
    this.handleOpenBanDialog = this.handleOpenBanDialog.bind(this);
    this.handleOpenRemoveDialog = this.handleOpenRemoveDialog.bind(this);
    this.handleResolvePostReport = this.handleResolvePostReport.bind(this);
    this.handleResolveCommentReport = this.handleResolveCommentReport.bind(
      this
    );

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

  componentDidUpdate(_, lastState) {
    if (
      JSON.stringify(lastState.moderates) !==
      JSON.stringify(this.state.moderates)
    ) {
      this.state.moderates.forEach(communityUser => {
        this.fetchReportCount(communityUser.community_id);
        this.fetchCommunity(
          communityUser.community_id,
          communityUser.community_name
        );
      });
    }
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

    WebSocketService.Instance.getReportCount({
      community: communityId,
    });
  }

  fetchReportCount(communityId) {
    WebSocketService.Instance.getReportCount({
      community: communityId,
    });
  }

  fetchCommunity(communityId, communityName) {
    WebSocketService.Instance.getCommunity({
      id: communityId,
      name: communityName,
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
      banReason,
      currentBanDialog,
      currentRemoveDialog,
      removeReason,
      reportCountByCommunity,
      communitiesById,
    } = this.state;

    return (
      <div class="container">
        {moderates.map(communityUser => {
          const { community_id, community_name } = communityUser;

          if (communitiesById[community_id] == null) {
            return null;
          }

          if (
            communitiesById[community_id].removed ||
            communitiesById[community_id].deleted
          ) {
            return null;
          }

          return (
            <div class="mx-3">
              <div class="row mb-2">
                <h4>
                  <Link to={`/c/${community_name}`}>{community_name}</Link>
                </h4>
                <button
                  class="btn btn-success ml-4"
                  onClick={() => {
                    this.fetchReports(community_id);
                    this.handleToggleCommunityDisclosure(community_id);
                  }}
                >
                  {i18n.t('show')}
                </button>
              </div>
              <p>
                Post reports:{' '}
                {reportCountByCommunity[community_id]
                  ? reportCountByCommunity[community_id].postReports
                  : 0}
              </p>
              <p>
                Comment reports:{' '}
                {reportCountByCommunity[community_id]
                  ? reportCountByCommunity[community_id].commentReports
                  : 0}
              </p>
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
                                View Context
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
                              {this.canBan(report.creator_id) && (
                                <button
                                  onClick={() =>
                                    this.handleOpenBanDialog(report)
                                  }
                                  class="btn"
                                >
                                  ban
                                </button>
                              )}
                              <button
                                class="btn"
                                onClick={() =>
                                  this.handleOpenRemoveDialog(report)
                                }
                              >
                                remove
                              </button>
                              <button
                                class="btn"
                                onClick={() =>
                                  this.handleResolvePostReport(
                                    report.id,
                                    report.community_id
                                  )
                                }
                              >
                                resolve
                              </button>
                            </div>
                            {this.banDialog({
                              report,
                              currentBanDialog,
                              banReason,
                            })}
                            {this.removeDialog({
                              report,
                              currentRemoveDialog,
                              removeReason,
                              cb: this.handleRemovePostSubmit,
                            })}
                          </div>
                        ))
                      )}
                    </div>
                    <div class="col">
                      <h5>Comment reports</h5>
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
                                {report.user_name} submitted{' '}
                                <MomentTime
                                  data={{ published: report.time }}
                                  showAgo={true}
                                />
                              </p>
                              <Link
                                to={`/post/${report.post_id}/comment/${report.comment_id}`}
                              >
                                View Context
                              </Link>
                            </div>
                            <p class="my-0">{report.reason}</p>
                            <div class="card p-1">
                              <p class="mb-0">
                                Comment Text: {report.comment_text}
                              </p>
                              <p class="mb-0">
                                Submitted by:{' '}
                                <Link to={`/u/${report.creator_name}`}>
                                  {report.creator_name}
                                </Link>
                              </p>
                            </div>
                            <div style={{ display: 'flex' }}>
                              {this.canBan(report.creator_id) && (
                                <button
                                  onClick={() =>
                                    this.handleOpenBanDialog(report)
                                  }
                                  class="btn"
                                >
                                  ban
                                </button>
                              )}
                              <button
                                class="btn"
                                onClick={() =>
                                  this.handleOpenRemoveDialog(report)
                                }
                              >
                                remove
                              </button>
                              <button
                                class="btn"
                                onClick={() =>
                                  this.handleResolveCommentReport(
                                    report.id,
                                    report.community_id
                                  )
                                }
                              >
                                resolve
                              </button>
                            </div>
                            {this.banDialog({
                              report,
                              currentBanDialog,
                              banReason,
                            })}
                            {this.removeDialog({
                              report,
                              currentRemoveDialog,
                              removeReason,
                              cb: this.handleRemoveCommentSubmit,
                            })}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
              <hr />
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

  handleOpenRemoveDialog(report: PostReport | CommentReport) {
    this.setState({ currentRemoveDialog: report, removeReason: '' });
  }

  handleRemoveCommentSubmit(i: Reports, event: any) {
    event.preventDefault();

    const {
      comment_text,
      comment_id,
      creator_id,
      post_id,
    } = i.state.currentRemoveDialog;

    const form: CommentForm = {
      content: comment_text,
      edit_id: comment_id,
      creator_id,
      post_id,
      removed: true,
      reason: i.state.removeReason,
      auth: null,
    };

    WebSocketService.Instance.editComment(form);

    i.setState({
      currentRemoveDialog: null,
      removeReason: '',
    });
  }

  handleRemovePostSubmit(i: Reports, event: any) {
    event.preventDefault();

    const {
      post_name,
      community_id,
      creator_id,
      post_id,
    } = i.state.currentRemoveDialog;

    let form: PostForm = {
      name: post_name,
      community_id,
      edit_id: post_id,
      creator_id,
      removed: true,
      reason: i.state.removeReason,
      nsfw: true,
      auth: null,
    };

    WebSocketService.Instance.editPost(form);
    i.state.currentRemoveDialog = null;
    i.state.removeReason = null;
    i.setState(i.state);
  }

  handleRemoveReasonChange(i: Reports, event: any) {
    i.state.removeReason = event.target.value;
    i.setState(i.state);
  }

  handleResolvePostReport(reportId: string, communityId: number) {
    WebSocketService.Instance.resolvePostReport({
      report: reportId,
    });

    this.setState({
      postReportsByCommunity: {
        ...this.state.postReportsByCommunity,
        [communityId]: this.state.postReportsByCommunity[communityId].filter(
          report => report.id !== reportId
        ),
      },
    });

    this.fetchReportCount(communityId);
  }

  handleResolveCommentReport(reportId: string, communityId: number) {
    WebSocketService.Instance.resolveCommentReport({
      report: reportId,
    });

    this.setState({
      commentReportsByCommunity: {
        ...this.state.commentReportsByCommunity,
        [communityId]: this.state.commentReportsByCommunity[communityId].filter(
          report => report.id !== reportId
        ),
      },
    });

    this.fetchReportCount(communityId);
  }

  banDialog({
    currentBanDialog,
    report,
    banReason,
  }: {
    currentBanDialog: PostReport | CommentReport | null;
    report: PostReport | CommentReport;
    banReason: string;
  }) {
    return (
      currentBanDialog &&
      currentBanDialog.id === report.id && (
        <div style={{ display: 'flex' }}>
          <form onSubmit={linkEvent(this, this.handleBanSubmit)}>
            <textarea
              placeholder={i18n.t('reason')}
              class="form-control report-handle-form"
              id="ban-reason"
              onInput={linkEvent(this, this.handleBanReasonChange)}
              value={banReason}
            />
            <button class="btn btn-danger mt-1" type="submit">
              {i18n.t('ban')} {this.state.currentBanDialog.creator_name}
            </button>
          </form>
        </div>
      )
    );
  }

  removeDialog({
    currentRemoveDialog,
    report,
    removeReason,
    cb,
  }: {
    currentRemoveDialog: PostReport | CommentReport | null;
    report: PostReport | CommentReport;
    removeReason: string;
    cb: (i: Reports, event: any) => void;
  }) {
    return (
      currentRemoveDialog &&
      currentRemoveDialog.id === report.id && (
        <div style={{ display: 'flex' }}>
          <form onSubmit={linkEvent(this, cb)}>
            <textarea
              placeholder={i18n.t('reason')}
              class="form-control report-handle-form"
              id="remove-reason"
              onInput={linkEvent(this, this.handleRemoveReasonChange)}
              value={removeReason}
            />
            <button class="btn btn-danger mt-1" type="submit">
              {i18n.t('remove')}
            </button>
          </form>
        </div>
      )
    );
  }

  canBan(userId: number) {
    return UserService.Instance.user.id !== userId;
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
    } else if (res.op === UserOperation.EditComment) {
      toast(i18n.t('comment_removed'));
    } else if (res.op === UserOperation.EditPost) {
      toast(i18n.t('post_removed'));
    } else if (res.op === UserOperation.BanFromCommunity) {
      toast(i18n.t('user_banned'));
    } else if (res.op === UserOperation.GetReportCount) {
      const data = res.data as GetReportCountResponse;

      this.setState({
        reportCountByCommunity: {
          ...this.state.reportCountByCommunity,
          [data.community]: {
            commentReports: data.comment_reports,
            postReports: data.post_reports,
          },
        },
      });
    } else if (res.op === UserOperation.GetCommunity) {
      const data = res.data as GetCommunityResponse;

      this.setState({
        communitiesById: {
          ...this.state.communitiesById,
          [data.community.id]: data.community,
        },
      });
    }
  }
}
