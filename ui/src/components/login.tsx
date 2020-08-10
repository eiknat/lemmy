import { Component, linkEvent } from 'inferno';
import { Helmet } from 'inferno-helmet';
import { Subscription } from 'rxjs';
import { retryWhen, delay, take } from 'rxjs/operators';
import {
  LoginForm,
  RegisterForm,
  LoginResponse,
  UserOperation,
  PasswordResetForm,
  GetSiteResponse,
  GetCaptchaResponse,
  WebSocketJsonResponse,
  Site,
} from '../interfaces';
import { WebSocketService, UserService } from '../services';
import { wsJsonToRes, validEmail, toast, setupTippy } from '../utils';
import { i18n } from '../i18next';
import { HCAPTCHA_SITE_KEY } from '../env';

interface State {
  loginForm: LoginForm;
  registerForm: RegisterForm;
  loginLoading: boolean;
  registerLoading: boolean;
  captcha: GetCaptchaResponse;
  captchaPlaying: boolean;
  site: Site;
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
    WebSocketService.Instance.getCaptcha();
  }

  componentDidMount() {
    setupTippy();
    initCaptcha();
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  get documentTitle(): string {
    if (this.state.site.name) {
      return `${i18n.t('login')} - ${this.state.site.name}`;
    } else {
      return 'Lemmy';
    }
  }

  render() {
    return (
      <div class="container">
        <Helmet title={this.documentTitle} />
        <div class="row">
          <div class="col-12 col-lg-6 mb-4">{this.loginForm()}</div>
          <div class="col-12 col-lg-6">{this.registerForm()}</div>
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
          <div class="form-group row">
            <label
              class="col-sm-2 col-form-label"
              htmlFor="login-email-or-username"
            >
              {i18n.t('email_or_username')}
            </label>
            <div class="col-sm-10">
              <input
                type="text"
                class="form-control"
                id="login-email-or-username"
                value={this.state.loginForm.username_or_email}
                onInput={linkEvent(this, this.handleLoginUsernameChange)}
                required
                minLength={3}
              />
            </div>
          </div>
          <div class="form-group row">
            <label class="col-sm-2 col-form-label" htmlFor="login-password">
              {i18n.t('password')}
            </label>
            <div class="col-sm-10">
              <input
                type="password"
                id="login-password"
                value={this.state.loginForm.password}
                onInput={linkEvent(this, this.handleLoginPasswordChange)}
                class="form-control"
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
          <div class="form-group row">
            {/*hcaptcha target*/}
            <div
              className="h-captcha"
              class="col-sm-10"
              id="h-captcha"
              data-sitekey={HCAPTCHA_SITE_KEY}
              data-theme="dark"
            />
          </div>
          <div class="form-group row">
            <div class="col-sm-10">
              <button type="submit" class="btn btn-secondary">
                {this.state.loginLoading ? (
                  <svg class="icon icon-spinner spin">
                    <use xlinkHref="#icon-spinner"></use>
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

        <div class="form-group row">
          <label class="col-sm-2 col-form-label" htmlFor="register-username">
            {i18n.t('username')}
          </label>

          <div class="col-sm-10">
            <input
              type="text"
              id="register-username"
              class="form-control"
              value={this.state.registerForm.username}
              onInput={linkEvent(this, this.handleRegisterUsernameChange)}
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
            />
          </div>
        </div>

        <div class="form-group row">
          <label class="col-sm-2 col-form-label" htmlFor="register-email">
            {i18n.t('email')}
          </label>
          <div class="col-sm-10">
            <input
              type="email"
              id="register-email"
              class="form-control"
              placeholder={i18n.t('optional')}
              value={this.state.registerForm.email}
              onInput={linkEvent(this, this.handleRegisterEmailChange)}
              minLength={3}
            />
            {!validEmail(this.state.registerForm.email) && (
              <div class="mt-2 mb-0 alert alert-light" role="alert">
                <svg class="icon icon-inline mr-2">
                  <use xlinkHref="#icon-alert-triangle"></use>
                </svg>
                {i18n.t('no_password_reset')}
              </div>
            )}
          </div>
        </div>

        <div class="form-group row">
          <label class="col-sm-2 col-form-label" htmlFor="register-pronouns">
            {i18n.t('pronouns')}
          </label>
          <div class="col-sm-10">
            <select
              id="register-pronouns"
              value={this.state.registerForm.pronouns}
              class="custom-select custom-select-sm"
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

        <div class="form-group row">
          <label class="col-sm-2 col-form-label" htmlFor="register-password">
            {i18n.t('password')}
          </label>
          <div class="col-sm-10">
            <input
              type="password"
              id="register-password"
              value={this.state.registerForm.password}
              autoComplete="new-password"
              onInput={linkEvent(this, this.handleRegisterPasswordChange)}
              class="form-control"
              required
            />
          </div>
        </div>

        <div class="form-group row">
          <label
            class="col-sm-2 col-form-label"
            htmlFor="register-verify-password"
          >
            {i18n.t('verify_password')}
          </label>
          <div class="col-sm-10">
            <input
              type="password"
              id="register-verify-password"
              value={this.state.registerForm.password_verify}
              autoComplete="new-password"
              onInput={linkEvent(this, this.handleRegisterPasswordVerifyChange)}
              class="form-control"
              required
            />
          </div>
        </div>

        {this.state.captcha && (
          <div class="form-group row">
            <label class="col-sm-2" htmlFor="register-captcha">
              <span class="mr-2">{i18n.t('enter_code')}</span>
              <button
                type="button"
                class="btn btn-secondary"
                onClick={linkEvent(this, this.handleRegenCaptcha)}
              >
                <svg class="icon icon-refresh-cw">
                  <use xlinkHref="#icon-refresh-cw"></use>
                </svg>
              </button>
            </label>
            {this.showCaptcha()}
            <div class="col-sm-6">
              <input
                type="text"
                class="form-control"
                id="register-captcha"
                value={this.state.registerForm.captcha_answer}
                onInput={linkEvent(
                  this,
                  this.handleRegisterCaptchaAnswerChange
                )}
                required
              />
            </div>
          </div>
        )}
        {this.state.site.enable_nsfw && (
          <div class="form-group row">
            <div class="col-sm-10">
              <div class="form-check">
                <input
                  class="form-check-input"
                  id="register-show-nsfw"
                  type="checkbox"
                  checked={this.state.registerForm.show_nsfw}
                  onChange={linkEvent(this, this.handleRegisterShowNsfwChange)}
                />
                <label class="form-check-label" htmlFor="register-show-nsfw">
                  {i18n.t('show_nsfw')}
                </label>
              </div>
            </div>
          </div>
        )}
        <div class="form-group row">
          {/*hcaptcha target*/}
          <div
            className="h-captcha h-captcha-register"
            class="col-sm-10"
            id="h-captcha-register"
            data-sitekey={HCAPTCHA_SITE_KEY}
            data-theme="dark"
          />
        </div>
        <div class="form-group row">
          <div class="col-sm-10">
            <button type="submit" class="btn btn-secondary">
              {this.state.registerLoading ? (
                <svg class="icon icon-spinner spin">
                  <use xlinkHref="#icon-spinner"></use>
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
      <div class="col-sm-4">
        {this.state.captcha.ok && (
          <>
            <img
              class="rounded-top img-fluid"
              src={this.captchaPngSrc()}
              style="border-bottom-right-radius: 0; border-bottom-left-radius: 0;"
            />
            {this.state.captcha.ok.wav && (
              <button
                class="rounded-bottom btn btn-sm btn-secondary btn-block"
                style="border-top-right-radius: 0; border-top-left-radius: 0;"
                title={i18n.t('play_captcha_audio')}
                onClick={linkEvent(this, this.handleCaptchaPlay)}
                type="button"
                disabled={this.state.captchaPlaying}
              >
                <svg class="icon icon-play">
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

  handleRegisterCaptchaAnswerChange(i: Login, event: any) {
    i.state.registerForm.captcha_answer = event.target.value;
    i.setState(i.state);
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

  get mathCheck(): boolean {
    return (
      this.state.mathQuestion.answer !=
      this.state.mathQuestion.a + this.state.mathQuestion.b
    );
  }

  handleCaptchaPlay(i: Login) {
    event.preventDefault();
    let snd = new Audio('data:audio/wav;base64,' + i.state.captcha.ok.wav);
    snd.play();
    i.state.captchaPlaying = true;
    i.setState(i.state);
    snd.addEventListener('ended', () => {
      snd.currentTime = 0;
      i.state.captchaPlaying = false;
      i.setState(this.state);
    });
  }

  captchaPngSrc() {
    return `data:image/png;base64,${this.state.captcha.ok.png}`;
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
      this.state.registerForm.captcha_answer = undefined;
      // Refetch another captcha
      WebSocketService.Instance.getCaptcha();
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
      } else if (res.op == UserOperation.GetCaptcha) {
        let data = res.data as GetCaptchaResponse;
        if (data.ok) {
          this.state.captcha = data;
          this.state.registerForm.captcha_uuid = data.ok.uuid;
          this.setState(this.state);
        }
      } else if (res.op == UserOperation.PasswordReset) {
        toast(i18n.t('reset_password_mail_sent'));
      } else if (res.op == UserOperation.GetSite) {
        let data = res.data as GetSiteResponse;
        this.state.site = data.site;
        this.setState(this.state);
      }
    }
  }
}
