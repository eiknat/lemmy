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

// @TODO: localize this
function abbreviateDate(date: string): string {
  if (date === 'a few seconds') return date;
  let [length, unit] = date.split(' ');
  if (length === 'a') {
    length = '1';
  }
  if (unit === 'month') {
    unit = 'mo'
  } else {
    unit = unit[0]
  }
  return length + unit;
}

export class MomentTime extends Component<MomentTimeProps, any> {
  constructor(props: any, context: any) {
    super(props, context);

    let lang = getMomentLanguage();

    moment.locale(lang);
  }

  render() {
    const isMobile = window.innerWidth < 768;

    if (this.props.data.updated) {
      const timeAgo = moment.utc(this.props.data.updated).fromNow(!this.props.showAgo)
      return (
        <span
          data-tippy-content={`${capitalizeFirstLetter(
            i18n.t('modified')
          )} ${this.format(this.props.data.updated)}`}
          className="font-italics pointer unselectable"
        >
          {i18n.t('modified')}{' '}
          {isMobile ? abbreviateDate(timeAgo) : timeAgo}{' '}
          {i18n.t('ago')}
        </span>
      );
    } else {
      let str = this.props.data.published || this.props.data.when_;
      const timeAgo = moment.utc(str).fromNow(!this.props.showAgo);
      return (
        <span
          className="pointer unselectable"
          data-tippy-content={this.format(str)}
        >
          {' '}{isMobile ? abbreviateDate(timeAgo) : timeAgo}
        </span>
      );
    }
  }

  format(input: string): string {
    return moment.utc(input).local().format('LLLL');
  }
}
