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
          css={{
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            backgroundColor: this.state.type_ == DataType.Post ? 'inherit' : '#2b2a2a'
          }}
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
          css={{
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            backgroundColor:  this.state.type_ == DataType.Comment ? 'inherit' : '#2b2a2a'
          }}
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
