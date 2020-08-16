import React, { Component } from 'react';
import { DataType } from '../interfaces';

import { i18n } from '../i18next';
import { linkEvent } from '../linkEvent';
import Button from './elements/Button';

interface DataTypeSelectProps {
  type_: DataType;
  onChange?(val: DataType): any;
}

interface DataTypeSelectState {
  type_: DataType;
}

export class DataTypeSelect extends Component<
  DataTypeSelectProps,
  DataTypeSelectState
> {
  private emptyState: DataTypeSelectState = {
    type_: this.props.type_,
  };

  constructor(props: any, context: any) {
    super(props, context);
    this.state = this.emptyState;
  }

  static getDerivedStateFromProps(props: any): DataTypeSelectProps {
    return {
      type_: props.type_,
    };
  }

  render() {
    return (
      <div className="btn-group btn-group-toggle">
        <Button
          as="label"
          variant={this.state.type_ == DataType.Post ? 'primary' : 'muted'}
        >
          <input
            type="radio"
            className="visually-hidden"
            value={DataType.Post}
            checked={this.state.type_ == DataType.Post}
            onChange={linkEvent(this, this.handleTypeChange)}
          />
          {i18n.t('posts')}
        </Button>
        <Button
          as="label"
          variant={
            this.state.type_ == DataType.Comment ? 'primary' : 'muted'
          }
        >
          <input
            type="radio"
            className="visually-hidden"
            value={DataType.Comment}
            checked={this.state.type_ == DataType.Comment}
            onChange={linkEvent(this, this.handleTypeChange)}
          />
          {i18n.t('comments')}
        </Button>
      </div>
    );
  }

  handleTypeChange(i: DataTypeSelect, event: any) {
    i.props.onChange(Number(event.target.value));
  }
}
