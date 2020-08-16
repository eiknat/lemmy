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
  GetCaptchaResponse,
  Site,
} from '../interfaces';
import { WebSocketService, UserService } from '../services';
import { wsJsonToRes, validEmail, toast, setupTippy } from '../utils';
import { i18n } from '../i18next';
import { linkEvent } from '../linkEvent';

interface State {
  loginForm: LoginForm;
  registerForm: RegisterForm;
  loginLoading: boolean;
  registerLoading: boolean;
  captcha: GetCaptchaResponse;
  captchaPlaying: boolean;
  site: Site;
}

export class Login extends Component<any, State> {
  private subscription: Subscription;

  emptyState: State = {
    loginForm: {
      username_or_email: undefined,
      password: undefined,
    },
    registerForm: {
      username: undefined,
      password: undefined,
      password_verify: undefined,
      admin: false,
      sitemod: false,
      show_nsfw: false,
      captcha_uuid: undefined,
      captcha_answer: undefined,
      hcaptcha_id: undefined,
      pronouns: null,
    },
    loginLoading: false,
    registerLoading: false,
    captcha: undefined,
    captchaPlaying: false,
    site: {
      id: undefined,
      name: undefined,
      creator_id: undefined,
      published: undefined,
      creator_name: undefined,
      number_of_users: undefined,
      number_of_posts: undefined,
      number_of_comments: undefined,
      number_of_communities: undefined,
      enable_downvotes: undefined,
      open_registration: undefined,
      enable_nsfw: undefined,
      enable_create_communities: undefined,
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

        {this.state.captcha && (
          <div className="form-group row">
            {this.state.captcha.ok && (
              <label className="col-sm-2" htmlFor="register-captcha">
                <span className="mr-2">{i18n.t('enter_code')}</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={linkEvent(this, this.handleRegenCaptcha)}
                >
                  <svg className="icon icon-refresh-cw">
                    <use xlinkHref="#icon-refresh-cw"></use>
                  </svg>
                </button>
              </label>
            )}
            {this.showCaptcha()}
            {this.state.captcha.ok && (
              <div className="col-sm-6">
                <input
                  type="text"
                  className="form-control"
                  id="register-captcha"
                  value={this.state.registerForm.captcha_answer}
                  onInput={linkEvent(
                    this,
                    this.handleRegisterCaptchaAnswerChange
                  )}
                  required
                />
              </div>
            )}
            {this.state.captcha.hcaptcha && (
              <div
                className="h-captcha h-captcha-register col-sm-10"
                id="h-captcha"
                data-sitekey={this.state.captcha.hcaptcha.site_key}
                data-theme="dark"
              />
            )}
          </div>
        )}
        {this.state.site.enable_nsfw && (
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
            <button
              type="submit" className="btn btn-secondary">
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

  showCaptcha() {
    return (
      <div className="col-sm-4">
        {this.state.captcha.ok && (
          <>
            <img
              className="rounded-top img-fluid"
              src={this.captchaPngSrc()}
              style="border-bottom-right-radius: 0; border-bottom-left-radius: 0;"
            />
            {this.state.captcha.ok.wav && (
              <button
                className="rounded-bottom btn btn-sm btn-secondary btn-block"
                style="border-top-right-radius: 0; border-top-left-radius: 0;"
                title={i18n.t('play_captcha_audio')}
                onClick={linkEvent(this, this.handleCaptchaPlay)}
                type="button"
                disabled={this.state.captchaPlaying}
              >
                <svg className="icon icon-play">
                  <use xlinkHref="#icon-play"></use>
                </svg>
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  handleLoginSubmit(i: Login, event: any) {
    event.preventDefault();
    let userOrEmail = (document.getElementById(
      'login-email-or-username'
    ) as HTMLInputElement).value;
    let pw = (document.getElementById('login-password'
    ) as HTMLInputElement).value;
    let newState = {
      ...i.state,
      loginLoading: true,
      loginForm: {
        username_or_email: userOrEmail,
        password: pw
      }
    };
    i.setState(newState);
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
    let newState = {
      ...i.state,
      registerLoading: true
    };
    if (i.state.captcha) {
      if (i.state.captcha.hcaptcha) {
        newState.registerForm.hcaptcha_id = (document.querySelectorAll(
          "textarea[name='h-captcha-response']"
        )[0] as HTMLInputElement).value;
      }
    }
    i.setState(newState);

    WebSocketService.Instance.register({
      ...i.state.registerForm,
      pronouns:
        i.state.registerForm.pronouns === 'none'
        ? null
        : i.state.registerForm.pronouns,
    });
  }

  handleRegisterUsernameChange(i: Login, event: any) {
    let newState = {...i.state};
    newState.registerForm.username = event.target.value;
    i.setState(newState);
  }

  handleRegisterEmailChange(i: Login, event: any) {
    let newState = {...i.state};
    newState.registerForm.email = event.target.value;
    i.setState(newState);
  }

  handleRegisterPasswordChange(i: Login, event: any) {
    let newState = {...i.state};
    newState.registerForm.password = event.target.value;
    i.setState(newState);
  }

  handleRegisterPasswordVerifyChange(i: Login, event: any) {
    let newState = {...i.state};
    newState.registerForm.password_verify = event.target.value;
    i.setState(newState);
  }

  handleRegisterShowNsfwChange(i: Login, event: any) {
    let newState = {...i.state};
    newState.registerForm.show_nsfw = event.target.checked;
    i.setState(newState);
  }

  handleRegisterCaptchaAnswerChange(i: Login, event: any) {
    let newState = {...i.state};
    newState.registerForm.captcha_answer = event.target.value;
    i.setState(newState);
  }

  handleRegenCaptcha(_i: Login, _event: any) {
    event.preventDefault();
    WebSocketService.Instance.getCaptcha();
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

  handleCaptchaPlay(i: Login) {
    event.preventDefault();
    let snd = new Audio('data:audio/wav;base64,' + i.state.captcha.ok.wav);
    snd.play();
    i.setState({...i.state, captchaPlaying: true});
    snd.addEventListener('ended', () => {
      snd.currentTime = 0;
      i.setState({...this.state, captchaPlaying: false});
    });
  }

  captchaPngSrc() {
    return `data:image/png;base64,${this.state.captcha.ok.png}`;
  }
  
  initHCaptcha() {
    const widgetID = hcaptcha.render('h-captcha', {
      sitekey: this.state.captcha.hcaptcha.site_key,
    });
  }

  parseMessage(msg: WebSocketJsonResponse) {
    console.log(msg);
    let res = wsJsonToRes(msg);
    let newState = {...this.emptyState};
    if (msg.error) {
      if (this.state.captcha.hcaptcha) {
        document.getElementById('h-captcha').innerHTML = '';
      }
      toast(i18n.t(msg.error), 'danger');

      // Refetch another captcha
      WebSocketService.Instance.getCaptcha();
      this.setState(newState);
      return;
    } else {
      if (res.op == UserOperation.Login) {
        let data = res.data as LoginResponse;
        this.setState(newState);
        UserService.Instance.login(data);
        WebSocketService.Instance.userJoin();
        toast(i18n.t('logged_in'));
        this.props.history.push('/');
      } else if (res.op == UserOperation.Register) {
        let data = res.data as LoginResponse;
        this.setState(newState);
        UserService.Instance.login(data);
        WebSocketService.Instance.userJoin();
        this.props.history.push('/communities');
      } else if (res.op == UserOperation.GetCaptcha) {
        let data = res.data as GetCaptchaResponse;
        if (data.ok || data.hcaptcha) {
          newState = {...this.state, captcha: data};
          if (data.ok) {
            newState.registerForm.captcha_uuid = data.ok.uuid;
          }
          this.setState(newState);
          if (data.hcaptcha) {
            this.initHCaptcha();
          }
        }
      } else if (res.op == UserOperation.PasswordReset) {
        toast(i18n.t('reset_password_mail_sent'));
      } else if (res.op == UserOperation.GetSite) {
        let data = res.data as GetSiteResponse;
        newState = {...this.state, site: data.site};
        this.setState(newState);
      }
    }
  }
}
