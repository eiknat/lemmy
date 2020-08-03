import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { WebSocketService, UserService } from '../services';
import {
  Post,
  CreatePostLikeForm,
  PostForm as PostFormI,
  SavePostForm,
  CommunityUser,
  UserView,
  BanType,
  BanFromCommunityForm,
  BanUserForm,
  AddModToCommunityForm,
  AddAdminForm,
  TransferSiteForm,
  TransferCommunityForm,
} from '../interfaces';
import { MomentTime } from './moment-time';
import { PostForm } from './post-form';
import { IFramelyCard } from './iframely-card';
import { UserListing } from './user-listing';
import { CommunityLink } from './community-link';
import {
  md,
  mdToHtml,
  canMod,
  isMod,
  isImage,
  isVideo,
  isValidEmbed,
  getUnixTime,
  pictrsImage,
  setupTippy,
  hostname,
  previewLines,
  toast,
} from '../utils';
import { i18n } from '../i18next';
import { User } from './user';
import { Icon } from './icon';
import { RoleBadge } from './comment-node';
import { linkEvent } from '../linkEvent';

interface PostListingState {
  showEdit: boolean;
  showRemoveDialog: boolean;
  removeReason: string;
  showBanDialog: boolean;
  banReason: string;
  banExpires: string;
  banType: BanType;
  reportReason: string;
  showReportDialog: boolean;
  showConfirmTransferSite: boolean;
  showConfirmTransferCommunity: boolean;
  imageExpanded: boolean;
  viewSource: boolean;
  showAdvanced: boolean;
  my_vote: number;
  score: number;
  upvotes: number;
  downvotes: number;
}

interface PostListingProps {
  post: Post;
  showCommunity?: boolean;
  showBody?: boolean;
  moderators?: Array<CommunityUser>;
  admins?: Array<UserView>;
  enableDownvotes: boolean;
  enableNsfw: boolean;
}

export function PostBody({ body }: { body: string }) {
  return (
    <div
      className="md-div post-listing-body"
      dangerouslySetInnerHTML={mdToHtml(body)}
    />
  );
}

class BasePostListing extends Component<PostListingProps, PostListingState> {
  private emptyState: PostListingState = {
    showEdit: false,
    showRemoveDialog: false,
    removeReason: null,
    showBanDialog: false,
    banReason: null,
    banExpires: null,
    banType: BanType.Community,
    reportReason: null,
    showReportDialog: false,
    showConfirmTransferSite: false,
    showConfirmTransferCommunity: false,
    imageExpanded: false,
    viewSource: false,
    showAdvanced: false,
    my_vote: this.props.post.my_vote,
    score: this.props.post.score,
    upvotes: this.props.post.upvotes,
    downvotes: this.props.post.downvotes,
  };

  constructor(props: any, context: any) {
    super(props, context);

    this.state = this.emptyState;
    this.handlePostLike = this.handlePostLike.bind(this);
    this.handlePostDisLike = this.handlePostDisLike.bind(this);
    this.handleEditPost = this.handleEditPost.bind(this);
    this.handleEditCancel = this.handleEditCancel.bind(this);
  }

  componentWillMount() {
    // scroll to top of page when loading post listing
    window.scrollTo(0, 0);
  }

  componentWillReceiveProps(nextProps: PostListingProps) {
    this.state.my_vote = nextProps.post.my_vote;
    this.state.upvotes = nextProps.post.upvotes;
    this.state.downvotes = nextProps.post.downvotes;
    this.state.score = nextProps.post.score;
    if (this.props.post.id !== nextProps.post.id) {
      this.state.imageExpanded = false;
    }
    this.setState(this.state);
  }

  render() {
    return (
      <div className="">
        {!this.state.showEdit ? (
          <>
            {this.listing()}
            {this.body()}
          </>
        ) : (
          <div className="col-12">
            <PostForm
              post={this.props.post}
              onEdit={this.handleEditPost}
              onCancel={this.handleEditCancel}
              enableNsfw={this.props.enableNsfw}
              enableDownvotes={this.props.enableDownvotes}
            />
          </div>
        )}
      </div>
    );
  }

  body() {
    return (
      <div className="row">
        <div className="col-12">
          {this.props.post.url &&
            this.props.showBody &&
            this.props.post.embed_title && (
              <IFramelyCard post={this.props.post} />
            )}
          {this.props.showBody && this.props.post.body && (
            <>
              {this.state.viewSource ? (
                <pre>{this.props.post.body}</pre>
              ) : (
                <PostBody body={this.props.post.body} />
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  imgThumb(src: string) {
    let post = this.props.post;
    return (
      <img
        className={`img-fluid thumbnail rounded ${
          (post.nsfw || post.community_nsfw) && 'img-blur'
        }`}
        src={src}
      />
    );
  }

  getImage(thumbnail: boolean = false) {
    let post = this.props.post;
    if (isImage(post.url)) {
      if (post.url.includes('pictrs')) {
        return pictrsImage(post.url, thumbnail);
      } else if (post.thumbnail_url) {
        return pictrsImage(post.thumbnail_url, thumbnail);
      } else {
        return post.url;
      }
    } else if (post.thumbnail_url) {
      return pictrsImage(post.thumbnail_url, thumbnail);
    }
  }

  thumbnail() {
    let post = this.props.post;

    if (isImage(post.url)) {
      return (
        <span
          className="text-body pointer"
          data-tippy-content={i18n.t('expand_here')}
          onClick={linkEvent(this, this.handleImageExpandClick)}
        >
          {this.imgThumb(this.getImage(true))}
          <Icon name="image" className="icon mini-overlay" />
        </span>
      );
    } else if (post.thumbnail_url) {
      return (
        <>
          {post.embed_html !== null && isValidEmbed(post.url) ? (
            <span
              className="text-body pointer"
              data-tippy-content={i18n.t('expand_here')}
              onClick={linkEvent(this, this.handleImageExpandClick)}
            >
              {this.imgThumb(this.getImage(true))}
              <Icon className="icon mini-overlay" name="link" />
            </span>
          ) : (
            <a
              className="text-body"
              href={post.url}
              target="_blank"
              title={post.url}
              rel="noreferrer"
            >
              {this.imgThumb(this.getImage(true))}
              <Icon className="icon mini-overlay" name="link" />
            </a>
          )}
        </>
      );
    } else if (post.embed_html !== null && isValidEmbed(post.url)) {
      return (
        <span
          className="text-body pointer"
          data-tippy-content={i18n.t('expand_here')}
          onClick={linkEvent(this, this.handleImageExpandClick)}
        >
          <Icon
            className="icon thumbnail mini-overlay"
            style={{ marginTop: '4px' }}
            name="link"
          />
        </span>
      );
    } else if (post.url) {
      if (isVideo(post.url)) {
        return (
          <div className="embed-responsive embed-responsive-16by9">
            <video
              playsinline
              muted
              loop
              controls
              className="embed-responsive-item"
            >
              <source src={post.url} type="video/mp4" />
            </video>
          </div>
        );
      } else {
        return (
          <div className="post-listing-box">
            <a
              className="text-body"
              href={post.url}
              target="_blank"
              title={post.url}
              rel="noreferrer"
            >
              <Icon
                className="icon thumbnail mini-overlay"
                style={{ marginTop: '4px' }}
                name="link"
              />
            </a>
          </div>
        );
      }
    } else {
      return (
        <button
          className="text-body post-body-expand-button post-listing-box"
          title={i18n.t('expand_here')}
          onClick={() =>
            !this.props.showBody && linkEvent(this, this.handleImageExpandClick)
          }
        >
          {post.nsfw ? (
            <svg className="icon thumbnail" style={{ marginTop: '-3px' }}>
              <use xlinkHref="#icon-warning-post"></use>
            </svg>
          ) : (
            <svg className="icon thumbnail">
              <use xlinkHref="#icon-message-square"></use>
            </svg>
          )}
        </button>
      );
    }
  }

  listing() {
    let post = this.props.post;

    const isMobile = window.innerWidth < 768;

    return (
      <div>
        <div className="row">
          <div
            className={`vote-bar small text-center ${
              post.stickied ? 'stickied-border' : ''
            }`}
          >
            <button
              className={`btn-animate btn btn-link p-0 ${
                this.state.my_vote == 1 ? 'text-info' : 'text-muted'
              }`}
              onClick={linkEvent(this, this.handlePostLike)}
              data-tippy-content={i18n.t('upvote')}
            >
              <Icon name="upvote" className="icon upvote" />
            </button>
            <div
              className={`unselectable pointer font-weight-bold text-muted px-1 py-1`}
              data-tippy-content={this.pointsTippy}
            >
              {this.state.score}
            </div>
            {this.props.enableDownvotes && (
              <button
                className={`btn-animate btn btn-link p-0 ${
                  this.state.my_vote == -1 ? 'text-danger' : 'text-muted'
                }`}
                onClick={linkEvent(this, this.handlePostDisLike)}
                data-tippy-content={i18n.t('downvote')}
              >
                <Icon name="downvote" className="icon downvote" />
              </button>
            )}
          </div>
          {/* show thumbnail when not expanded or content is a video */}
          {(!isMobile ||
            (isMobile &&
              !this.state.imageExpanded &&
              (post.body || post.url)) ||
            isVideo(post.url) ||
            post.embed_html !== null ||
            // if it's a text post (doesn't have URL) always show thumbnail when expanded
            (this.state.imageExpanded && post.body && !post.url)) && (
            <div className="col-3 col-sm-2 pr-0 mt-1 thumbnail-wrapper">
              <div className="position-relative">{this.thumbnail()}</div>
            </div>
          )}
          <div
            className={`${
              this.state.imageExpanded ? 'col-sm-12 col-md-8' : 'col-8 col-sm-9'
            } mt post-content`}
          >
            <div className="row">
              <div className="col-12">
                <div className="post-title">
                  <h5 className="mb-0 d-inline">
                    {this.props.showBody && post.url ? (
                      <a
                        className="text-body"
                        href={post.url}
                        target="_blank"
                        title={post.url}
                        rel="noreferrer"
                      >
                        {post.name}
                      </a>
                    ) : (
                      <Link
                        className="text-body"
                        to={`/post/${post.id}`}
                        title={i18n.t('comments')}
                      >
                        {post.name}
                      </Link>
                    )}
                  </h5>
                  {post.url &&
                    !(hostname(post.url) == window.location.hostname) && (
                      <small className="d-inline-block">
                        <a
                          className="ml-2 text-muted font-italic"
                          href={post.url}
                          target="_blank"
                          title={post.url}
                          rel="noreferrer"
                        >
                          {hostname(post.url)}
                          <Icon
                            className="ml-1 icon icon-inline"
                            name="link"
                            size="14px"
                          />
                        </a>
                      </small>
                    )}
                  {(isImage(post.url) ||
                    (post.embed_html !== null && isValidEmbed(post.url)) ||
                    this.props.post.thumbnail_url) && (
                    <>
                      {!this.state.imageExpanded ? (
                        <span
                          className="text-monospace unselectable pointer ml-2 text-muted small"
                          data-tippy-content={i18n.t('expand_here')}
                          onClick={linkEvent(this, this.handleImageExpandClick)}
                        >
                          {/* keeping this for accessibility reasons */}
                        </span>
                      ) : (
                        <span>
                          <span
                            className="text-monospace unselectable pointer ml-2 text-muted small"
                            onClick={linkEvent(
                              this,
                              this.handleImageExpandClick
                            )}
                          >
                            {/* keeping this for accessibility reasons */}
                          </span>
                          <div>
                            <span
                              className="pointer"
                              onClick={linkEvent(
                                this,
                                this.handleImageExpandClick
                              )}
                            >
                              {post.embed_html !== null &&
                              isValidEmbed(post.url) ? (
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: post.embed_html,
                                  }}
                                />
                              ) : (
                                <img
                                  className="img-fluid img-expanded mt-2"
                                  src={this.getImage()}
                                />
                              )}
                            </span>
                          </div>
                        </span>
                      )}
                    </>
                  )}
                  {post.removed && (
                    <small className="ml-2 text-muted font-italic">
                      {i18n.t('removed')}
                    </small>
                  )}
                  {post.deleted && (
                    <small
                      className="unselectable pointer ml-2 text-muted font-italic"
                      data-tippy-content={i18n.t('deleted')}
                    >
                      <svg className={`icon icon-inline text-danger`}>
                        <use xlinkHref="#icon-trash"></use>
                      </svg>
                    </small>
                  )}
                  {post.nsfw && (
                    <div className="badge ml-2 mb-2 nsfw-badge">
                      {i18n.t('nsfw')}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="row">
              <div className="details col-12">
                <ul className="list-inline mb-0 text-muted small">
                  <li className="list-inline-item">
                    <span>{i18n.t('by')} </span>
                    <UserListing
                      user={{
                        name: post.creator_name,
                        avatar: post.creator_avatar,
                        id: post.creator_id,
                        local: post.creator_local,
                        actor_id: post.creator_actor_id,
                      }}
                    />
                    {this.isAdmin && (
                      <RoleBadge role="admin" tooltipText={i18n.t('admin')}>
                        {i18n.t('admin')[0]}
                      </RoleBadge>
                    )}
                    {this.isMod && !this.isAdmin && (
                      <RoleBadge role="mod" tooltipText={i18n.t('mod')}>
                        {i18n.t('mod')[0]}
                      </RoleBadge>
                    )}
                    {(post.banned_from_community || post.banned) && (
                      <span className="mx-1 badge badge-danger">
                        {i18n.t('banned')}
                      </span>
                    )}
                    {this.props.showCommunity && (
                      <span>
                        <span> {i18n.t('to')} </span>
                        <CommunityLink
                          community={{
                            name: post.community_name,
                            id: post.community_id,
                            local: post.community_local,
                            actor_id: post.community_actor_id,
                          }}
                        />
                      </span>
                    )}
                  </li>
                  <li className="list-inline-item">•</li>
                  <li className="list-inline-item">
                    <span>
                      <MomentTime data={post} />
                    </span>
                  </li>
                  {post.stickied && (
                    <small
                      className="unselectable pointer ml-1 font-italic"
                      data-tippy-content={i18n.t('stickied')}
                    >
                      {/* <svg className={`icon custom-icon text-success`}>
                        <use xlinkHref="#icon-pin"></use>
                      </svg> */}
                      <Icon className="icon text-success" name="pin" />
                    </small>
                  )}
                  {post.locked && (
                    <small
                      className="unselectable pointer ml-1 text-muted font-italic"
                      data-tippy-content={i18n.t('locked')}
                    >
                      <svg className={`icon custom-icon text-danger`}>
                        <use xlinkHref="#icon-lock"></use>
                      </svg>
                    </small>
                  )}
                </ul>
                {this.props.post.duplicates && (
                  <ul className="list-inline mb-1 small text-muted">
                    <>
                      <li className="list-inline-item mr-2">
                        {i18n.t('cross_posted_to')}
                      </li>
                      {this.props.post.duplicates.map(post => (
                        <li className="list-inline-item mr-2">
                          <Link to={`/post/${post.id}`}>
                            {post.community_name}
                          </Link>
                        </li>
                      ))}
                    </>
                  </ul>
                )}
                {this.state.showRemoveDialog && (
                  <form
                    className="form-inline"
                    onSubmit={linkEvent(this, this.handleModRemoveSubmit)}
                  >
                    <input
                      type="text"
                      className="form-control mr-2"
                      placeholder={i18n.t('reason')}
                      value={this.state.removeReason}
                      onInput={linkEvent(
                        this,
                        this.handleModRemoveReasonChange
                      )}
                    />
                    <button type="submit" className="btn btn-secondary">
                      {i18n.t('remove_post')}
                    </button>
                  </form>
                )}
                {this.state.showBanDialog && (
                  <form onSubmit={linkEvent(this, this.handleModBanBothSubmit)}>
                    <div className="form-group row">
                      <label
                        className="col-form-label"
                        htmlFor="post-listing-reason"
                      >
                        {i18n.t('reason')}
                      </label>
                      <input
                        type="text"
                        id="post-listing-reason"
                        className="form-control mr-2"
                        placeholder={i18n.t('reason')}
                        value={this.state.banReason}
                        onInput={linkEvent(this, this.handleModBanReasonChange)}
                      />
                    </div>
                    {/* TODO hold off on expires until later */}
                    {/* <div className="form-group row"> */}
                    {/*   <label className="col-form-label">Expires</label> */}
                    {/*   <input type="date" className="form-control mr-2" placeholder={i18n.t('expires')} value={this.state.banExpires} onInput={linkEvent(this, this.handleModBanExpiresChange)} /> */}
                    {/* </div> */}
                    <div className="form-group row">
                      <button type="submit" className="btn btn-secondary">
                        {i18n.t('ban')} {post.creator_name}
                      </button>
                    </div>
                  </form>
                )}
                {this.state.showReportDialog && (
                  <form
                    className="mt-2"
                    onSubmit={linkEvent(this, this.handleReportSubmit)}
                  >
                    <div className="form-group row">
                      <label
                        className="col-form-label"
                        htmlFor="post-listing-report-reason"
                      >
                        {i18n.t('reason')}
                      </label>
                      <input
                        type="text"
                        id="post-listing-report-reason"
                        className="form-control mr-2"
                        placeholder={i18n.t('reason')}
                        value={this.state.reportReason}
                        onInput={linkEvent(this, this.handleReportReasonChange)}
                        maxLength={600}
                      />
                    </div>
                    <div className="form-group row">
                      <button type="submit" className="btn btn-secondary">
                        {i18n.t('submit_report')}
                      </button>
                    </div>
                  </form>
                )}
                <div className="post-listing-details">
                  <Link
                    className="text-muted"
                    title={i18n.t('number_of_comments', {
                      count: post.number_of_comments,
                    })}
                    to={`/post/${post.id}`}
                  >
                    {/* <svg className="mr-1 icon icon-inline">
                        <use xlinkHref="#icon-message-square"></use>
                      </svg> */}
                    <Icon name="comment" className="icon mr-1" />
                    {i18n.t('number_of_comments', {
                      count: post.number_of_comments,
                    })}
                  </Link>
                  {UserService.Instance.user && !this.props.showBody && (
                    <button
                      className="btn btn-sm btn-link btn-animate text-muted p-0 px-2"
                      onClick={linkEvent(this, this.handleReportPost)}
                      data-tippy-content={i18n.t('snitch')}
                    >
                      <Icon name="report" />
                    </button>
                  )}
                  {this.state.upvotes !== this.state.score && (
                    <>
                      <span
                        className="unselectable pointer mx-1 inline-vote-details"
                        data-tippy-content={this.pointsTippy}
                      >
                        <div className="list-inline-item text-muted">
                          <Icon name="upvote" className="icon mr-1" />
                          {this.state.upvotes}
                        </div>
                        <div className="list-inline-item text-muted">
                          <Icon name="downvote" className="icon mr-1" />
                          {this.state.downvotes}
                        </div>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <ul className="list-inline mb-1 text-muted font-weight-bold">
          {UserService.Instance.user && (
            <>
              {this.props.showBody && (
                <>
                  <li className="list-inline-item">
                    <button
                      className="btn btn-sm btn-link btn-animate text-muted"
                      onClick={linkEvent(this, this.handleSavePostClick)}
                      data-tippy-content={
                        post.saved ? i18n.t('unsave') : i18n.t('save')
                      }
                    >
                      <Icon
                        name="star"
                        className={`icon icon-inline ${
                          post.saved && 'text-warning'
                        }`}
                      />
                    </button>
                  </li>
                  <li className="list-inline-item">
                    <Link
                      className="btn btn-sm btn-link btn-animate text-muted"
                      to={`/create_post${this.crossPostParams}`}
                      title={i18n.t('cross_post')}
                    >
                      <svg className="icon icon-inline">
                        <use xlinkHref="#icon-copy"></use>
                      </svg>
                    </Link>
                  </li>
                  <li className="list-inline-item">
                    <button
                      className="btn btn-sm btn-link btn-animate text-muted"
                      onClick={linkEvent(this, this.handleReportPost)}
                      data-tippy-content={i18n.t('snitch')}
                    >
                      <Icon name="report" />
                    </button>
                  </li>
                </>
              )}
              {this.myPost && this.props.showBody && (
                <>
                  <li className="list-inline-item">
                    <button
                      className="btn btn-sm btn-link btn-animate text-muted"
                      onClick={linkEvent(this, this.handleEditClick)}
                      data-tippy-content={i18n.t('edit')}
                    >
                      <Icon name="edit" />
                    </button>
                  </li>
                  <li className="list-inline-item">
                    <button
                      className="btn btn-sm btn-link btn-animate text-muted"
                      onClick={linkEvent(this, this.handleDeleteClick)}
                      data-tippy-content={
                        !post.deleted ? i18n.t('delete') : i18n.t('restore')
                      }
                    >
                      <svg
                        className={`icon icon-inline ${
                          post.deleted && 'text-danger'
                        }`}
                      >
                        <use xlinkHref="#icon-trash"></use>
                      </svg>
                    </button>
                  </li>
                </>
              )}

              {!this.state.showAdvanced && this.props.showBody ? (
                <li className="list-inline-item">
                  <button
                    className="btn btn-sm btn-link btn-animate text-muted"
                    onClick={linkEvent(this, this.handleShowAdvanced)}
                    data-tippy-content={i18n.t('more')}
                  >
                    <Icon name="more" />
                  </button>
                </li>
              ) : (
                <>
                  {this.props.showBody && post.body && (
                    <li className="list-inline-item">
                      <button
                        className="btn btn-sm btn-link btn-animate text-muted"
                        onClick={linkEvent(this, this.handleViewSource)}
                        data-tippy-content={i18n.t('view_source')}
                      >
                        <svg
                          className={`icon icon-inline ${
                            this.state.viewSource && 'text-success'
                          }`}
                        >
                          <use xlinkHref="#icon-file-text"></use>
                        </svg>
                      </button>
                    </li>
                  )}
                  {this.canModOnSelf && (
                    <>
                      <li className="list-inline-item">
                        <button
                          className="btn btn-sm btn-link btn-animate text-muted"
                          onClick={linkEvent(this, this.handleModLock)}
                          data-tippy-content={
                            post.locked ? i18n.t('unlock') : i18n.t('lock')
                          }
                        >
                          <svg
                            className={`icon icon-inline ${
                              post.locked && 'text-danger'
                            }`}
                          >
                            <use xlinkHref="#icon-lock"></use>
                          </svg>
                        </button>
                      </li>
                      <li className="list-inline-item">
                        <button
                          className="btn btn-sm btn-link btn-animate text-muted"
                          onClick={linkEvent(this, this.handleModSticky)}
                          data-tippy-content={
                            post.stickied
                              ? i18n.t('unsticky')
                              : i18n.t('sticky')
                          }
                        >
                          <svg
                            className={`icon icon-inline ${
                              post.stickied && 'text-success'
                            }`}
                          >
                            <use xlinkHref="#icon-pin"></use>
                          </svg>
                        </button>
                      </li>
                    </>
                  )}
                  {/* Mods can ban from community, and appoint as mods to community */}
                  {(this.canMod || this.canAdmin) && (
                    <li className="list-inline-item">
                      {!post.removed ? (
                        <span
                          className="pointer"
                          onClick={linkEvent(this, this.handleModRemoveShow)}
                        >
                          {i18n.t('remove')}
                        </span>
                      ) : (
                        <span
                          className="pointer"
                          onClick={linkEvent(this, this.handleModRemoveSubmit)}
                        >
                          {i18n.t('restore')}
                        </span>
                      )}
                    </li>
                  )}
                  {this.canMod && (
                    <>
                      {!this.isMod && (
                        <li className="list-inline-item">
                          {!post.banned_from_community ? (
                            <span
                              className="pointer"
                              onClick={linkEvent(
                                this,
                                this.handleModBanFromCommunityShow
                              )}
                            >
                              {i18n.t('ban')}
                            </span>
                          ) : (
                            <span
                              className="pointer"
                              onClick={linkEvent(
                                this,
                                this.handleModBanFromCommunitySubmit
                              )}
                            >
                              {i18n.t('unban')}
                            </span>
                          )}
                        </li>
                      )}
                      {!post.banned_from_community && (
                        <li className="list-inline-item">
                          <span
                            className="pointer"
                            onClick={linkEvent(
                              this,
                              this.handleAddModToCommunity
                            )}
                          >
                            {this.isMod
                              ? i18n.t('remove_as_mod')
                              : i18n.t('appoint_as_mod')}
                          </span>
                        </li>
                      )}
                    </>
                  )}
                  {/* Community creators and admins can transfer community to another mod */}
                  {(this.amCommunityCreator || this.canAdmin) && this.isMod && (
                    <li className="list-inline-item">
                      {!this.state.showConfirmTransferCommunity ? (
                        <span
                          className="pointer"
                          onClick={linkEvent(
                            this,
                            this.handleShowConfirmTransferCommunity
                          )}
                        >
                          {i18n.t('transfer_community')}
                        </span>
                      ) : (
                        <>
                          <span className="d-inline-block mr-1">
                            {i18n.t('are_you_sure')}
                          </span>
                          <span
                            className="pointer d-inline-block mr-1"
                            onClick={linkEvent(
                              this,
                              this.handleTransferCommunity
                            )}
                          >
                            {i18n.t('yes')}
                          </span>
                          <span
                            className="pointer d-inline-block"
                            onClick={linkEvent(
                              this,
                              this.handleCancelShowConfirmTransferCommunity
                            )}
                          >
                            {i18n.t('no')}
                          </span>
                        </>
                      )}
                    </li>
                  )}
                  {/* Admins can ban from all, and appoint other admins */}
                  {this.canAdmin && (
                    <>
                      {!this.isAdmin && (
                        <li className="list-inline-item">
                          {!post.banned ? (
                            <span
                              className="pointer"
                              onClick={linkEvent(this, this.handleModBanShow)}
                            >
                              {i18n.t('ban_from_site')}
                            </span>
                          ) : (
                            <span
                              className="pointer"
                              onClick={linkEvent(this, this.handleModBanSubmit)}
                            >
                              {i18n.t('unban_from_site')}
                            </span>
                          )}
                        </li>
                      )}
                      {!post.banned && (
                        <li className="list-inline-item">
                          <span
                            className="pointer"
                            onClick={linkEvent(this, this.handleAddAdmin)}
                          >
                            {this.isAdmin
                              ? i18n.t('remove_as_admin')
                              : i18n.t('appoint_as_admin')}
                          </span>
                        </li>
                      )}
                    </>
                  )}
                  {/* Site Creator can transfer to another admin */}
                  {this.amSiteCreator && this.isAdmin && (
                    <li className="list-inline-item">
                      {!this.state.showConfirmTransferSite ? (
                        <span
                          className="pointer"
                          onClick={linkEvent(
                            this,
                            this.handleShowConfirmTransferSite
                          )}
                        >
                          {i18n.t('transfer_site')}
                        </span>
                      ) : (
                        <>
                          <span className="d-inline-block mr-1">
                            {i18n.t('are_you_sure')}
                          </span>
                          <span
                            className="pointer d-inline-block mr-1"
                            onClick={linkEvent(this, this.handleTransferSite)}
                          >
                            {i18n.t('yes')}
                          </span>
                          <span
                            className="pointer d-inline-block"
                            onClick={linkEvent(
                              this,
                              this.handleCancelShowConfirmTransferSite
                            )}
                          >
                            {i18n.t('no')}
                          </span>
                        </>
                      )}
                    </li>
                  )}
                </>
              )}
            </>
          )}
        </ul>
        {post.body && this.state.imageExpanded && !this.props.showBody && (
          <PostBody body={post.body} />
        )}
      </div>
    );
  }

  private get myPost(): boolean {
    return (
      UserService.Instance.user &&
      this.props.post.creator_id == UserService.Instance.user.id
    );
  }

  get isMod(): boolean {
    return (
      this.props.moderators &&
      isMod(
        this.props.moderators.map(m => m.user_id),
        this.props.post.creator_id
      )
    );
  }

  get isAdmin(): boolean {
    return (
      this.props.admins &&
      isMod(
        this.props.admins.map(a => a.id),
        this.props.post.creator_id
      )
    );
  }

  get canMod(): boolean {
    if (this.props.admins && this.props.moderators) {
      let adminsThenMods = this.props.admins
        .map(a => a.id)
        .concat(this.props.moderators.map(m => m.user_id));

      return canMod(
        UserService.Instance.user,
        adminsThenMods,
        this.props.post.creator_id
      );
    } else {
      return false;
    }
  }

  get canModOnSelf(): boolean {
    if (this.props.admins && this.props.moderators) {
      let adminsThenMods = this.props.admins
        .map(a => a.id)
        .concat(this.props.moderators.map(m => m.user_id));

      return canMod(
        UserService.Instance.user,
        adminsThenMods,
        this.props.post.creator_id,
        true
      );
    } else {
      return false;
    }
  }

  get canAdmin(): boolean {
    return (
      this.props.admins &&
      canMod(
        UserService.Instance.user,
        this.props.admins.map(a => a.id),
        this.props.post.creator_id
      )
    );
  }

  get amCommunityCreator(): boolean {
    return (
      this.props.moderators &&
      UserService.Instance.user &&
      this.props.post.creator_id != UserService.Instance.user.id &&
      UserService.Instance.user.id == this.props.moderators[0].user_id
    );
  }

  get amSiteCreator(): boolean {
    return (
      this.props.admins &&
      UserService.Instance.user &&
      this.props.post.creator_id != UserService.Instance.user.id &&
      UserService.Instance.user.id == this.props.admins[0].id
    );
  }

  handlePostLike(i: PostListing) {
    if (!UserService.Instance.user) {
      this.props.history.push(`/login`);
    }

    let new_vote = i.state.my_vote == 1 ? 0 : 1;

    if (i.state.my_vote == 1) {
      i.state.score--;
      i.state.upvotes--;
    } else if (i.state.my_vote == -1) {
      i.state.downvotes--;
      i.state.upvotes++;
      i.state.score += 2;
    } else {
      i.state.upvotes++;
      i.state.score++;
    }

    i.state.my_vote = new_vote;

    let form: CreatePostLikeForm = {
      post_id: i.props.post.id,
      score: i.state.my_vote,
    };

    WebSocketService.Instance.likePost(form);
    i.setState(i.state);
    setupTippy();
  }

  handlePostDisLike(i: PostListing) {
    if (!UserService.Instance.user) {
      this.props.history.push(`/login`);
    }

    let new_vote = i.state.my_vote == -1 ? 0 : -1;

    if (i.state.my_vote == 1) {
      i.state.score -= 2;
      i.state.upvotes--;
      i.state.downvotes++;
    } else if (i.state.my_vote == -1) {
      i.state.downvotes--;
      i.state.score++;
    } else {
      i.state.downvotes++;
      i.state.score--;
    }

    i.state.my_vote = new_vote;

    let form: CreatePostLikeForm = {
      post_id: i.props.post.id,
      score: i.state.my_vote,
    };

    WebSocketService.Instance.likePost(form);
    i.setState(i.state);
    setupTippy();
  }

  handleEditClick(i: PostListing) {
    i.state.showEdit = true;
    i.setState(i.state);
  }

  handleEditCancel() {
    this.state.showEdit = false;
    this.setState(this.state);
  }

  // The actual editing is done in the recieve for post
  handleEditPost() {
    this.state.showEdit = false;
    this.setState(this.state);
  }

  handleDeleteClick(i: PostListing) {
    let deleteForm: PostFormI = {
      body: i.props.post.body,
      community_id: i.props.post.community_id,
      name: i.props.post.name,
      url: i.props.post.url,
      edit_id: i.props.post.id,
      creator_id: i.props.post.creator_id,
      deleted: !i.props.post.deleted,
      nsfw: i.props.post.nsfw,
      auth: null,
    };
    WebSocketService.Instance.editPost(deleteForm);
  }

  handleSavePostClick(i: PostListing) {
    let saved = i.props.post.saved == undefined ? true : !i.props.post.saved;
    let form: SavePostForm = {
      post_id: i.props.post.id,
      save: saved,
    };

    WebSocketService.Instance.savePost(form);
  }

  get crossPostParams(): string {
    let params = `?title=${this.props.post.name}`;
    let post = this.props.post;

    if (post.url) {
      params += `&url=${post.url}`;
    }
    if (this.props.post.body) {
      params += `&body=${this.props.post.body}`;
    }
    if (post.community_id) {
      params += `&community_id=${this.props.post.community_id}`;
    }
    return params;
  }

  handleModRemoveShow(i: PostListing) {
    i.state.showRemoveDialog = true;
    i.setState(i.state);
  }

  handleModRemoveReasonChange(i: PostListing, event: any) {
    i.state.removeReason = event.target.value;
    i.setState(i.state);
  }

  handleModRemoveSubmit(i: PostListing) {
    event.preventDefault();
    let form: PostFormI = {
      name: i.props.post.name,
      community_id: i.props.post.community_id,
      edit_id: i.props.post.id,
      creator_id: i.props.post.creator_id,
      removed: !i.props.post.removed,
      reason: i.state.removeReason,
      nsfw: i.props.post.nsfw,
      auth: null,
    };
    WebSocketService.Instance.editPost(form);
    i.state.showRemoveDialog = false;
    i.setState(i.state);
  }

  handleModLock(i: PostListing) {
    let form: PostFormI = {
      name: i.props.post.name,
      community_id: i.props.post.community_id,
      edit_id: i.props.post.id,
      creator_id: i.props.post.creator_id,
      nsfw: i.props.post.nsfw,
      locked: !i.props.post.locked,
      auth: null,
    };
    WebSocketService.Instance.editPost(form);
  }

  handleModSticky(i: PostListing) {
    let form: PostFormI = {
      name: i.props.post.name,
      community_id: i.props.post.community_id,
      edit_id: i.props.post.id,
      creator_id: i.props.post.creator_id,
      nsfw: i.props.post.nsfw,
      stickied: !i.props.post.stickied,
      auth: null,
    };
    WebSocketService.Instance.editPost(form);
  }

  handleModBanFromCommunityShow(i: PostListing) {
    i.state.showBanDialog = true;
    i.state.banType = BanType.Community;
    i.setState(i.state);
  }

  handleModBanShow(i: PostListing) {
    i.state.showBanDialog = true;
    i.state.banType = BanType.Site;
    i.setState(i.state);
  }

  handleModBanReasonChange(i: PostListing, event: any) {
    i.state.banReason = event.target.value;
    i.setState(i.state);
  }

  handleModBanExpiresChange(i: PostListing, event: any) {
    i.state.banExpires = event.target.value;
    i.setState(i.state);
  }

  handleModBanFromCommunitySubmit(i: PostListing) {
    i.state.banType = BanType.Community;
    i.setState(i.state);
    i.handleModBanBothSubmit(i);
  }

  handleModBanSubmit(i: PostListing) {
    i.state.banType = BanType.Site;
    i.setState(i.state);
    i.handleModBanBothSubmit(i);
  }

  handleModBanBothSubmit(i: PostListing) {
    event.preventDefault();

    if (i.state.banType == BanType.Community) {
      let form: BanFromCommunityForm = {
        user_id: i.props.post.creator_id,
        community_id: i.props.post.community_id,
        ban: !i.props.post.banned_from_community,
        reason: i.state.banReason,
        expires: getUnixTime(i.state.banExpires),
      };
      WebSocketService.Instance.banFromCommunity(form);
    } else {
      let form: BanUserForm = {
        user_id: i.props.post.creator_id,
        ban: !i.props.post.banned,
        reason: i.state.banReason,
        expires: getUnixTime(i.state.banExpires),
      };
      WebSocketService.Instance.banUser(form);
    }

    i.state.showBanDialog = false;
    i.setState(i.state);
  }

  handleAddModToCommunity(i: PostListing) {
    let form: AddModToCommunityForm = {
      user_id: i.props.post.creator_id,
      community_id: i.props.post.community_id,
      added: !i.isMod,
    };
    WebSocketService.Instance.addModToCommunity(form);
    i.setState(i.state);
  }

  handleAddAdmin(i: PostListing) {
    let form: AddAdminForm = {
      user_id: i.props.post.creator_id,
      added: !i.isAdmin,
    };
    WebSocketService.Instance.addAdmin(form);
    i.setState(i.state);
  }

  handleShowConfirmTransferCommunity(i: PostListing) {
    i.state.showConfirmTransferCommunity = true;
    i.setState(i.state);
  }

  handleCancelShowConfirmTransferCommunity(i: PostListing) {
    i.state.showConfirmTransferCommunity = false;
    i.setState(i.state);
  }

  handleTransferCommunity(i: PostListing) {
    let form: TransferCommunityForm = {
      community_id: i.props.post.community_id,
      user_id: i.props.post.creator_id,
    };
    WebSocketService.Instance.transferCommunity(form);
    i.state.showConfirmTransferCommunity = false;
    i.setState(i.state);
  }

  handleShowConfirmTransferSite(i: PostListing) {
    i.state.showConfirmTransferSite = true;
    i.setState(i.state);
  }

  handleCancelShowConfirmTransferSite(i: PostListing) {
    i.state.showConfirmTransferSite = false;
    i.setState(i.state);
  }

  handleTransferSite(i: PostListing) {
    let form: TransferSiteForm = {
      user_id: i.props.post.creator_id,
    };
    WebSocketService.Instance.transferSite(form);
    i.state.showConfirmTransferSite = false;
    i.setState(i.state);
  }

  handleImageExpandClick(i: PostListing) {
    i.state.imageExpanded = !i.state.imageExpanded;
    i.setState(i.state);
  }

  handleViewSource(i: PostListing) {
    i.state.viewSource = !i.state.viewSource;
    i.setState(i.state);
  }

  handleReportPost(i: PostListing) {
    i.state.showReportDialog = !i.state.showReportDialog;
    i.setState(i.state);
  }

  handleReportReasonChange(i: PostListing, event: any) {
    i.state.reportReason = event.target.value;
    i.setState(i.state);
  }

  handleReportSubmit(i: PostListing, e: any) {
    e.preventDefault();

    WebSocketService.Instance.createPostReport({
      post: i.props.post.id,
      reason: i.state.reportReason,
    });

    i.state.reportReason = null;
    i.state.showReportDialog = false;

    i.setState(i.state);
  }

  handleShowAdvanced(i: PostListing) {
    i.state.showAdvanced = !i.state.showAdvanced;
    i.setState(i.state);
    setupTippy();
  }

  get pointsTippy(): string {
    let points = i18n.t('number_of_points', {
      count: this.state.score,
    });

    let upvotes = i18n.t('number_of_upvotes', {
      count: this.state.upvotes,
    });

    let downvotes = i18n.t('number_of_downvotes', {
      count: this.state.downvotes,
    });

    return `${points} • ${upvotes} • ${downvotes}`;
  }
}

export const PostListing = withRouter(BasePostListing);
