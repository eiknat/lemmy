import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Post, SortType } from '../interfaces';
import { postSort } from '../utils';
import { PostListing } from './post-listing';
import { i18n } from '../i18next';
import { Trans } from 'react-i18next';

interface PostListingsProps {
  posts: Array<Post>;
  showCommunity?: boolean;
  removeDuplicates?: boolean;
  sort?: SortType;
  enableDownvotes: boolean;
  enableNsfw: boolean;
}

interface PostListingsState {
  //to be used when rendering to prevent scroll to top of page
  scrollPos: number;
}

export class PostListings extends Component<
  PostListingsProps,
  PostListingsState
> {
  emptyState: PostListingsState = {
    scrollPos: window.scrollY,
  };

  state = this.emptyState

  //are we getting updated post array? save current scroll pos
  // UNSAFE_componentWillReceiveProps() {
  //   this.setState({
  //     scrollPos: window.scrollY
  //   });
  // }

  // @TODO: Check if this bug is in React
  //have we updated? revert scroll to top (bug on inferno side?) - scroll back to previous pos
  // componentDidUpdate() {
  //   window.scrollTo(0, this.state.scrollPos);
  // }

  render() {
    return this.props.posts.length > 0 ? (
      <div>
        {this.outer().map(post => (
          <div key={post.id}>
            <PostListing
              post={post}
              showCommunity={this.props.showCommunity}
              enableDownvotes={this.props.enableDownvotes}
              enableNsfw={this.props.enableNsfw}
            />
            <hr className="my-2" />
          </div>
        ))}
      </div>
    ) : (
      <div>
        <div>{i18n.t('no_posts')}</div>
        {this.props.showCommunity !== undefined && (
          <Trans i18nKey="subscribe_to_communities">
            #<Link to="/communities">#</Link>
          </Trans>
        )}
      </div>
    );
  }

  outer(): Array<Post> {
    let out = this.props.posts;
    if (this.props.removeDuplicates) {
      out = this.removeDuplicates(out);
    }

    if (this.props.sort !== undefined) {
      postSort(out, this.props.sort, this.props.showCommunity == undefined);
    }

    return out;
  }

  removeDuplicates(posts: Array<Post>): Array<Post> {
    // A map from post url to list of posts (dupes)
    let urlMap = new Map<string, Array<Post>>();

    // Loop over the posts, find ones with same urls
    for (let post of posts) {
      if (
        post.url &&
        !post.deleted &&
        !post.removed &&
        !post.community_deleted &&
        !post.community_removed
      ) {
        if (!urlMap.get(post.url)) {
          urlMap.set(post.url, [post]);
        } else {
          urlMap.get(post.url).push(post);
        }
      }
    }

    // Sort by oldest
    // Remove the ones that have no length
    for (let e of urlMap.entries()) {
      if (e[1].length == 1) {
        urlMap.delete(e[0]);
      } else {
        e[1].sort((a, b) => a.published.localeCompare(b.published));
      }
    }

    for (let i = 0; i < posts.length; i++) {
      let post = posts[i];
      if (post.url) {
        let found = urlMap.get(post.url);
        if (found) {
          // If its the oldest, add
          if (post.id == found[0].id) {
            post.duplicates = found.slice(1);
          }
          // Otherwise, delete it
          else {
            posts.splice(i--, 1);
          }
        }
      }
    }

    return posts;
  }
}
