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
import { i18n } from '../i18next';
import { HCAPTCHA_SITE_KEY } from '../env';
import { linkEvent } from '../linkEvent';

interface State {
  loginForm: LoginForm;
  registerForm: RegisterForm;
  loginLoading: boolean;
  registerLoading: boolean;
  enable_nsfw: boolean;
  mathQuestion: {
    a: number;
    b: number;
    answer: number;
  };
}

function initCaptcha() {
  // ignoring these warnings because it's a global
  // @ts-ignore
  // eslint-disable-next-line no-undef
  const widgetID = hcaptcha.render('h-captcha', {
    sitekey: HCAPTCHA_SITE_KEY,
  });
  // @ts-ignore
  // eslint-disable-next-line no-undef
  const widgetIDRegister = hcaptcha.render('h-captcha-register', {
    sitekey: HCAPTCHA_SITE_KEY,
  });
}

export class Login extends Component<any, State> {
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
      pronouns: null,
    },
    loginLoading: false,
    registerLoading: false,
    enable_nsfw: undefined,
    mathQuestion: {
      a: Math.floor(Math.random() * 10) + 1,
      b: Math.floor(Math.random() * 10) + 1,
      answer: undefined,
    },
  };

  constructor(props: any, context: any) {
    super(props, context);

    this.state = this.emptyState;

    this.handlePronounsChange = this.handlePronounsChange.bind(this);

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
    initCaptcha();
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="col-12 col-lg-6 mb-4">{this.loginForm()}</div>
          <div className="col-12 col-lg-6">{this.registerForm()}</div>
        </div>
      </div>
    );
  }

  loginForm() {
    return (
      <div>
        <form
          id="login-form"
          onSubmit={linkEvent(this, this.handleLoginSubmit)}
        >
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
            {/*hcaptcha target*/}
            <div
              className="col-sm-10 h-captcha"
              id="h-captcha"
              data-sitekey={HCAPTCHA_SITE_KEY}
              data-theme="dark"
            />
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
            {!validEmail(this.state.registerForm.email) && (
              <div className="mt-2 mb-0 alert alert-light" role="alert">
                <svg className="icon icon-inline mr-2">
                  <use xlinkHref="#icon-alert-triangle" />
                </svg>
                {i18n.t('no_password_reset')}
              </div>
            )}
          </div>
        </div>

        <div className="form-group row">
          <label className="col-sm-2 col-form-label" htmlFor="register-pronouns">
            {i18n.t('pronouns')}
          </label>
          <div className="col-sm-10">
            <select
              id="register-pronouns"
              value={this.state.registerForm.pronouns}
              className="custom-select custom-select-sm"
              onChange={this.handlePronounsChange}
            >
              <option value="none">none</option>
              <option value="they/them">they/them</option>
              <option value="she/her">she/her</option>
              <option value="he/him">he/him</option>
              <option value="any pronoun">any</option>
            </select>
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
        <div className="form-group row">
          <label className="col-sm-10 col-form-label" htmlFor="register-math">
            {i18n.t('what_is')}{' '}
            {`${this.state.mathQuestion.a} + ${this.state.mathQuestion.b}?`}
          </label>

          <div className="col-sm-2">
            <input
              type="number"
              id="register-math"
              className="form-control"
              value={this.state.mathQuestion.answer}
              onInput={linkEvent(this, this.handleMathAnswerChange)}
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
          {/*hcaptcha target*/}
          <div
            className="col-sm-10 h-captcha h-captcha-register"
            id="h-captcha-register"
            data-sitekey={HCAPTCHA_SITE_KEY}
            data-theme="dark"
          />
        </div>
        <div className="form-group row">
          <div className="col-sm-10">
            <button
              type="submit"
              className="btn btn-secondary"
              disabled={this.mathCheck}
            >
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

  handleLoginSubmit(i: Login, event: any) {
    event.preventDefault();
    i.state.loginLoading = true;
    i.state.loginForm.username_or_email = (document.getElementById(
      'login-email-or-username'
    ) as HTMLInputElement).value;
    i.state.loginForm.password = (document.getElementById(
      'login-password'
    ) as HTMLInputElement).value;
    i.state.loginForm.captcha_id = document.querySelector(
      "textarea[name='h-captcha-response']"
    ).value;
    i.setState(i.state);
    WebSocketService.Instance.login(i.state.loginForm);
  }

  handleLoginUsernameChange(i: Login, event: any) {
    i.state.loginForm.username_or_email = event.target.value;
    i.setState(i.state);
  }

  handleLoginPasswordChange(i: Login, event: any) {
    i.state.loginForm.password = event.target.value;
    i.setState(i.state);
  }

  handlePronounsChange(e: any) {
    this.setState({
      registerForm: {
        ...this.state.registerForm,
        pronouns: e.target.value,
      },
    });
  }

  handleRegisterSubmit(i: Login, event: any) {
    event.preventDefault();
    i.state.registerLoading = true;
    i.state.registerForm.captcha_id = (document.querySelectorAll(
      "textarea[name='h-captcha-response']"
    )[1] as HTMLInputElement).value;
    i.setState(i.state);

    if (!i.mathCheck) {
      WebSocketService.Instance.register({
        ...i.state.registerForm,
        pronouns:
          i.state.registerForm.pronouns === 'none'
            ? null
            : i.state.registerForm.pronouns,
      });
    }
  }

  handleRegisterUsernameChange(i: Login, event: any) {
    i.state.registerForm.username = event.target.value;
    i.setState(i.state);
  }

  handleRegisterEmailChange(i: Login, event: any) {
    i.state.registerForm.email = event.target.value;
    if (i.state.registerForm.email == '') {
      i.state.registerForm.email = undefined;
    }
    i.setState(i.state);
  }

  handleRegisterPasswordChange(i: Login, event: any) {
    i.state.registerForm.password = event.target.value;
    i.setState(i.state);
  }

  handleRegisterPasswordVerifyChange(i: Login, event: any) {
    i.state.registerForm.password_verify = event.target.value;
    i.setState(i.state);
  }

  handleRegisterShowNsfwChange(i: Login, event: any) {
    i.state.registerForm.show_nsfw = event.target.checked;
    i.setState(i.state);
  }

  handleMathAnswerChange(i: Login, event: any) {
    i.state.mathQuestion.answer = event.target.value;
    i.setState(i.state);
  }

  handlePasswordReset(i: Login) {
    event.preventDefault();
    let resetForm: PasswordResetForm = {
      email: i.state.loginForm.username_or_email,
    };
    WebSocketService.Instance.passwordReset(resetForm);
  }

  handleInvalidPasswordReset(i: Login, event: any) {
    document
      .getElementById('login-email-or-username')
      .classList.add('is-invalid');
    toast(i18n.t('email_required'), 'danger');
  }

  get mathCheck(): boolean {
    return (
      this.state.mathQuestion.answer !=
      this.state.mathQuestion.a + this.state.mathQuestion.b
    );
  }

  parseMessage(msg: WebSocketJsonResponse) {
    let res = wsJsonToRes(msg);
    if (msg.error) {
      if (msg.error.includes('invalid_captcha')) {
        let error_codes = msg.error.split(';'); //captcha error codes are sent deliniated with semicolons
        let error_message = '';
        error_codes.forEach(item => (error_message += i18n.t(item)));
        toast(error_message, 'danger');
        document.getElementById('h-captcha').innerHTML = '';
        initCaptcha();
      } else {
        toast(i18n.t(msg.error), 'danger');
      }
      this.state = this.emptyState;
      this.setState(this.state);
      return;
    } else {
      if (res.op == UserOperation.Login) {
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
        if (data.site) {
          this.setState({
            enable_nsfw: data.site.enable_nsfw
          });
          document.title = `${i18n.t('login')} - ${data.site.name}`;
        } else {
          console.log('site is null');
        }
      }
    }
  }
}
