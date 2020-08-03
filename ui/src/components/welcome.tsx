import React, { Component } from 'react';
import { Subscription } from 'rxjs';
import { retryWhen, delay, take } from 'rxjs/operators';
import {
  LoginForm,
  RegisterForm,
  LoginResponse,
  UserOperation,
  PasswordResetForm,
  GetSiteResponse,
  WebSocketJsonResponse,
} from '../interfaces';
import { WebSocketService, UserService } from '../services';
import { wsJsonToRes, validEmail, toast, setupTippy } from '../utils';
import { BASE_PATH } from "../isProduction";
import { i18n } from '../i18next';
import { linkEvent } from '../linkEvent';

interface State {
  loginForm: LoginForm;
  registerForm: RegisterForm;
  loginLoading: boolean;
  registerLoading: boolean;
  enable_nsfw: boolean;
}

export class WelcomePage extends Component<any, State> {
  private subscription: Subscription;

  emptyState: State = {
    loginForm: {
      username_or_email: undefined,
      password: undefined,
      captcha_id: undefined,
    },
    registerForm: {
      username: undefined,
      password: undefined,
      password_verify: undefined,
      admin: false,
      show_nsfw: false,
      captcha_id: undefined,
    },
    loginLoading: false,
    registerLoading: false,
    enable_nsfw: undefined,
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

    WebSocketService.Instance.getSite();
  }

  componentDidMount() {
    setupTippy();
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="welcome-container">
            <div className="text-center my-4 p-1">
              <img
                className="img-fluid mb-2 welcome-logo"
                src={`${BASE_PATH}logo.png`}
                alt="vaporwave hammer and sickle logo, courtesy of ancestral potato"
              />
              <h3>Chapo Trap House is coming</h3>
              <h4>
                Pre-register your account now before all the good ones are gone.
              </h4>
            </div>
            <div className="welcome-content">{this.registerForm()}</div>
          </div>
        </div>
      </div>
    );
  }

  loginForm() {
    return (
      <div>
        <form onSubmit={linkEvent(this, this.handleLoginSubmit)}>
          <h5>{i18n.t('login')}</h5>
          <div className="form-group row">
            <label
              className="col-sm-2 col-form-label"
              htmlFor="login-email-or-username"
            >
              {i18n.t('email_or_username')}
            </label>
            <div className="col-sm-10">
              <input
                type="text"
                className="form-control"
                id="login-email-or-username"
                value={this.state.loginForm.username_or_email}
                onInput={linkEvent(this, this.handleLoginUsernameChange)}
                required
                minLength={3}
              />
            </div>
          </div>
          <div className="form-group row">
            <label className="col-sm-2 col-form-label" htmlFor="login-password">
              {i18n.t('password')}
            </label>
            <div className="col-sm-10">
              <input
                type="password"
                id="login-password"
                value={this.state.loginForm.password}
                onInput={linkEvent(this, this.handleLoginPasswordChange)}
                className="form-control"
                required
              />
              {!validEmail(this.state.loginForm.username_or_email) ? (
                <button
                  type="button"
                  onClick={linkEvent(this, this.handleInvalidPasswordReset)}
                  data-tippy-content={i18n.t('email_required')}
                  className="btn p-0 btn-link d-inline-block float-right text-muted small font-weight-bold"
                >
                  {i18n.t('forgot_password')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={linkEvent(this, this.handlePasswordReset)}
                  className="btn p-0 btn-link d-inline-block float-right text-muted small font-weight-bold"
                >
                  {i18n.t('forgot_password')}
                </button>
              )}
            </div>
          </div>
          <div className="form-group row">
            <div className="col-sm-10">
              <button type="submit" className="btn btn-secondary">
                {this.state.loginLoading ? (
                  <svg className="icon icon-spinner spin">
                    <use xlinkHref="#icon-spinner" />
                  </svg>
                ) : (
                  i18n.t('login')
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }
  registerForm() {
    return (
      <form onSubmit={linkEvent(this, this.handleRegisterSubmit)}>
        <h5>{i18n.t('sign_up')}</h5>

        <div className="form-group row">
          <label className="col-sm-2 col-form-label" htmlFor="register-username">
            {i18n.t('username')}
          </label>

          <div className="col-sm-10">
            <input
              type="text"
              id="register-username"
              className="form-control"
              value={this.state.registerForm.username}
              onInput={linkEvent(this, this.handleRegisterUsernameChange)}
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
            />
          </div>
        </div>

        <div className="form-group row">
          <label className="col-sm-2 col-form-label" htmlFor="register-email">
            {i18n.t('email')}
          </label>
          <div className="col-sm-10">
            <input
              type="email"
              id="register-email"
              className="form-control"
              placeholder={i18n.t('optional')}
              value={this.state.registerForm.email}
              onInput={linkEvent(this, this.handleRegisterEmailChange)}
              minLength={3}
            />
          </div>
        </div>

        <div className="form-group row">
          <label className="col-sm-2 col-form-label" htmlFor="register-password">
            {i18n.t('password')}
          </label>
          <div className="col-sm-10">
            <input
              type="password"
              id="register-password"
              value={this.state.registerForm.password}
              autoComplete="new-password"
              onInput={linkEvent(this, this.handleRegisterPasswordChange)}
              className="form-control"
              required
            />
          </div>
        </div>

        <div className="form-group row">
          <label
            className="col-sm-2 col-form-label"
            htmlFor="register-verify-password"
          >
            {i18n.t('verify_password')}
          </label>
          <div className="col-sm-10">
            <input
              type="password"
              id="register-verify-password"
              value={this.state.registerForm.password_verify}
              autoComplete="new-password"
              onInput={linkEvent(this, this.handleRegisterPasswordVerifyChange)}
              className="form-control"
              required
            />
          </div>
        </div>
        {this.state.enable_nsfw && (
          <div className="form-group row">
            <div className="col-sm-10">
              <div className="form-check">
                <input
                  className="form-check-input"
                  id="register-show-nsfw"
                  type="checkbox"
                  checked={this.state.registerForm.show_nsfw}
                  onChange={linkEvent(this, this.handleRegisterShowNsfwChange)}
                />
                <label className="form-check-label" htmlFor="register-show-nsfw">
                  {i18n.t('show_nsfw')}
                </label>
              </div>
            </div>
          </div>
        )}
        <div className="form-group row">
          <div className="col-sm-10">
            <div className="form-check">
              <input
                className="form-check-input"
                id="tos"
                type="checkbox"
                required
              />
              <label className="form-check-label" htmlFor="tos">
                {i18n.t('TOS')}
              </label>
            </div>
          </div>
        </div>
        <div className="form-group row">
          <div className="col-sm-12">
            <button type="submit" className="btn btn-secondary btn-block">
              {this.state.registerLoading ? (
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

  handleLoginSubmit(i: WelcomePage, event: any) {
    event.preventDefault();
    i.state.loginLoading = true;
    i.state.loginForm.username_or_email = document.getElementById(
      'login-email-or-username'
    ).value;
    i.state.loginForm.password = document.getElementById(
      'login-password'
    ).value;
    i.setState(i.state);
    WebSocketService.Instance.login(i.state.loginForm);
  }

  handleLoginUsernameChange(i: WelcomePage, event: any) {
    i.state.loginForm.username_or_email = event.target.value;
    i.setState(i.state);
  }

  handleLoginPasswordChange(i: WelcomePage, event: any) {
    i.state.loginForm.password = event.target.value;
    i.setState(i.state);
  }

  handleRegisterSubmit(i: WelcomePage, event: any) {
    event.preventDefault();
    i.state.registerLoading = true;
    i.setState(i.state);

    WebSocketService.Instance.register(i.state.registerForm);
  }

  handleRegisterUsernameChange(i: WelcomePage, event: any) {
    i.state.registerForm.username = event.target.value;
    i.setState(i.state);
  }

  handleRegisterEmailChange(i: WelcomePage, event: any) {
    i.state.registerForm.email = event.target.value;
    if (i.state.registerForm.email == '') {
      i.state.registerForm.email = undefined;
    }
    i.setState(i.state);
  }

  handleRegisterPasswordChange(i: WelcomePage, event: any) {
    i.state.registerForm.password = event.target.value;
    i.setState(i.state);
  }

  handleRegisterPasswordVerifyChange(i: WelcomePage, event: any) {
    i.state.registerForm.password_verify = event.target.value;
    i.setState(i.state);
  }

  handleRegisterShowNsfwChange(i: WelcomePage, event: any) {
    i.state.registerForm.show_nsfw = event.target.checked;
    i.setState(i.state);
  }

  handlePasswordReset(i: WelcomePage) {
    event.preventDefault();
    let resetForm: PasswordResetForm = {
      email: i.state.loginForm.username_or_email,
    };
    WebSocketService.Instance.passwordReset(resetForm);
  }

  handleInvalidPasswordReset(i: WelcomePage, event: any) {
    document
      .getElementById('login-email-or-username')
      .classList.add('is-invalid');
  }

  parseMessage(msg: WebSocketJsonResponse) {
    let res = wsJsonToRes(msg);
    if (msg.error) {
      toast(i18n.t(msg.error), 'danger');
      this.state = this.emptyState;
      this.setState(this.state);
      return;
    } else {
      if (res.op == UserOperation.WelcomePage) {
        let data = res.data as LoginResponse;
        this.state = this.emptyState;
        this.setState(this.state);
        UserService.Instance.login(data);
        WebSocketService.Instance.userJoin();
        toast(i18n.t('logged_in'));
        this.props.history.push('/');
      } else if (res.op == UserOperation.Register) {
        let data = res.data as LoginResponse;
        this.state = this.emptyState;
        this.setState(this.state);
        UserService.Instance.login(data);
        WebSocketService.Instance.userJoin();
        this.props.history.push('/communities');
      } else if (res.op == UserOperation.PasswordReset) {
        toast(i18n.t('reset_password_mail_sent'));
      } else if (res.op == UserOperation.GetSite) {
        let data = res.data as GetSiteResponse;
        this.state.enable_nsfw = data.site.enable_nsfw;
        this.setState(this.state);
        document.title = `${i18n.t('login')} - ${
          WebSocketService.Instance.site.name
        }`;
      }
    }
  }
}
