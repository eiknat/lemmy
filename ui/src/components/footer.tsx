import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { repoUrl } from '../utils';
import { version } from '../version';
import { VERSION as git_version } from '../git-version';
import { i18n } from '../i18next';

export class Footer extends Component<any, any> {
  constructor(props: any, context: any) {
    super(props, context);
  }

  render() {
    return (
      <nav className="container navbar navbar-expand-md navbar-light navbar-bg p-0 px-3 mt-2">
        <div className="navbar-collapse">
          <ul className="navbar-nav ml-auto">
            <li className="nav-item">
              <span className="navbar-text">{git_version.raw}</span>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/about">
                {i18n.t('about')}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/privacy_policy">
                {i18n.t('privacy_policy')}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/tos">
                {i18n.t('terms_of_service')}
              </Link>
            </li>
            <li>
              <Link className="nav-link" to="/ppb">
                {i18n.t('PPB')}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/modlog">
                {i18n.t('modlog')}
              </Link>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/docs/index.html">
                {i18n.t('docs')}
              </a>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/contributing">
                {i18n.t('donate')}
              </Link>
            </li>
            <li className="nav-item">
              <a className="nav-link" href={repoUrl}>
                {i18n.t('code')}
              </a>
            </li>
          </ul>
        </div>
      </nav>
    );
  }
}
