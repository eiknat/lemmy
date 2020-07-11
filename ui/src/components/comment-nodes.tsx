import { Component } from 'inferno';
import {
  CommentNode as CommentNodeI,
  CommunityUser,
  UserView,
  CommentSortType,
  SortType,
} from '../interfaces';
import { commentSort, commentSortSortType } from '../utils';
import { CommentNode } from './comment-node';

interface CommentNodesState {}

interface CommentNodesProps {
  nodes: Array<CommentNodeI>;
  moderators?: Array<CommunityUser>;
  admins?: Array<UserView>;
  postCreatorId?: number;
  noIndent?: boolean;
  viewOnly?: boolean;
  locked?: boolean;
  markable?: boolean;
  showContext?: boolean;
  showCommunity?: boolean;
  sort?: CommentSortType;
  sortType?: SortType;
  maxView?: number;
}

export class CommentNodes extends Component<
  CommentNodesProps,
  CommentNodesState
> {
  constructor(props: any, context: any) {
    super(props, context);
  }

  render() {
    return (
      <div className="comments">
        {this.sorter().map(node => (
          <CommentNode
            key={node.comment.id}
            node={node}
            noIndent={this.props.noIndent}
            viewOnly={this.props.viewOnly}
            locked={this.props.locked}
            moderators={this.props.moderators}
            admins={this.props.admins}
            postCreatorId={this.props.postCreatorId}
            markable={this.props.markable}
            showContext={this.props.showContext}
            showCommunity={this.props.showCommunity}
            sort={this.props.sort}
            sortType={this.props.sortType}
          />
        ))}
      </div>
    );
  }

  sorter(): Array<CommentNodeI> {
    console.log('sorting comments');
    if (this.props.sort !== undefined) {
      commentSort(this.props.nodes, this.props.sort);
    } else if (this.props.sortType !== undefined) {
      commentSortSortType(this.props.nodes, this.props.sortType);
    }

    if (this.props.maxView) {
      return this.props.nodes.slice(0, this.props.maxView);
    }

    return this.props.nodes;
  }
}
