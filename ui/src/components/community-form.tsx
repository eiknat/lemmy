import React, { Component } from 'react';
import { Prompt } from 'react-router-dom';
import { Subscription } from 'rxjs';
import { retryWhen, delay, take } from 'rxjs/operators';
import {
  CommunityForm as CommunityFormI,
  UserOperation,
  Category,
  ListCategoriesResponse,
  CommunityResponse,
  WebSocketJsonResponse,
  CommunitySettingsResponse,
} from '../interfaces';
import { WebSocketService } from '../services';
import { wsJsonToRes, capitalizeFirstLetter, toast, randomStr } from '../utils';
import { i18n } from '../i18next';

import { Community } from '../interfaces';
import { MarkdownTextArea } from './markdown-textarea';
import { linkEvent } from '../linkEvent';

interface CommunityFormProps {
  community?: Community; // If a community is given, that means this is an edit
  onCancel?(): any;
  onCreate?(community: Community): any;
  onEdit?(community: Community): any;
  enableNsfw: boolean;
}

interface CommunityFormState {
  communityForm: CommunityFormI;
  categories: Array<Category>;
  loading: boolean;
  enable_nsfw: boolean;
  community_settings?: {
    read_only: boolean;
    private: boolean;
    post_links: boolean;
    comment_images: number;
    published: string;
  };
}

export class CommunityForm extends Component<
  CommunityFormProps,
  CommunityFormState
> {
  private id = `community-form-${randomStr()}`;
  private subscription: Subscription;

  private emptyState: CommunityFormState = {
    communityForm: {
      name: null,
      title: null,
      category_id: null,
      nsfw: false,
    },
    categories: [],
    loading: false,
    enable_nsfw: null,
    community_settings: null,
  };

  constructor(props: any, context: any) {
    super(props, context);

    this.state = this.emptyState;

    this.handleCommunityDescriptionChange = this.handleCommunityDescriptionChange.bind(
      this
    );

    if (this.props.community) {
      this.state.communityForm = {
        name: this.props.community.name,
        title: this.props.community.title,
        category_id: this.props.community.category_id,
        description: this.props.community.description,
        edit_id: this.props.community.id,
        nsfw: this.props.community.nsfw,
        auth: null,
      };
    }

    this.subscription = WebSocketService.Instance.subject
      .pipe(retryWhen(errors => errors.pipe(delay(3000), take(10))))
      .subscribe(
        msg => this.parseMessage(msg),
        err => console.error(err),
        () => console.log('complete')
      );

    WebSocketService.Instance.listCategories();

    if (this.props.community) {
      WebSocketService.Instance.getCommunitySettings({
        community_id: this.props.community.id,
      });
    }

    WebSocketService.Instance.getSite();
  }

  componentDidUpdate() {
    if (
      !this.state.loading &&
      (this.state.communityForm.name ||
        this.state.communityForm.title ||
        this.state.communityForm.description)
    ) {
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
      <>
        <Prompt
          when={
            !this.state.loading &&
            (!!this.state.communityForm.name ||
              !!this.state.communityForm.title ||
              !!this.state.communityForm.description)
          }
          message={i18n.t('block_leaving')}
        />
        <form onSubmit={linkEvent(this, this.handleCreateCommunitySubmit)}>
          {!this.props.community && (
            <div className="form-group row">
              <label className="col-12 col-form-label" htmlFor="community-name">
                {i18n.t('name')}
              </label>
              <div className="col-12">
                <input
                  type="text"
                  id="community-name"
                  className="form-control"
                  value={this.state.communityForm.name}
                  onInput={linkEvent(this, this.handleCommunityNameChange)}
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-z0-9_]+"
                  title={i18n.t('community_reqs')}
                />
              </div>
            </div>
          )}
          <div className="form-group row">
            <label className="col-12 col-form-label" htmlFor="community-title">
              {i18n.t('title')}
            </label>
            <div className="col-12">
              <input
                type="text"
                id="community-title"
                value={this.state.communityForm.title}
                onInput={linkEvent(this, this.handleCommunityTitleChange)}
                className="form-control"
                required
                minLength={3}
                maxLength={100}
              />
            </div>
          </div>
          <div className="form-group row">
            <label className="col-12 col-form-label" htmlFor={this.id}>
              {i18n.t('sidebar')}
            </label>
            <div className="col-12">
              <MarkdownTextArea
                initialContent={this.state.communityForm.description}
                onContentChange={this.handleCommunityDescriptionChange}
              />
            </div>
          </div>
          <div className="form-group row">
            <label className="col-12 col-form-label" htmlFor="community-category">
              {i18n.t('category')}
            </label>
            <div className="col-12">
              <select
                className="form-control"
                id="community-category"
                value={this.state.communityForm.category_id}
                onInput={linkEvent(this, this.handleCommunityCategoryChange)}
              >
                {this.state.categories.map(category => (
                  <option value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>

          {this.props.enableNsfw && (
            <div className="form-group row">
              <div className="col-12">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    id="community-nsfw"
                    type="checkbox"
                    checked={this.state.communityForm.nsfw}
                    onChange={linkEvent(this, this.handleCommunityNsfwChange)}
                  />
                  <label className="form-check-label" htmlFor="community-nsfw">
                    {i18n.t('nsfw')}
                  </label>
                </div>
              </div>
            </div>
          )}

          {this.props.community &&
            this.state.community_settings &&
            this.communitySettings()}

          <div className="form-group row">
            <div className="col-12">
              <button
                type="submit"
                className="btn btn-secondary mr-2"
                disabled={this.state.loading}
              >
                {this.state.loading ? (
                  <svg className="icon icon-spinner spin">
                    <use xlinkHref="#icon-spinner" />
                  </svg>
                ) : this.props.community ? (
                  capitalizeFirstLetter(i18n.t('save'))
                ) : (
                  capitalizeFirstLetter(i18n.t('create'))
                )}
              </button>
              {this.props.community && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={linkEvent(this, this.handleCancel)}
                >
                  {i18n.t('cancel')}
                </button>
              )}
            </div>
          </div>
        </form>
      </>
    );
  }

  communitySettings() {
    return (
      <section className="my-4">
        <p className="h5 mb-3">{i18n.t('community_settings')}</p>
        {/* <p className="text-muted mb-3">
          <small>{this.state.community_settings.published}</small>
        </p> */}
        <div className="form-group row">
          <div className="col-12">
            <div className="form-check">
              <input
                className="form-check-input"
                id="community-read-only"
                type="checkbox"
                checked={this.state.community_settings.read_only}
                onChange={linkEvent(this, this.handleCommunityReadOnlyChange)}
              />
              <label className="form-check-label" htmlFor="community-read-only">
                {i18n.t('community_read_only')}
              </label>
            </div>
          </div>
        </div>
        <div className="form-group row">
          <div className="col-12">
            <div className="form-check">
              <input
                className="form-check-input"
                id="community-private"
                type="checkbox"
                checked={this.state.community_settings.private}
                onChange={linkEvent(this, this.handleCommunityPrivateChange)}
              />
              <label className="form-check-label" htmlFor="community-private">
                {i18n.t('community_private')}
              </label>
            </div>
          </div>
        </div>
        <div className="form-group row mb-3">
          <div className="col-12">
            <div className="form-check">
              <input
                className="form-check-input"
                id="community-post-links"
                type="checkbox"
                checked={this.state.community_settings.post_links}
                onChange={linkEvent(this, this.handleCommunityPostLinksChange)}
              />
              <label className="form-check-label" htmlFor="community-post-links">
                {i18n.t('community_post_links')}
              </label>
            </div>
          </div>
        </div>
        <div className="form-group row">
          <label
            className="col-12 col-form-label pt-0"
            htmlFor="community-comment-images"
          >
            {i18n.t('community_comment_images')}
          </label>
          <div className="col-12">
            <input
              className="form-control"
              id="community-comment-images"
              type="number"
              value={this.state.community_settings.comment_images}
              onInput={linkEvent(this, this.handleCommunityCommentImagesChange)}
            />
          </div>
        </div>
      </section>
    );
  }

  handleCreateCommunitySubmit(i: CommunityForm, event: any) {
    event.preventDefault();
    i.state.loading = true;
    if (i.props.community) {
      WebSocketService.Instance.editCommunity(i.state.communityForm);

      const {
        published,
        ...communitySettingsForm
      } = i.state.community_settings;

      WebSocketService.Instance.editCommunitySettings({
        ...communitySettingsForm,
        community_id: i.props.community.id,
      });
    } else {
      WebSocketService.Instance.createCommunity(i.state.communityForm);
    }
    i.setState(i.state);
  }

  handleCommunityNameChange(i: CommunityForm, event: any) {
    i.state.communityForm.name = event.target.value;
    i.setState(i.state);
  }

  handleCommunityTitleChange(i: CommunityForm, event: any) {
    i.state.communityForm.title = event.target.value;
    i.setState(i.state);
  }

  handleCommunityDescriptionChange(val: string) {
    this.state.communityForm.description = val;
    this.setState(this.state);
  }

  handleCommunityCategoryChange(i: CommunityForm, event: any) {
    i.state.communityForm.category_id = Number(event.target.value);
    i.setState(i.state);
  }

  handleCommunityNsfwChange(i: CommunityForm, event: any) {
    i.state.communityForm.nsfw = event.target.checked;
    i.setState(i.state);
  }

  handleCommunityReadOnlyChange(i: CommunityForm, event: any) {
    i.state.community_settings.read_only = event.target.checked;
    i.setState(i.state);
  }

  handleCommunityPrivateChange(i: CommunityForm, event: any) {
    i.state.community_settings.private = event.target.checked;
    i.setState(i.state);
  }

  handleCommunityPostLinksChange(i: CommunityForm, event: any) {
    i.state.community_settings.post_links = event.target.checked;
    i.setState(i.state);
  }

  handleCommunityCommentImagesChange(i: CommunityForm, event: any) {
    i.state.community_settings.comment_images = event.target.value;
    i.setState(i.state);
  }

  handleCancel(i: CommunityForm) {
    i.props.onCancel();
  }

  parseMessage(msg: WebSocketJsonResponse) {
    console.log(msg);
    let res = wsJsonToRes(msg);
    if (msg.error) {
      toast(i18n.t(msg.error), 'danger');
      this.state.loading = false;
      this.setState(this.state);
      return;
    } else if (res.op == UserOperation.ListCategories) {
      let data = res.data as ListCategoriesResponse;
      this.state.categories = data.categories;
      if (!this.props.community) {
        this.state.communityForm.category_id = data.categories[0].id;
      }
      this.setState(this.state);
    } else if (res.op == UserOperation.CreateCommunity) {
      let data = res.data as CommunityResponse;
      this.state.loading = false;
      this.props.onCreate(data.community);
    }
    // TODO is this necessary
    else if (res.op == UserOperation.EditCommunity) {
      let data = res.data as CommunityResponse;
      this.state.loading = false;
      this.props.onEdit(data.community);
    }
    // Community settings
    else if (res.op == UserOperation.GetCommunitySettings) {
      let data = res.data as CommunitySettingsResponse;
      this.state.community_settings = data;
      this.setState(this.state);
    } else if (res.op == UserOperation.EditCommunitySettings) {
      let data = res.data as CommunitySettingsResponse;
      this.state.community_settings = data;
      this.setState(this.state);
    }
  }
}
