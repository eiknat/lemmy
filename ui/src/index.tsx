// eslint-disable-next-line no-undef
if (process.env.NODE_ENV !== 'development') {
  // @ts-ignore
  // eslint-disable-next-line no-undef
  Sentry.init({
    dsn:
      'https://9f55bebad32f4692bc91eb8893bd1862@o419785.ingest.sentry.io/5336831',
  });
}

import React, { Component } from 'react';
import { render } from 'react-dom';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import Main from './components/main';
import { Navbar } from './components/navbar';
import { Footer } from './components/footer';
import { Login } from './components/login';
import { CreatePost } from './components/create-post';
import { CreateCommunity } from './components/create-community';
import { CreatePrivateMessage } from './components/create-private-message';
import { PasswordChange } from './components/password_change';
import { Post } from './components/post';
import { Community } from './components/community';
import { Communities } from './components/communities';
import { User } from './components/user';
import { Modlog } from './components/modlog';
import { Setup } from './components/setup';
import { AdminSettings } from './components/admin-settings';
import { WelcomePage } from './components/welcome';
import { Inbox } from './components/inbox';
import { Search } from './components/search';
import { Sponsors } from './components/sponsors';
import { Symbols } from './components/symbols';
import { i18n } from './i18next';
import { About } from './components/about';
import { Reports } from './components/reports';
import Tos from './components/tos';
import PrivacyPolicy from './components/privacy-policy';

// import './custom.css';
// import './variables.css';

const container = document.getElementById('app');

function PPB() {
  return (
    <div style={{ 'maxWidth': '500px' }}>
      <img
        src="https://i.imgur.com/5pXPI.jpg"
        className="img-fluid"
        alt="a pig that has pooped on its own balls"
      />
    </div>
  );
}

class Index extends Component<any, any> {
  render() {
    return (
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          <div>
            <Navbar />
            <div className="mt-4 p-0 fl-1">
              <Switch>
                <Route exact path={`/`} component={Main} />
                {/* <Route exact path={`/`} component={WelcomePage} /> */}
                <Route path={`/ppb`} component={PPB} />
                <Route
                  path={`/home/data_type/:data_type/listing_type/:listing_type/sort/:sort/page/:page`}
                  component={Main}
                />
                <Route path={`/login`} component={Login} />
                <Route path={`/create_post`} component={CreatePost} />
                <Route path={`/create_community`} component={CreateCommunity} />
                <Route
                  path={`/create_private_message`}
                  component={CreatePrivateMessage}
                />
                <Route
                  path={`/communities/page/:page`}
                  component={Communities}
                />
                <Route path={`/communities`} component={Communities} />
                <Route
                  path={`/post/:id/comment/:comment_id`}
                  component={Post}
                />
                <Route path={`/post/:id`} component={Post} />
                <Route
                  path={`/c/:name/data_type/:data_type/sort/:sort/page/:page`}
                  component={Community}
                />
                <Route path={`/community/:id`} component={Community} />
                <Route path={`/c/:name`} component={Community} />
                <Route
                  path={`/u/:username/view/:view/sort/:sort/page/:page`}
                  component={User}
                />
                <Route path={`/user/:id`} component={User} />
                <Route path={`/u/:username`} component={User} />
                <Route path={`/inbox`} component={Inbox} />
                <Route
                  path={`/modlog/community/:community_id`}
                  component={Modlog}
                />
                <Route path={`/modlog`} component={Modlog} />
                <Route path={`/about`} component={About} />
                <Route path={`/setup`} component={Setup} />
                <Route path={`/admin`} component={AdminSettings} />
                <Route
                  path={`/search/q/:q/type/:type/sort/:sort/page/:page`}
                  component={Search}
                />
                <Route path={`/search`} component={Search} />
                <Route path={`/sponsors`} component={Sponsors} />
                <Route path={`/contributing`} component={Sponsors} />
                <Route
                  path={`/password_change/:token`}
                  component={PasswordChange}
                />
                <Route path={`/pbb`} component={PPB} />
                <Route path={`/welcome`} component={WelcomePage} />
                <Route path={`/reports`} component={Reports} />
                <Route path={`/tos`} component={Tos} />
                <Route path={`/privacy_policy`} component={PrivacyPolicy} />
              </Switch>
              <Symbols />
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </I18nextProvider>
    );
  }
}

render(<Index />, container);
