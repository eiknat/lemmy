import React, { Component, ReactNode } from 'react';

interface ModLogCommentState {
  expanded: boolean;
}

interface ModLogCommentProps {
  children: ReactNode;
}

export class ModlogComment extends Component<
  ModLogCommentProps,
  ModLogCommentState
> {
  state = {
    expanded: false,
  };

  toggleExpand = () => {
    this.setState({ expanded: !this.state.expanded });
  };

  render() {
    return (
      <>
        <div>
          <button onClick={this.toggleExpand} className="btn btn-secondary">
            {this.state.expanded ? 'Show Less' : 'Show More'}
          </button>
        </div>
        {this.state.expanded && this.props.children}
      </>
    );
  }
}