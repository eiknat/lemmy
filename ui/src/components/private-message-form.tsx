import React, { Component } from 'react';
import { Prompt } from 'react-router-dom';
import { Subscription } from 'rxjs';
import { retryWhen, delay, take } from 'rxjs/operators';
import {
  PrivateMessageForm as PrivateMessageFormI,
  EditPrivateMessageForm,
  PrivateMessageFormParams,
  PrivateMessage,
  PrivateMessageResponse,
  UserView,
  UserOperation,
  UserDetailsResponse,
  GetUserDetailsForm,
  SortType,
  WebSocketJsonResponse,
} from '../interfaces';
import { WebSocketService } from '../services';
import {
  capitalizeFirstLetter,
  wsJsonToRes,
  toast,
  setupTippy,
} from '../utils';
import { UserListing } from './user-listing';
import { MarkdownTextArea } from './markdown-textarea';
import { i18n } from '../i18next';
import { Trans } from 'react-i18next';
import { TextAreaWithCounter } from './post-form';
import { linkEvent } from '../linkEvent';

interface PrivateMessageFormProps {
  privateMessage?: PrivateMessage; // If a pm is given, that means this is an edit
  params?: PrivateMessageFormParams;
  onCancel?(): any;
  onCreate?(message: PrivateMessage): any;
  onEdit?(message: PrivateMessage): any;
}

interface PrivateMessageFormState {
  privateMessageForm: PrivateMessageFormI;
  recipient: UserView;
  loading: boolean;
  previewMode: boolean;
  showDisclaimer: boolean;
}

export class PrivateMessageForm extends Component<
  PrivateMessageFormProps,
  PrivateMessageFormState
> {
  private subscription: Subscription;
  private emptyState: PrivateMessageFormState = {
    privateMessageForm: {
      content: null,
      recipient_id: null,
    },
    recipient: null,
    loading: false,
    previewMode: false,
    showDisclaimer: false,
  };

  state = this.emptyState;

  componentDidMount() {
    if (this.props.privateMessage) {
      this.state.privateMessageForm = {
        content: this.props.privateMessage.content,
        recipient_id: this.props.privateMessage.recipient_id,
      };
    }

    if (this.props.params) {
      this.state.privateMessageForm.recipient_id = this.props.params.recipient_id;
      let form: GetUserDetailsForm = {
        user_id: this.state.privateMessageForm.recipient_id,
        sort: SortType[SortType.New],
        saved_only: false,
      };
      WebSocketService.Instance.getUserDetails(form);
    }

    this.subscription = WebSocketService.Instance.subject
      .pipe(retryWhen(errors => errors.pipe(delay(3000), take(10))))
      .subscribe(
        msg => this.parseMessage(msg),
        err => console.error(err),
        () => console.log('complete')
      );

    setupTippy();
  }

  componentDidUpdate() {
    if (!this.state.loading && this.state.privateMessageForm.content) {
      window.onbeforeunload = () => true;
    } else {
      window.onbeforeunload = undefined;
    }
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
    window.onbeforeunload = null;
  }

  render() {
    return (
      <div>
        <Prompt
          // @ts-ignore
          when={!this.state.loading && this.state.privateMessageForm.content}
          message={i18n.t('block_leaving')}
        />
        <form onSubmit={linkEvent(this, this.handlePrivateMessageSubmit)}>
          {!this.props.privateMessage && (
            <div className="form-group row">
              <label className="col-sm-2 col-form-label">
                {capitalizeFirstLetter(i18n.t('to'))}
              </label>

              {this.state.recipient && (
                <div className="col-sm-10 form-control-plaintext">
                  <UserListing
                    user={{
                      name: this.state.recipient.name,
                      avatar: this.state.recipient.avatar,
                      id: this.state.recipient.id,
                      local: this.state.recipient.local,
                      actor_id: this.state.recipient.actor_id,
                    }}
                  />
                </div>
              )}
            </div>
          )}
          <div className="form-group row">
            <label className="col-sm-2 col-form-label">
              {i18n.t('message')}
              <span
                onClick={linkEvent(this, this.handleShowDisclaimer)}
                className="ml-2 pointer text-danger"
                data-tippy-content={i18n.t('disclaimer')}
              >
                <svg className="icon icon-inline">
                  <use xlinkHref="#icon-alert-triangle" />
                </svg>
              </span>
            </label>
            <div className="col-sm-10">
              <MarkdownTextArea
                initialContent={this.state.privateMessageForm.content}
                onContentChange={this.handleContentChange}
              />
            </div>
          </div>

          {this.state.showDisclaimer && (
            <div className="form-group row">
              <div className="offset-sm-2 col-sm-10">
                <div className="alert alert-danger" role="alert">
                  <Trans i18nKey="private_message_disclaimer">
                    #
                    <a
                      className="alert-link"
                      target="_blank"
                      rel="noreferrer"
                      href="https://element.io/get-started"
                    >
                      #
                    </a>
                  </Trans>
                </div>
              </div>
            </div>
          )}
          <div className="form-group row">
            <div className="offset-sm-2 col-sm-10">
              <button
                type="submit"
                className="btn btn-secondary mr-2"
                disabled={this.state.loading}
              >
                {this.state.loading ? (
                  <svg className="icon icon-spinner spin">
                    <use xlinkHref="#icon-spinner" />
                  </svg>
                ) : this.props.privateMessage ? (
                  capitalizeFirstLetter(i18n.t('save'))
                ) : (
                  capitalizeFirstLetter(i18n.t('send_message'))
                )}
              </button>
              {this.props.privateMessage && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={linkEvent(this, this.handleCancel)}
                >
                  {i18n.t('cancel')}
                </button>
              )}
              <ul className="d-inline-block float-right list-inline mb-1 text-muted font-weight-bold">
                <li className="list-inline-item" />
              </ul>
            </div>
          </div>
        </form>
      </div>
    );
  }

  handlePrivateMessageSubmit(i: PrivateMessageForm, event: any) {
    event.preventDefault();
    if (i.props.privateMessage) {
      let editForm: EditPrivateMessageForm = {
        edit_id: i.props.privateMessage.id,
        content: i.state.privateMessageForm.content,
      };
      WebSocketService.Instance.editPrivateMessage(editForm);
    } else {
      WebSocketService.Instance.createPrivateMessage(
        i.state.privateMessageForm
      );
    }
    i.setState({ loading: true });
  }

  handleRecipientChange(i: PrivateMessageForm, event: any) {
    i.state.recipient = event.target.value;
    i.setState(i.state);
  }

  handleContentChange = (val: string) => {
    this.setState({
      privateMessageForm: { ...this.state.privateMessageForm, content: val },
    });
  };

  handleCancel(i: PrivateMessageForm) {
    i.props.onCancel();
  }

  handlePreviewToggle = (i: PrivateMessageForm, event: any) => {
    event.preventDefault();
    // i.state.previewMode = !i.state.previewMode;
    this.setState({ previewMode: !this.state.previewMode });
  };

  handleShowDisclaimer = () => {
    this.setState({ showDisclaimer: !this.state.showDisclaimer });
  };

  parseMessage(msg: WebSocketJsonResponse) {
    let res = wsJsonToRes(msg);
    if (msg.error) {
      toast(i18n.t(msg.error), 'danger');
      this.setState({ loading: false });
      return;
    } else if (res.op == UserOperation.EditPrivateMessage) {
      let data = res.data as PrivateMessageResponse;
      this.setState({ loading: false });
      this.props.onEdit(data.message);
    } else if (res.op == UserOperation.GetUserDetails) {
      let data = res.data as UserDetailsResponse;
      this.setState({
        recipient: data.user,
        privateMessageForm: {
          ...this.state.privateMessageForm,
          recipient_id: data.user.id,
        },
      });
    } else if (res.op == UserOperation.CreatePrivateMessage) {
      let data = res.data as PrivateMessageResponse;
      this.setState({ loading: false });
      this.props.onCreate(data.message);
    }
  }
}
