import React, { Component } from 'react';
import moment from 'moment';
import { getMomentLanguage, capitalizeFirstLetter } from '../utils';
import { i18n } from '../i18next';

interface MomentTimeProps {
  data: {
    published?: string;
    when_?: string;
    updated?: string;
  };
  showAgo?: boolean;
}

export class MomentTime extends Component<MomentTimeProps, any> {
  constructor(props: any, context: any) {
    super(props, context);

    let lang = getMomentLanguage();

    moment.locale(lang);
  }

  render() {
    if (this.props.data.updated) {
      return (
        <span
          data-tippy-content={`${capitalizeFirstLetter(
            i18n.t('modified')
          )} ${this.format(this.props.data.updated)}`}
          className="font-italics pointer unselectable"
        >
          {i18n.t('modified')}{' '}
          {moment.utc(this.props.data.updated).fromNow(!this.props.showAgo)}{' '}
          {i18n.t('ago')}
        </span>
      );
    } else {
      let str = this.props.data.published || this.props.data.when_;
      return (
        <span
          className="pointer unselectable"
          data-tippy-content={this.format(str)}
        >
          {moment.utc(str).fromNow(!this.props.showAgo)}
        </span>
      );
    }
  }

  format(input: string): string {
    return moment.utc(input).local().format('LLLL');
  }
}
