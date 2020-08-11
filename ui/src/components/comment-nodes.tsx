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
  enableDownvotes: boolean;
  maxView?: number;
}

function sorter({ sort, sortType, nodes, maxView }): Array<CommentNodeI> {
  if (sort !== undefined) {
    commentSort(nodes, sort);
  } else if (sortType !== undefined) {
    commentSortSortType(nodes, sortType);
  }

  if (maxView) {
    return nodes.slice(0, maxView);
  }

  return nodes;
}

export class CommentNodes extends Component<
  CommentNodesProps,
  CommentNodesState
> {
  constructor(props: any, context: any) {
    super(props, context);
  }

  state = {
    nodes: sorter({
      sort: this.props.sort,
      sortType: this.props.sortType,
      nodes: this.props.nodes,
      maxView: this.props.maxView
    }),
  }

  componentDidUpdate(prevProps) {
    // only update nodes when sort type or max view is changed
    if (
      this.props.sort !== prevProps.sort ||
      this.props.sortType !== prevProps.sortType ||
      this.props.maxView !== prevProps.maxView
    ) {
      this.setState({
        nodes: sorter({
          sort: this.props.sort,
          sortType: this.props.sortType,
          nodes: this.props.nodes,
          maxView: this.props.maxView
        })
      })
    } else if (this.props.nodes !== prevProps.nodes) {
      // if the comments themselves changes, update them but don't re-sort them
      this.setState({ nodes: this.props.nodes });
    }
  }

  render() {
    return (
      <div className="comments">
        {this.state.nodes.map(node => (
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
            enableDownvotes={this.props.enableDownvotes}
          />
        ))}
      </div>
    );
  }

  sorter(): Array<CommentNodeI> {
    if (this.props.sort !== undefined) {
      commentSort(this.state.nodes, this.props.sort);
    } else if (this.props.sortType !== undefined) {
      commentSortSortType(this.state.nodes, this.props.sortType);
    }

    if (this.props.maxView) {
      return this.state.nodes.slice(0, this.props.maxView);
    }

    return this.state.nodes;
  }
}
