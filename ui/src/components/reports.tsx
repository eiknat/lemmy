import React, { Component } from 'react';
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
  RemovePostForm,
  GetSiteResponse,
} from '../interfaces';
import { UserService, WebSocketService } from '../services';
import { retryWhen, delay, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { wsJsonToRes, toast, isCommentChanged, isPostChanged } from '../utils';
import { i18n } from '../i18next';
import { MomentTime } from './moment-time';
import { Link, withRouter } from 'react-router-dom';
import { Flex, Spinner } from 'theme-ui';

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
  autoResolve: boolean;
  loading: boolean;
}

export class BaseReports extends Component<any, ReportsState> {
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
      autoResolve: false,
      loading: true,
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
    this.handleBanReasonChange = this.handleBanReasonChange.bind(this);
    this.handleRemoveCommentSubmit = this.handleRemoveCommentSubmit.bind(this);
    this.handleRemovePostSubmit = this.handleRemovePostSubmit.bind(this);
    this.handleAutoResolveChange = this.handleAutoResolveChange.bind(this);
    this.handleBanSubmit = this.handleBanSubmit.bind(this);
    this.handleRemoveReasonChange = this.handleRemoveReasonChange.bind(this);

    this.subscription = WebSocketService.Instance.subject
      .pipe(retryWhen(errors => errors.pipe(delay(3000), take(10))))
      .subscribe(
        msg => this.parseMessage(msg),
        err => console.error(err),
        () => console.log('complete')
      );
  }

  componentDidMount() {
    WebSocketService.Instance.getSite();
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

  fetchReportCount(communityId: number) {
    WebSocketService.Instance.getReportCount({
      community: communityId,
    });
  }

  fetchCommunity(communityId: number, communityName: string) {
    WebSocketService.Instance.getCommunity({
      id: communityId,
      name: communityName,
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
      loading,
    } = this.state;

    if (loading) {
      return (
        <Flex css={{ justifyContent: 'center' }}>
          <Spinner />
        </Flex>
      );
    }

    return (
      <div className="container">
        <div className="card p-2 mb-3">
          <div>
            <label
              style={{ display: 'flex', alignItems: 'center', marginBottom: 0 }}
              htmlFor="autoresolve-checkbox"
            >
              <input
                type="checkbox"
                checked={this.state.autoResolve}
                onChange={this.handleAutoResolveChange}
                id="autoresolve-checkbox"
                className="mr-2"
              />
              Auto Resolve
            </label>
          </div>
        </div>
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
            <div className="mx-3" key={communityUser.id}>
              <div className="row mb-2">
                <h4>
                  <Link to={`/c/${community_name}`}>{community_name}</Link>
                </h4>
                <button
                  className="btn btn-success ml-4"
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
                <div className="container">
                  <div className="row">
                    <div className="col">
                      <h5>Post reports</h5>
                      {postReportsByCommunity[community_id] == null ? (
                        <p>no reports</p>
                      ) : (
                        postReportsByCommunity[community_id].map(report => (
                          <div className="mb-4" key={report.id}>
                            <div
                              style={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'space-between',
                              }}
                            >
                              <p className="small my-0">
                                {report.user_name} submitted{' '}
                                <MomentTime
                                  data={{ published: report.time }}
                                  showAgo
                                />
                              </p>
                              <Link to={`/post/${report.post_id}`}>
                                View Context
                              </Link>
                            </div>
                            <p className="my-0">{report.reason}</p>
                            <div className="card p-1">
                              <p className="mb-0">
                                Post Title: {report.post_name}
                              </p>
                              <p className="mb-0">
                                Post Body: {report.post_body}
                              </p>
                              <p className="mb-0">
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
                                  className="btn"
                                >
                                  ban
                                </button>
                              )}
                              <button
                                className="btn"
                                onClick={() =>
                                  this.handleOpenRemoveDialog(report)
                                }
                              >
                                remove
                              </button>
                              <button
                                className="btn"
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
                    <div className="col">
                      <h5>Comment reports</h5>
                      {commentReportsByCommunity[community_id] == null ? (
                        <p>no reports</p>
                      ) : (
                        commentReportsByCommunity[community_id].map(report => (
                          <div className="mb-4" key={report.id}>
                            <div
                              style={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'space-between',
                              }}
                            >
                              <p className="small my-0">
                                {report.user_name} submitted{' '}
                                <MomentTime
                                  data={{ published: report.time }}
                                  showAgo
                                />
                              </p>
                              <Link
                                to={`/post/${report.post_id}/comment/${report.comment_id}`}
                              >
                                View Context
                              </Link>
                            </div>
                            <p className="my-0">{report.reason}</p>
                            <div className="card p-1">
                              <p className="mb-0">
                                Comment Text: {report.comment_text}
                              </p>
                              <p className="mb-0">
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
                                  className="btn"
                                >
                                  ban
                                </button>
                              )}
                              <button
                                className="btn"
                                onClick={() =>
                                  this.handleOpenRemoveDialog(report)
                                }
                              >
                                remove
                              </button>
                              <button
                                className="btn"
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
      this.setState(state => ({
        open: [...state.open].filter(id => id !== communityId),
      }));
      return;
    }

    this.setState(state => ({ open: [...state.open, communityId] }));
  }

  handleOpenBanDialog(report: PostReport | CommentReport) {
    this.setState({ currentBanDialog: report, banReason: '' });
  }

  handleBanSubmit(event) {
    event.preventDefault();

    const form: BanFromCommunityForm = {
      user_id: this.state.currentBanDialog.creator_id,
      community_id: this.state.currentBanDialog.community_id,
      ban: true,
      reason: this.state.banReason,
      expires: null,
    };

    WebSocketService.Instance.banFromCommunity(form);

    this.setState({
      currentBanDialog: null,
      banReason: '',
    });
  }

  handleBanReasonChange(event: any) {
    this.setState({ banReason: event.target.value });
  }

  handleOpenRemoveDialog(report: PostReport | CommentReport) {
    this.setState({ currentRemoveDialog: report, removeReason: '' });
  }

  handleRemoveCommentSubmit() {
    event.preventDefault();

    const {
      comment_text,
      comment_id,
      creator_id,
      community_id,
      post_id,
      id,
    } = this.state.currentRemoveDialog as CommentReport;

    const form: CommentForm = {
      content: comment_text,
      edit_id: comment_id,
      creator_id,
      post_id,
      removed: true,
      reason: this.state.removeReason,
      auth: null,
    };

    WebSocketService.Instance.editComment(form);

    if (this.state.autoResolve) {
      this.handleResolveCommentReport(id, community_id);
    }

    this.setState({
      currentRemoveDialog: null,
      removeReason: '',
    });
  }

  handleRemovePostSubmit() {
    event.preventDefault();

    const { post_name, community_id, creator_id, post_id, id } = this.state
      .currentRemoveDialog as PostReport;

    let form: RemovePostForm = {
      edit_id: post_id,
      removed: true,
      reason: this.state.removeReason,
      auth: null,
    };

    if (this.state.autoResolve) {
      this.handleResolvePostReport(id, community_id);
    }

    WebSocketService.Instance.removePost(form);

    this.setState({
      currentRemoveDialog: null,
      removeReason: null,
    });
  }

  handleRemoveReasonChange(event: any) {
    this.setState({ removeReason: event.target.value });
  }

  handleResolvePostReport(reportId: string, communityId: number) {
    WebSocketService.Instance.resolvePostReport({
      report: reportId,
    });

    this.setState(state => ({
      postReportsByCommunity: {
        ...state.postReportsByCommunity,
        [communityId]: state.postReportsByCommunity[communityId].filter(
          report => report.id !== reportId
        ),
      },
    }));

    this.fetchReportCount(communityId);
  }

  handleResolveCommentReport(reportId: string, communityId: number) {
    WebSocketService.Instance.resolveCommentReport({
      report: reportId,
    });

    this.setState(state => ({
      commentReportsByCommunity: {
        ...state.commentReportsByCommunity,
        [communityId]: state.commentReportsByCommunity[communityId].filter(
          report => report.id !== reportId
        ),
      },
    }));

    this.fetchReportCount(communityId);
  }

  handleAutoResolveChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ autoResolve: e.target.checked });
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
          <form onSubmit={this.handleBanSubmit}>
            <textarea
              placeholder={i18n.t('reason')}
              className="form-control report-handle-form"
              id="ban-reason"
              onChange={this.handleBanReasonChange}
              value={banReason}
            />
            <button className="btn btn-danger mt-1" type="submit">
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
    cb: () => void;
  }) {
    return (
      currentRemoveDialog &&
      currentRemoveDialog.id === report.id && (
        <div style={{ display: 'flex' }}>
          <form onSubmit={cb}>
            <textarea
              placeholder={i18n.t('reason')}
              className="form-control report-handle-form"
              id="remove-reason"
              onChange={this.handleRemoveReasonChange}
              value={removeReason}
            />
            <button className="btn btn-danger mt-1" type="submit">
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
        this.props.history.push('/');
      }
      return;
    } else if (res.op === UserOperation.GetSite) {
      const data = res.data as GetSiteResponse;
      if (data.my_user) {
        WebSocketService.Instance.getUserDetails({
          user_id: data.my_user.id,
          saved_only: false,
          sort: 'New',
        });
      }
    } else if (res.op === UserOperation.GetUserDetails) {
      const data = res.data as UserDetailsResponse;
      this.setState({
        moderates: data.moderates,
        loading: false,
      });
    } else if (res.op === UserOperation.ListCommentReports) {
      const data = res.data as ListCommentReportsResponse;

      if (data.reports.length === 0) {
        return;
      }

      const community_id = data.reports[0].community_id;

      this.setState(state => ({
        commentReportsByCommunity: {
          ...state.commentReportsByCommunity,
          [community_id]: data.reports,
        },
      }));
    } else if (res.op === UserOperation.ListPostReports) {
      const data = res.data as ListPostReportsResponse;

      if (data.reports.length === 0) {
        return;
      }

      const community_id = data.reports[0].community_id;

      this.setState(state => ({
        postReportsByCommunity: {
          ...state.postReportsByCommunity,
          [community_id]: data.reports,
        },
      }));
    } else if (isCommentChanged(res.op)) {
      toast(i18n.t('comment_removed'));
    } else if (isPostChanged(res.op)) {
      toast(i18n.t('post_removed'));
    } else if (res.op === UserOperation.BanFromCommunity) {
      toast(i18n.t('user_banned'));
    } else if (res.op === UserOperation.GetReportCount) {
      const data = res.data as GetReportCountResponse;

      this.setState(state => ({
        reportCountByCommunity: {
          ...state.reportCountByCommunity,
          [data.community]: {
            commentReports: data.comment_reports,
            postReports: data.post_reports,
          },
        },
      }));
    } else if (res.op === UserOperation.GetCommunity) {
      const data = res.data as GetCommunityResponse;

      this.setState(state => ({
        communitiesById: {
          ...state.communitiesById,
          [data.community.id]: data.community,
        },
      }));
    }
  }
}

export const Reports = withRouter(BaseReports);
