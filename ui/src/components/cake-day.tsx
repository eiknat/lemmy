import React, { Component } from 'react';
import { i18n } from '../i18next';

interface CakeDayProps {
  creatorName: string;
}

export class CakeDay extends Component<CakeDayProps, any> {
  render() {
    return (
      <div
        className="mx-2 d-inline-block unselectable pointer"
        data-tippy-content={this.cakeDayTippy()}
      >
        <svg className="icon icon-inline">
          <use xlinkHref="#icon-cake" />
        </svg>
      </div>
    );
  }

  cakeDayTippy(): string {
    return i18n.t('cake_day_info', { creator_name: this.props.creatorName });
  }
}
