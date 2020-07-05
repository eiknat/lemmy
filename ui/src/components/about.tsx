import { Component } from 'inferno';
import { WebSocketService } from '../services';
import { i18n } from '../i18next';
import { T } from 'inferno-i18next';
import { repoUrl } from '../utils';

export class About extends Component<any, any> {
  constructor(props: any, context: any) {
    super(props, context);
  }

  componentDidMount() {
    document.title = `${i18n.t('about')} - ${
      WebSocketService.Instance.site.name
    }`;
    window.scrollTo(0, 0);
  }

  render() {
    return (
      <div class="container text-center">
        <div>
          <img
            src="/static/assets/banner.png"
            alt="bear with black text reading 'you have nothing to lose but your chains'"
          />
        </div>
        <div className="my-2">
          <p>About</p>
        </div>
      </div>
    );
  }
}
