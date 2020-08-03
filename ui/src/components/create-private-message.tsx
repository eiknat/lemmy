import React, { Component } from 'react';
import { Subscription } from 'rxjs';
import { retryWhen, delay, take } from 'rxjs/operators';
import { PrivateMessageForm } from './private-message-form';
import { WebSocketService, UserService } from '../services';
import {
  UserOperation,
  WebSocketJsonResponse,
  GetSiteResponse,
  PrivateMessageFormParams,
} from '../interfaces';
import { toast, wsJsonToRes } from '../utils';
import { i18n } from '../i18next';
import { withRouter } from 'react-router-dom';

export class BaseCreatePrivateMessage extends Component<any, any> {
  private subscription: Subscription;
  constructor(props: any, context: any) {
    super(props, context);
    this.handlePrivateMessageCreate = this.handlePrivateMessageCreate.bind(
      this
    );

    if (!UserService.Instance.user) {
      toast(i18n.t('not_logged_in'), 'danger');
      this.props.history.push(`/login`);
    }

    this.subscription = WebSocketService.Instance.subject
      .pipe(retryWhen(errors => errors.pipe(delay(3000), take(10))))
      .subscribe(
        msg => this.parseMessage(msg),
        err => console.error(err),
        () => console.log('complete')
      );

    WebSocketService.Instance.getSite();
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="col-12 col-lg-6 offset-lg-3 mb-4">
            <h5>{i18n.t('create_private_message')}</h5>
            <PrivateMessageForm
              onCreate={this.handlePrivateMessageCreate}
              params={this.params}
            />
          </div>
        </div>
      </div>
    );
  }

  get params(): PrivateMessageFormParams {
    let urlParams = new URLSearchParams(this.props.location.search);
    let params: PrivateMessageFormParams = {
      recipient_id: Number(urlParams.get('recipient_id')),
    };

    return params;
  }

  handlePrivateMessageCreate() {
    toast(i18n.t('message_sent'));

    // Navigate to the front
    this.props.history.push(`/`);
  }

  parseMessage(msg: WebSocketJsonResponse) {
    console.log(msg);
    let res = wsJsonToRes(msg);
    if (msg.error) {
      toast(i18n.t(msg.error), 'danger');
      return;
    } else if (res.op == UserOperation.GetSite) {
      let data = res.data as GetSiteResponse;
      document.title = `${i18n.t('create_private_message')} - ${
        data.site.name
      }`;
    }
  }
}

export const CreatePrivateMessage = withRouter(BaseCreatePrivateMessage);
