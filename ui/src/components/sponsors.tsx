import { Component } from 'inferno';
import { Subscription } from 'rxjs';
import { retryWhen, delay, take } from 'rxjs/operators';
import { WebSocketService } from '../services';
import {
  GetSiteResponse,
  WebSocketJsonResponse,
  UserOperation,
} from '../interfaces';
import { i18n } from '../i18next';
import { T } from 'inferno-i18next';
import { repoUrl, wsJsonToRes, toast } from '../utils';
import { PATREON_URL } from '../constants';

export class Sponsors extends Component<any, any> {
  private subscription: Subscription;
  constructor(props: any, context: any) {
    super(props, context);
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
    window.scrollTo(0, 0);
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  render() {
    return <div class="container text-center">{this.topMessage()}</div>;
  }

  topMessage() {
    return (
      <div>
        <div>
          <h4 class="my-2">
            Support Chapo.chat and the Chapo Collective on Patreon
          </h4>
          <p>
            The Chapo Cooperative is a collective of leftist software developers
            building an independent space for solidarity and true
            democratization on the internet.
          </p>
          <a class="btn btn-secondary ml-2" href={PATREON_URL}>
            {i18n.t('support_on_patreon')}
          </a>
        </div>
        <hr />
        <div>
          <h5>{i18n.t('donate_to_lemmy')}</h5>
          <p>
            <T i18nKey="sponsor_message">
              #<a href={repoUrl}>#</a>
            </T>
          </p>
          <a class="btn btn-secondary" href="https://liberapay.com/Lemmy/">
            {i18n.t('support_on_liberapay')}
          </a>
          <a
            class="btn btn-secondary ml-2"
            href="https://www.patreon.com/dessalines"
          >
            {i18n.t('support_on_patreon')}
          </a>
          <a
            class="btn btn-secondary ml-2"
            href="https://opencollective.com/lemmy"
          >
            {i18n.t('support_on_open_collective')}
          </a>
        </div>
      </div>
    );
  }

  parseMessage(msg: WebSocketJsonResponse) {
    console.log(msg);
    let res = wsJsonToRes(msg);
    if (msg.error) {
      toast(i18n.t(msg.error), 'danger');
      return;
    } else if (res.op == UserOperation.GetSite) {
      let data = res.data as GetSiteResponse;
      document.title = `${i18n.t('sponsors')} - ${data.site.name}`;
    }
  }
}
