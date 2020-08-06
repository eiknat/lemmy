import React, { Component } from 'react';
import { ListingType } from '../interfaces';
import { UserService } from '../services';

import { i18n } from '../i18next';
import { linkEvent } from '../linkEvent';
import Button from './elements/Button';

interface ListingTypeSelectProps {
  type_: ListingType;
  onChange?(val: ListingType): any;
}

interface ListingTypeSelectState {
  type_: ListingType;
}

export class ListingTypeSelect extends Component<
  ListingTypeSelectProps,
  ListingTypeSelectState
> {
  private emptyState: ListingTypeSelectState = {
    type_: this.props.type_,
  };

  constructor(props: any, context: any) {
    super(props, context);
    this.state = this.emptyState;
  }

  static getDerivedStateFromProps(props: any): ListingTypeSelectProps {
    return {
      type_: props.type_,
    };
  }

  render() {
    return (
      <div className="btn-group btn-group-toggle">
        <Button as="label"
          className={`
            ${this.state.type_ == ListingType.Subscribed && 'active'}
          `}
          disabled={UserService.Instance.user == undefined}
          css={{
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            backgroundColor: this.state.type_ == ListingType.Subscribed ? 'inherit' : '#2b2a2a'
          }}
        >
          <input
            type="radio"
            className="visually-hidden"
            value={ListingType.Subscribed}
            checked={this.state.type_ == ListingType.Subscribed}
            onChange={linkEvent(this, this.handleTypeChange)}
            disabled={UserService.Instance.user == undefined}
          />
          {i18n.t('subscribed')}
        </Button>
        <Button
          as="label"
          css={{
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            backgroundColor: this.state.type_ == ListingType.All ? 'inherit' : '#2b2a2a'
          }}
        >
          <input
            type="radio"
            className="visually-hidden"
            value={ListingType.All}
            checked={this.state.type_ == ListingType.All}
            onChange={linkEvent(this, this.handleTypeChange)}
          />
          {i18n.t('all')}
        </Button>
      </div>
    );
  }

  handleTypeChange(i: ListingTypeSelect, event: any) {
    i.props.onChange(Number(event.target.value));
  }
}
