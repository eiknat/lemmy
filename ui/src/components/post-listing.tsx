import React, { Component } from 'react';
import { Link, RouteComponentProps, withRouter } from 'react-router-dom';
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
  AddSitemodForm,
  TransferSiteForm,
  TransferCommunityForm,
  DeletePostForm,
  RemovePostForm,
  LockPostForm,
  StickyPostForm,
} from '../interfaces';
import { MomentTime } from './moment-time';
import { PostForm } from './post-form';
import { IFramelyCard } from './iframely-card';
import { UserListing } from './user-listing';
import { CommunityLink } from './community-link';
import {
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
} from '../utils';
import { i18n } from '../i18next';
import { Icon } from './icon';
import { RoleBadge } from './comment-node';
import { linkEvent } from '../linkEvent';
import { Box, Flex, Heading, Text } from 'theme-ui';
import Button from './elements/Button';

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
  localPostSaved: boolean;
}

interface PostListingProps {
  post: Post;
  showCommunity?: boolean;
  showBody?: boolean;
  moderators?: Array<CommunityUser>;
  admins?: Array<UserView>;
  sitemods?: Array<UserView>;
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

export function PostListingButton({
  as: Element = 'button',
  onClick,
  children,
  ...props
}: {
  as?: any;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Element
      className="btn btn-sm btn-link btn-animate text-muted post-listing-button"
      onClick={onClick}
      type="button"
      {...props}
    >
      {children}
    </Element>
  );
}

const VoteButtons = ({
  my_vote,
  handlePostLike,
  handlePostDisLike,
  enableDownvotes,
  score,
  pointsTippy,
}: any) => (
  <>
    <button
      className={`btn-animate btn btn-link p-0 ${
        my_vote === 1 ? 'text-info' : 'text-muted'
      }`}
      onClick={handlePostLike}
      data-tippy-content={i18n.t('upvote')}
    >
      <Icon name="upvote" className="icon upvote" />
    </button>
    <div
      className="unselectable pointer font-weight-bold text-muted px-1 py-1"
      data-tippy-content={pointsTippy}
    >
      {score}
    </div>
    {enableDownvotes && (
      <button
        className={`btn-animate btn btn-link p-0 ${
          my_vote === -1 ? 'text-danger' : 'text-muted'
        }`}
        onClick={handlePostDisLike}
        data-tippy-content={i18n.t('downvote')}
      >
        <Icon name="downvote" className="icon downvote" />
      </button>
    )}
  </>
  );

function MobilePostListing({ post, my_vote, handlePostLike,
  handlePostDisLike,
  enableDownvotes,
  score,
  pointsTippy,
  localPostSaved,
  handleSavePostClick,
  thumbnail,
}) {
  console.log({ post })
  return (
    <Flex css={{ flexDirection: 'column' }}>
      <Heading as="h5" mb={1}>{post.name}</Heading>
      {/* {thumbnail && thumbnail()} */}
      {isImage(post.url) && (
        <img className="img-fluid my-2" alt={post.name} src={post.url} />
      )}
      {post.body && (
        <Text css={{ border: '1px solid rgb(68, 68, 68)', padding: '8px', borderRadius: '4px' }} my={2}>
          {post.body}
        </Text>
      )}
      <Box my={1}>
        <span> {i18n.t('to')} </span>
        <CommunityLink
          community={{
            name: post.community_name,
            id: post.community_id,
            local: post.community_local,
            actor_id: post.community_actor_id,
          }}
        />
        <span> {i18n.t('by')} </span>
          <UserListing
            user={{
              name: post.creator_name,
              avatar: post.creator_avatar,
              id: post.creator_id,
              local: post.creator_local,
              actor_id: post.creator_actor_id,
            }}
          />
        <span>
          {' '}- <MomentTime data={post} />
        </span>
      </Box>
      <Flex css={{ alignItems: 'center' }} mt={3}>
        <Button onClick={handlePostLike} p={1} variant="muted" color={my_vote === 1 ? '#fffc00' : 'inherit'}>
          <Icon name="upvote" className="icon upvote" />
        </Button>
        <Box mx={2}>
          {score}
        </Box>
        <Button onClick={handlePostDisLike} p={1} variant="muted" color={my_vote === -1 ? '#dd17b9' : 'inherit'}>
          <Icon name="downvote" className="icon downvote" />
        </Button>
        <Box mx={3}>
          <Link
            className="text-muted"
            title={i18n.t('number_of_comments', {
              count: post.number_of_comments,
            })}
            to={`/post/${post.id}`}
          >
            <Icon name="comment" className="icon mr-1" />
            {post.number_of_comments}
          </Link>
        </Box>
        <Button
          variant="muted"
          p={1}
          onClick={handleSavePostClick}
          data-tippy-content={
            post.saved ? i18n.t('unsave') : i18n.t('save')
          }
        >
          <Icon
            name={
              localPostSaved ? 'star' : 'starOutline'
            }
            className={`icon icon-inline ${
              localPostSaved && 'text-warning'
            }`}
          />
        </Button>
        <Button mx={2} p={1} variant="muted" css={{ marginLeft: 'auto' }}>
          <Icon name="more" />
        </Button>
      </Flex>
    </Flex>
  )
}

class BasePostListing extends Component<
  PostListingProps & RouteComponentProps,
  PostListingState
> {
  private emptyState: PostListingState = {
    showEdit: false,
    showRemoveDialog: false,
    removeReason: '',
    showBanDialog: false,
    banReason: '',
    banExpires: '',
    banType: BanType.Community,
    reportReason: '',
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
    // @TODO: Debug why this isn't being passed down on update
    localPostSaved: this.props.post.saved,
  };

  state = this.emptyState;

  componentDidMount() {
    // scroll to top of page when loading post listing
    window.scrollTo(0, 0);
  }

  // @TODO: Check if this problem still persists
  // UNSAFE_componentWillReceiveProps(nextProps: PostListingProps) {
  //   this.setState({
  //     my_vote: nextProps.post.my_vote,
  //     upvotes: nextProps.post.upvotes,
  //     downvotes: nextProps.post.downvotes,
  //     score: nextProps.post.score,
  //     // imageExpanded: this.props.post.id === nextProps.post.id
  //   });
  // }

  render() {
    return (
      <div>
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
        alt={post.name}
        src={src}
      />
    );
  }

  getImage(thumbnail = false) {
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

  thumbnail = () => {
    let post = this.props.post;

    if (isImage(post.url)) {
      return (
        <span
          className="text-body pointer"
          data-tippy-content={i18n.t('expand_here')}
          onClick={this.handleImageExpandClick}
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
              onClick={this.handleImageExpandClick}
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
          onClick={this.handleImageExpandClick}
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
              playsInline
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
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <Icon className="icon thumbnail" size="40px" name="link" />
            </a>
          </div>
        );
      }
    } else {
      return (
        <button
          className="text-body post-body-expand-button post-listing-box"
          title={i18n.t('expand_here')}
          // onClick={() =>
          //   !this.props.showBody && linkEvent(this, this.handleImageExpandClick)
          // }
          onClick={() => !this.props.showBody && this.handleImageExpandClick()}
        >
          {post.nsfw ? (
            <svg className="icon thumbnail" style={{ marginTop: '-3px' }}>
              <use xlinkHref="#icon-warning-post" />
            </svg>
          ) : (
            <svg className="icon thumbnail">
              <use xlinkHref="#icon-message-square" />
            </svg>
          )}
        </button>
      );
    }
  }

  listingActions() {
    let post = this.props.post;

    const isMobile = window.innerWidth < 768;
    return (
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
            {post.creator_tags?.pronouns ? (
              <span className="badge mx-1 comment-badge pronouns-badge">
                {post.creator_tags.pronouns.split(',').join('/')}
              </span>
            ) : null}
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
              <svg className="icon custom-icon text-danger">
                <use xlinkHref="#icon-lock" />
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
                <li className="list-inline-item mr-2" key={post.id}>
                  <Link to={`/post/${post.id}`}>{post.community_name}</Link>
                </li>
              ))}
            </>
          </ul>
        )}
        {this.state.showRemoveDialog && (
          <form className="form-inline" onSubmit={this.handleModRemoveSubmit}>
            <input
              type="text"
              className="form-control mr-2"
              placeholder={i18n.t('reason')}
              value={this.state.removeReason}
              onChange={this.handleModRemoveReasonChange}
            />
            <button type="submit" className="btn btn-secondary">
              {i18n.t('remove_post')}
            </button>
          </form>
        )}
        {this.state.showBanDialog && (
          <form onSubmit={this.handleModBanBothSubmit}>
            <div className="form-group row">
              <label className="col-form-label" htmlFor="post-listing-reason">
                {i18n.t('reason')}
              </label>
              <input
                type="text"
                id="post-listing-reason"
                className="form-control mr-2"
                placeholder={i18n.t('reason')}
                value={this.state.banReason}
                onChange={this.handleModBanReasonChange}
              />
            </div>
            {/* TODO hold off on expires until later */}
            {/* <div className="form-group row"> */}
            {/*   <label className="col-form-label">Expires</label> */}
            {/*   <input type="date" className="form-control mr-2" placeholder={i18n.t('expires')} value={this.state.banExpires} onChange={linkEvent(this, this.handleModBanExpiresChange)} /> */}
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
                onChange={linkEvent(this, this.handleReportReasonChange)}
                maxLength={600}
              />
            </div>
            <div className="form-group row">
              <button type="submit" className="btn btn-secondary">
                {i18n.t('submit_report')}
              </button>
            </div>
            <div className="row mt-1">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={linkEvent(this, this.handleReportPost)}
              >
                {i18n.t('cancel')}
              </button>
            </div>
          </form>
        )}
        <div className="post-listing-details">
          {/* <div className="mobile-vote-bar">
                    <VoteButtons
                        my_vote={this.state.my_vote}
                        enableDownvotes={this.props.enableDownvotes}
                        score={this.state.score}
                        handlePostDisLike={linkEvent(this, this.handlePostDisLike)}
                        handlePostLike={linkEvent(this, this.handlePostLike)}
                        pointsTippy={this.pointsTippy}
                      />
                  </div> */}
          <Link
            className="text-muted"
            title={i18n.t('number_of_comments', {
              count: post.number_of_comments,
            })}
            to={`/post/${post.id}`}
          >
            <Icon name="comment" className="icon mr-1" />
            {isMobile
              ? post.number_of_comments
              : i18n.t('number_of_comments', {
                  count: post.number_of_comments,
                })}
          </Link>
          {/* {this.state.upvotes !== this.state.score && (
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
                  )} */}
          {UserService.Instance.user && (
            <>
              {!this.props.showBody && (
                <>
                  <li className="list-inline-item">
                    <PostListingButton
                      onClick={this.handleSavePostClick}
                      data-tippy-content={
                        post.saved ? i18n.t('unsave') : i18n.t('save')
                      }
                    >
                      <Icon
                        name={
                          this.state.localPostSaved ? 'star' : 'starOutline'
                        }
                        className={`icon icon-inline ${
                          this.state.localPostSaved && 'text-warning'
                        }`}
                      />
                    </PostListingButton>
                  </li>
                  <li className="list-inline-item">
                    <Link
                      to={`/create_post${this.crossPostParams}`}
                      title={i18n.t('cross_post')}
                    >
                      <PostListingButton>
                        <svg className="icon icon-inline">
                          <use xlinkHref="#icon-copy" />
                        </svg>
                      </PostListingButton>
                    </Link>
                  </li>
                  <li className="list-inline-item">
                    <PostListingButton
                      onClick={this.handleReportPost}
                      data-tippy-content={i18n.t('snitch')}
                    >
                      <Icon name="report" />
                    </PostListingButton>
                  </li>
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  listing = () => {
    let post = this.props.post;

    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      return (<MobilePostListing my_vote={this.state.my_vote} post={post} enableDownvotes={this.props.enableDownvotes}
              score={this.state.score}
              handlePostDisLike={this.handlePostDisLike}
              handlePostLike={this.handlePostLike}
        pointsTippy={this.pointsTippy}
        thumbnail={this.thumbnail}
        localPostSaved={this.state.localPostSaved}
        handleSavePostClick={this.handleSavePostClick}
      />)
    }

    return (
      <div>
        <div className="row post-listing-row">
          <div
            className={`vote-bar small text-center ${
              post.stickied ? 'stickied-border' : ''
            }`}
          >
            <VoteButtons
              my_vote={this.state.my_vote}
              enableDownvotes={this.props.enableDownvotes}
              score={this.state.score}
              handlePostDisLike={this.handlePostDisLike}
              handlePostLike={this.handlePostLike}
              pointsTippy={this.pointsTippy}
            />
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
                    !(hostname(post.url) === window.location.hostname) && (
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
                          onClick={this.handleImageExpandClick}
                        >
                          {/* keeping this for accessibility reasons */}
                        </span>
                      ) : (
                        <span>
                          <span
                            className="text-monospace unselectable pointer ml-2 text-muted small"
                            onClick={this.handleImageExpandClick}
                          >
                            {/* keeping this for accessibility reasons */}
                          </span>
                          <div>
                            <span
                              className="pointer"
                              onClick={this.handleImageExpandClick}
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
                                  alt={`expanded for post ${post.name}`}
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
                      <svg className="icon icon-inline text-danger">
                        <use xlinkHref="#icon-trash" />
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
            <div className="row">{this.listingActions()}</div>
          </div>
        </div>
        {/* <div className="row only-mobile mt-2">
          {this.listingActions()}
        </div> */}
        <ul className="list-inline mb-1 text-muted font-weight-bold">
          {UserService.Instance.user && (
            <>
              {this.props.showBody && (
                <>
                  <li className="list-inline-item">
                    <PostListingButton
                      onClick={this.handleSavePostClick}
                      data-tippy-content={
                        post.saved ? i18n.t('unsave') : i18n.t('save')
                      }
                    >
                      <Icon
                        name={
                          this.state.localPostSaved ? 'star' : 'starOutline'
                        }
                        className={`icon icon-inline ${
                          this.state.localPostSaved && 'text-warning'
                        }`}
                      />
                    </PostListingButton>
                  </li>
                  <li className="list-inline-item">
                    <Link
                      to={`/create_post${this.crossPostParams}`}
                      title={i18n.t('cross_post')}
                    >
                      <PostListingButton>
                        <svg className="icon icon-inline">
                          <use xlinkHref="#icon-copy" />
                        </svg>
                      </PostListingButton>
                    </Link>
                  </li>
                  <li className="list-inline-item">
                    <PostListingButton
                      onClick={this.handleReportPost}
                      data-tippy-content={i18n.t('snitch')}
                    >
                      <Icon name="report" />
                    </PostListingButton>
                  </li>
                </>
              )}
              {this.myPost && this.props.showBody && (
                <>
                  <li className="list-inline-item">
                    <button
                      className="btn btn-sm btn-link btn-animate text-muted"
                      onClick={this.handleEditClick}
                      data-tippy-content={i18n.t('edit')}
                    >
                      <Icon name="edit" />
                    </button>
                  </li>
                  <li className="list-inline-item">
                    <button
                      className="btn btn-sm btn-link btn-animate text-muted"
                      onClick={this.handleDeleteClick}
                      data-tippy-content={
                        !post.deleted ? i18n.t('delete') : i18n.t('restore')
                      }
                    >
                      <svg
                        className={`icon icon-inline ${
                          post.deleted && 'text-danger'
                        }`}
                      >
                        <use xlinkHref="#icon-trash" />
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
                          <use xlinkHref="#icon-file-text" />
                        </svg>
                      </button>
                    </li>
                  )}
                  {this.canModOnSelf && (
                    <>
                      <li className="list-inline-item">
                        <button
                          className="btn btn-sm btn-link btn-animate text-muted"
                          onClick={this.handleModLock}
                          data-tippy-content={
                            post.locked ? i18n.t('unlock') : i18n.t('lock')
                          }
                        >
                          <svg
                            className={`icon icon-inline ${
                              post.locked && 'text-danger'
                            }`}
                          >
                            <use xlinkHref="#icon-lock" />
                          </svg>
                        </button>
                      </li>
                      <li className="list-inline-item">
                        <button
                          className="btn btn-sm btn-link btn-animate text-muted"
                          onClick={this.handleModSticky}
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
                            <use xlinkHref="#icon-pin" />
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
                          onClick={this.handleModRemoveShow}
                        >
                          {i18n.t('remove')}
                        </span>
                      ) : (
                        <span
                          className="pointer"
                          onClick={this.handleModRemoveSubmit}
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
                              onClick={this.handleModBanFromCommunityShow}
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
                              onClick={this.handleModBanShow}
                            >
                              {i18n.t('ban_from_site')}
                            </span>
                          ) : (
                            <span
                              className="pointer"
                              onClick={this.handleModBanSubmit}
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
                      {!post.banned && (
                        <li className="list-inline-item">
                          <span
                            className="pointer"
                            onClick={linkEvent(this, this.handleAddSitemod)}
                          >
                            {this.isSitemod
                              ? i18n.t('remove_as_sitemod')
                              : i18n.t('appoint_as_sitemod')}
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
      this.props.post.creator_id === UserService.Instance.user.id
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

  get isSitemod(): boolean {
    return (
      this.props.sitemods &&
      isMod(
        this.props.sitemods.map(s => s.id),
        this.props.post.creator_id
      )
    );
  }

  get canMod(): boolean {
    if (this.props.admins && this.props.sitemods && this.props.moderators) {
      let adminsThenMods = this.props.admins
        .map(a => a.id)
        .concat(this.props.sitemods.map(s => s.id))
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
    if (this.props.admins && this.props.sitemods && this.props.moderators) {
      let adminsThenMods = this.props.admins
        .map(a => a.id)
        .concat(this.props.sitemods.map(s => s.id))
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
      this.props.post.creator_id !== UserService.Instance.user.id &&
      UserService.Instance.user.id === this.props.moderators[0].user_id
    );
  }

  get amSiteCreator(): boolean {
    return (
      this.props.admins &&
      UserService.Instance.user &&
      this.props.post.creator_id !== UserService.Instance.user.id &&
      UserService.Instance.user.id === this.props.admins[0].id
    );
  }

  handlePostLike = () => {
    if (!UserService.Instance.user) {
      this.props.history.push(`/login`);
    }

    let new_vote = this.state.my_vote === 1 ? 0 : 1;
    const newState = { ...this.state };

    if (this.state.my_vote === 1) {
      newState.score--;
      newState.upvotes--;
    } else if (this.state.my_vote === -1) {
      newState.downvotes--;
      newState.upvotes++;
      newState.score += 2;
    } else {
      newState.upvotes++;
      newState.score++;
    }

    newState.my_vote = new_vote;

    let form: CreatePostLikeForm = {
      post_id: this.props.post.id,
      score: this.state.my_vote,
    };

    WebSocketService.Instance.likePost(form);
    this.setState(newState);
    setupTippy();
  };

  handlePostDisLike = () => {
    if (!UserService.Instance.user) {
      this.props.history.push(`/login`);
    }

    let new_vote = this.state.my_vote === -1 ? 0 : -1;
    const newState = { ...this.state };

    if (this.state.my_vote === 1) {
      newState.score -= 2;
      newState.upvotes--;
      newState.downvotes++;
    } else if (this.state.my_vote === -1) {
      newState.downvotes--;
      newState.score++;
    } else {
      newState.downvotes++;
      newState.score--;
    }

    newState.my_vote = new_vote;

    let form: CreatePostLikeForm = {
      post_id: this.props.post.id,
      score: this.state.my_vote,
    };

    WebSocketService.Instance.likePost(form);
    this.setState(newState);
    setupTippy();
  };

  handleEditClick = () => {
    this.setState({
      showEdit: true,
    });
  };

  handleEditCancel = () => {
    this.setState({
      showEdit: false,
    });
  };

  // The actual editing is done in the recieve for post
  handleEditPost = () => {
    this.setState({
      showEdit: false,
    });
  };

  handleDeleteClick = () => {
    let deleteForm: DeletePostForm = {
      edit_id: this.props.post.id,
      deleted: !this.props.post.deleted,
      auth: null,
    };
    WebSocketService.Instance.deletePost(deleteForm);
  };

  handleSavePostClick = () => {
    let saved =
      this.props.post.saved === undefined ? true : !this.props.post.saved;
    let form: SavePostForm = {
      post_id: this.props.post.id,
      save: saved,
    };

    WebSocketService.Instance.savePost(form);
    this.setState({ localPostSaved: !this.state.localPostSaved });
  };

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

  handleModRemoveShow = () => {
    this.setState({
      showRemoveDialog: true,
    });
  };

  handleModRemoveReasonChange = (event: any) => {
    this.setState({
      removeReason: event.target.value,
    });
  };

  handleModRemoveSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    let form: RemovePostForm = {
      edit_id: this.props.post.id,
      removed: !this.props.post.removed,
      reason: this.state.removeReason,
      auth: null,
    };
    WebSocketService.Instance.removePost(form);
    this.setState({
      showRemoveDialog: false,
    });
  };

  handleModLock = () => {
    let form: LockPostForm = {
      edit_id: this.props.post.id,
      locked: !this.props.post.locked,
      auth: null,
    };
    WebSocketService.Instance.lockPost(form);
  };

  handleModSticky = () => {
    let form: StickyPostForm = {
      edit_id: this.props.post.id,
      stickied: !this.props.post.stickied,
      auth: null,
    };
    WebSocketService.Instance.stickyPost(form);
  };

  handleModBanFromCommunityShow = () => {
    this.setState({
      showBanDialog: true,
      banType: BanType.Community,
    });
  };

  handleModBanShow = () => {
    this.setState({
      showBanDialog: true,
      banType: BanType.Site,
    });
  };

  handleModBanReasonChange = (event: any) => {
    this.setState({
      banReason: event.target.value,
    });
  };

  handleModBanExpiresChange = (event: any) => {
    this.setState({
      banReason: event.target.value,
    });
  };

  handleModBanFromCommunitySubmit = () => {
    this.setState(
      {
        banType: BanType.Community,
      },
      () => {
        this.handleModBanBothSubmit();
      }
    );
  };

  handleModBanSubmit = () => {
    this.setState(
      {
        banType: BanType.Site,
      },
      () => {
        this.handleModBanBothSubmit();
      }
    );
  };

  handleModBanBothSubmit = () => {
    if (this.state.banType === BanType.Community) {
      let form: BanFromCommunityForm = {
        user_id: this.props.post.creator_id,
        community_id: this.props.post.community_id,
        ban: !this.props.post.banned_from_community,
        reason: this.state.banReason,
        expires: getUnixTime(this.state.banExpires),
      };
      WebSocketService.Instance.banFromCommunity(form);
    } else {
      let form: BanUserForm = {
        user_id: this.props.post.creator_id,
        ban: !this.props.post.banned,
        reason: this.state.banReason,
        expires: getUnixTime(this.state.banExpires),
      };
      WebSocketService.Instance.banUser(form);
    }

    this.setState({
      showBanDialog: false,
    });
  };

  handleAddModToCommunity(i: BasePostListing) {
    let form: AddModToCommunityForm = {
      user_id: i.props.post.creator_id,
      community_id: i.props.post.community_id,
      added: !i.isMod,
    };
    WebSocketService.Instance.addModToCommunity(form);
    i.setState(i.state);
  }

  handleAddAdmin(i: BasePostListing) {
    let form: AddAdminForm = {
      user_id: i.props.post.creator_id,
      added: !i.isAdmin,
    };
    WebSocketService.Instance.addAdmin(form);
    i.setState(i.state);
  }

  handleAddSitemod(i: BasePostListing) {
    let form: AddSitemodForm = {
      user_id: i.props.post.creator_id,
      added: !i.isSitemod,
    };
    WebSocketService.Instance.addSitemod(form);
    i.setState(i.state);
  }

  handleShowConfirmTransferCommunity(i: BasePostListing) {
    i.setState({ showConfirmTransferCommunity: true });
  }

  handleCancelShowConfirmTransferCommunity(i: BasePostListing) {
    i.setState({ showConfirmTransferCommunity: false });
  }

  handleTransferCommunity(i: BasePostListing) {
    let form: TransferCommunityForm = {
      community_id: i.props.post.community_id,
      user_id: i.props.post.creator_id,
    };
    WebSocketService.Instance.transferCommunity(form);
    i.setState({ showConfirmTransferCommunity: false });
  }

  handleShowConfirmTransferSite(i: BasePostListing) {
    i.setState({ showConfirmTransferCommunity: true });
  }

  handleCancelShowConfirmTransferSite(i: BasePostListing) {
    i.setState({ showConfirmTransferSite: false });
  }

  handleTransferSite(i: BasePostListing) {
    let form: TransferSiteForm = {
      user_id: i.props.post.creator_id,
    };
    WebSocketService.Instance.transferSite(form);
    i.setState({ showConfirmTransferSite: false });
  }

  handleImageExpandClick = () => {
    this.setState({
      imageExpanded: !this.state.imageExpanded,
    });
  };

  handleViewSource(i: BasePostListing) {
    i.setState(prevState => ({
      viewSource: !prevState.viewSource,
    }));
  }

  handleReportPost = () => {
    this.setState(prevState => ({
      showReportDialog: !prevState.showReportDialog,
    }));
  };

  handleReportReasonChange(i: BasePostListing, event: any) {
    i.setState({
      reportReason: event.target.value,
    });
  }

  handleReportSubmit(i: BasePostListing, e: any) {
    e.preventDefault();

    WebSocketService.Instance.createPostReport({
      post: i.props.post.id,
      reason: i.state.reportReason,
    });

    i.setState({
      reportReason: null,
      showReportDialog: false,
    });
  }

  handleShowAdvanced(i: BasePostListing) {
    i.setState(
      prevState => ({
        showAdvanced: !prevState.showAdvanced,
      }),
      () => {
        setupTippy();
      }
    );
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
