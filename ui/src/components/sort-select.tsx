import React, { Component } from 'react';
import { SortType } from '../interfaces';
import { sortingHelpUrl } from '../utils';
import { i18n } from '../i18next';
import { Icon } from './icon';
import { linkEvent } from '../linkEvent';
import { Box, Select } from 'theme-ui';

interface SortSelectProps {
  sort: SortType;
  onChange?(val: SortType): any;
  hideHot?: boolean;
}

interface SortSelectState {
  sort: SortType;
}

export class SortSelect extends Component<SortSelectProps, SortSelectState> {
  // private emptyState: SortSelectState = {
  //   sort: this.props.sort,
  // };

  constructor(props: any, context: any) {
    super(props, context);
    // this.state = this.emptyState;
  }

  // static getDerivedStateFromProps(props: any): SortSelectState {
  //   return {
  //     sort: props.sort,
  //   };
  // }

  render() {
    return (
      <>
        <Box css={{ display: 'inline-block' }} mr={2}>
          <Select
            value={this.props.sort}
            onChange={linkEvent(this, this.handleSortChange)}
          >
            <option disabled>{i18n.t('sort_type')}</option>
            {!this.props.hideHot && (
              <option value={SortType.Hot}>{i18n.t('hot')}</option>
            )}
            <option value={SortType.New}>{i18n.t('new')}</option>
            <option disabled>─────</option>
            <option value={SortType.TopDay}>{i18n.t('top_day')}</option>
            <option value={SortType.TopWeek}>{i18n.t('week')}</option>
            <option value={SortType.TopMonth}>{i18n.t('month')}</option>
            <option value={SortType.TopYear}>{i18n.t('year')}</option>
            <option value={SortType.TopAll}>{i18n.t('all')}</option>
          </Select>
        </Box>
        <a
          className="text-muted"
          href={sortingHelpUrl}
          target="_blank"
          rel="noopener"
          title={i18n.t('sorting_help')}
        >
          <Icon name="help" />
        </a>
      </>
    );
  }

  handleSortChange(i: SortSelect, event: any) {
    i.props.onChange(event.target.value);
  }
}
