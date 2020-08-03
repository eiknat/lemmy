import React, { Component } from 'react';
import { Subscription } from 'rxjs';
import { retryWhen, delay, take } from 'rxjs/operators';
import {
  RegisterForm,
  LoginResponse,
  UserOperation,
  WebSocketJsonResponse,
} from '../interfaces';
import { WebSocketService, UserService } from '../services';
import { wsJsonToRes, toast } from '../utils';
import { SiteForm } from './site-form';
import { i18n } from '../i18next';
import { linkEvent } from '../linkEvent';

interface State {
  userForm: RegisterForm;
  doneRegisteringUser: boolean;
  userLoading: boolean;
}

export class Setup extends Component<any, State> {
  private subscription: Subscription;

  private emptyState: State = {
    userForm: {
      username: undefined,
      password: undefined,
      password_verify: undefined,
      admin: true,
      show_nsfw: true,
      captcha_id: '',
    },
    doneRegisteringUser: false,
    userLoading: false,
  };

  constructor(props: any, context: any) {
    super(props, context);

    this.state = this.emptyState;

    this.subscription = WebSocketService.Instance.subject
      .pipe(retryWhen(errors => errors.pipe(delay(3000), take(10))))
      .subscribe(
        msg => this.parseMessage(msg),
        err => console.error(err),
        () => console.log('complete')
      );
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  componentDidMount() {
    document.title = `${i18n.t('setup')} - Lemmy`;
  }

  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="col-12 offset-lg-3 col-lg-6">
            <h3>{i18n.t('lemmy_instance_setup')}</h3>
            {!this.state.doneRegisteringUser ? (
              this.registerUser()
            ) : (
              <SiteForm />
            )}
          </div>
        </div>
      </div>
    );
  }

  registerUser() {
    return (
      <form onSubmit={linkEvent(this, this.handleRegisterSubmit)}>
        <h5>{i18n.t('setup_admin')}</h5>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label" htmlFor="username">
            {i18n.t('username')}
          </label>
          <div className="col-sm-10">
            <input
              type="text"
              className="form-control"
              id="username"
              value={this.state.userForm.username}
              onInput={linkEvent(this, this.handleRegisterUsernameChange)}
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label" htmlFor="email">
            {i18n.t('email')}
          </label>

          <div className="col-sm-10">
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder={i18n.t('optional')}
              value={this.state.userForm.email}
              onInput={linkEvent(this, this.handleRegisterEmailChange)}
              minLength={3}
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label" htmlFor="password">
            {i18n.t('password')}
          </label>
          <div className="col-sm-10">
            <input
              type="password"
              id="password"
              value={this.state.userForm.password}
              onInput={linkEvent(this, this.handleRegisterPasswordChange)}
              className="form-control"
              required
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label" htmlFor="verify-password">
            {i18n.t('verify_password')}
          </label>
          <div className="col-sm-10">
            <input
              type="password"
              id="verify-password"
              value={this.state.userForm.password_verify}
              onInput={linkEvent(this, this.handleRegisterPasswordVerifyChange)}
              className="form-control"
              required
            />
          </div>
        </div>
        <div className="form-group row">
          <div className="col-sm-10">
            <button type="submit" className="btn btn-secondary">
              {this.state.userLoading ? (
                <svg className="icon icon-spinner spin">
                  <use xlinkHref="#icon-spinner" />
                </svg>
              ) : (
                i18n.t('sign_up')
              )}
            </button>
          </div>
        </div>
      </form>
    );
  }

  handleRegisterSubmit(i: Setup, event: any) {
    event.preventDefault();
    i.state.userLoading = true;
    i.setState(i.state);
    event.preventDefault();
    WebSocketService.Instance.register(i.state.userForm);
  }

  handleRegisterUsernameChange(i: Setup, event: any) {
    i.state.userForm.username = event.target.value;
    i.setState(i.state);
  }

  handleRegisterEmailChange(i: Setup, event: any) {
    i.state.userForm.email = event.target.value;
    i.setState(i.state);
  }

  handleRegisterPasswordChange(i: Setup, event: any) {
    i.state.userForm.password = event.target.value;
    i.setState(i.state);
  }

  handleRegisterPasswordVerifyChange(i: Setup, event: any) {
    i.state.userForm.password_verify = event.target.value;
    i.setState(i.state);
  }

  parseMessage(msg: WebSocketJsonResponse) {
    let res = wsJsonToRes(msg);
    if (msg.error) {
      toast(i18n.t(msg.error), 'danger');
      this.setState({
        userLoading: false
      });
    } else if (res.op == UserOperation.Register) {
      let data = res.data as LoginResponse;
      this.setState({
        userLoading: false,
        doneRegisteringUser: true
      }, () => {
        UserService.Instance.login(data)
      });
    } else if (res.op == UserOperation.CreateSite) {
      this.props.history.push('/');
    }
  }
}
