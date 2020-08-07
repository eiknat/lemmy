import React, { Component } from 'react';
import { Prompt } from 'react-router-dom';
import isEqual from 'lodash.isequal'
import { MarkdownTextArea } from './markdown-textarea';
import { Site, SiteForm as SiteFormI } from '../interfaces';
import { WebSocketService } from '../services';
import { capitalizeFirstLetter, randomStr } from '../utils';
import { i18n } from '../i18next';

interface SiteFormProps {
  site?: Site; // If a site is given, that means this is an edit
  onCancel?(): any;
}

interface SiteFormState {
  siteForm: SiteFormI;
  loading: boolean;
}

export class SiteForm extends Component<SiteFormProps, SiteFormState> {
  private id = `site-form-${randomStr()}`;
  private emptyState: SiteFormState = {
    siteForm: {
      name: null,
      enable_downvotes: true,
      enable_create_communities: true,
      open_registration: true,
      enable_nsfw: true,
    },
    loading: false,
  };

  state = this.emptyState;

  componentDidMount() {
    if (this.props.site) {
      this.setState({
        siteForm: {
          name: this.props.site.name,
          description: this.props.site.description,
          enable_downvotes: this.props.site.enable_downvotes,
          enable_create_communities: this.props.site.enable_create_communities,
          open_registration: this.props.site.open_registration,
          enable_nsfw: this.props.site.enable_nsfw,
        },
        loading: false
      });
    }
  }

  // Necessary to stop the loading
  // UNSAFE_componentWillReceiveProps() {
  //   this.setState({
  //     loading: false
  //   });
  // }

  componentDidUpdate(prevProps) {
    // console.log({ prevProps, props: this.props });
    // console.log(JSON.stringify(prevProps) === JSON.stringify(this.props));
    if (
      !this.state.loading &&
      !this.props.site &&
      (this.state.siteForm.name || this.state.siteForm.description)
    ) {
      window.onbeforeunload = () => true;
    } else {
      window.onbeforeunload = undefined;
    }

    if (!isEqual(prevProps, this.props)) {
      console.log('NOT EQUAL')
      this.setState({ loading: false })
    }
  }

  componentWillUnmount() {
    window.onbeforeunload = null;
  }

  render() {
    return (
      <>
        <Prompt
          when={
            !this.state.loading &&
            !this.props.site &&
            (!!this.state.siteForm.name || !!this.state.siteForm.description)
          }
          message={i18n.t('block_leaving')}
        />
        <form onSubmit={this.handleCreateSiteSubmit}>
          <h5>{`${
            this.props.site
              ? capitalizeFirstLetter(i18n.t('save'))
              : capitalizeFirstLetter(i18n.t('name'))
          } ${i18n.t('your_site')}`}</h5>
          <div className="form-group row">
            <label className="col-12 col-form-label" htmlFor="create-site-name">
              {i18n.t('name')}
            </label>
            <div className="col-12">
              <input
                type="text"
                id="create-site-name"
                className="form-control"
                value={this.state.siteForm.name}
                onChange={this.handleSiteNameChange}
                required
                minLength={3}
                maxLength={20}
              />
            </div>
          </div>
          <div className="form-group row">
            <label className="col-12 col-form-label" htmlFor={this.id}>
              {i18n.t('sidebar')}
            </label>
            <div className="col-12">
              <MarkdownTextArea
                initialContent={this.state.siteForm.description}
                onContentChange={this.handleSiteDescriptionChange}
              />
            </div>
          </div>
          <div className="form-group row">
            <div className="col-12">
              <div className="form-check">
                <input
                  className="form-check-input"
                  id="create-site-downvotes"
                  type="checkbox"
                  checked={this.state.siteForm.enable_downvotes}
                  onChange={this.handleSiteEnableDownvotesChange}
                />
                <label
                  className="form-check-label"
                  htmlFor="create-site-downvotes"
                >
                  {i18n.t('enable_downvotes')}
                </label>
              </div>
            </div>
          </div>
          <div className="form-group row">
            <div className="col-12">
              <div className="form-check">
                <input
                  className="form-check-input"
                  id="create-site-enable-nsfw"
                  type="checkbox"
                  checked={this.state.siteForm.enable_nsfw}
                  onChange={this.handleSiteEnableNsfwChange}
                />
                <label
                  className="form-check-label"
                  htmlFor="create-site-enable-nsfw"
                >
                  {i18n.t('enable_nsfw')}
                </label>
              </div>
            </div>
          </div>
          <div className="form-group row">
            <div className="col-12">
              <div className="form-check">
                <input
                  className="form-check-input"
                  id="create-site-open-registration"
                  type="checkbox"
                  checked={this.state.siteForm.open_registration}
                  onChange={this.handleSiteOpenRegistrationChange}
                />
                <label
                  className="form-check-label"
                  htmlFor="create-site-open-registration"
                >
                  {i18n.t('open_registration')}
                </label>
              </div>
            </div>
          </div>
          <div className="form-group row">
            <div className="col-12">
              <div className="form-check">
                <input
                  className="form-check-input"
                  id="create-site-create-communities"
                  type="checkbox"
                  checked={this.state.siteForm.enable_create_communities}
                  onChange={this.handleSiteEnableCreateCommunitiesChange}
                />
                <label
                  className="form-check-label"
                  htmlFor="create-site-create-communities"
                >
                  {i18n.t('enable_create_communities')}
                </label>
              </div>
            </div>
          </div>
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
                ) : this.props.site ? (
                  capitalizeFirstLetter(i18n.t('save'))
                ) : (
                  capitalizeFirstLetter(i18n.t('create'))
                )}
              </button>
              {this.props.site && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={this.handleCancel}
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

  handleCreateSiteSubmit = (event: any) => {
    this.setState({
      loading: true
    });
    if (this.props.site) {
      WebSocketService.Instance.editSite(this.state.siteForm);
    } else {
      WebSocketService.Instance.createSite(this.state.siteForm);
    }
  }

  handleSiteNameChange = (event: any) => {
    this.setState({
      siteForm: {
        ...this.state.siteForm,
        name: event.target.value
      }
    });
  }

  handleSiteDescriptionChange = (key: any) => {
    console.log('event', event);
    this.setState({
      siteForm: {
        ...this.state.siteForm,
        description: key
      }
    });
  }

  handleSiteEnableNsfwChange = (event: any) => {
    this.setState({
      siteForm: {
        ...this.state.siteForm,
        enable_nsfw: event.target.checked
      }
    });
  }

  handleSiteOpenRegistrationChange = (event: any) => {
    this.setState({
      siteForm: {
        ...this.state.siteForm,
        open_registration: event.target.checked
      }
    });
  }

  handleSiteEnableDownvotesChange = (event: any) => {
    this.setState({
      siteForm: {
        ...this.state.siteForm,
        enable_downvotes: event.target.checked
      }
    });
  }

  handleSiteEnableCreateCommunitiesChange = (event: any) => {
    this.setState({
      siteForm: {
        ...this.state.siteForm,
        enable_create_communities: event.target.checked
      }
    });
  }

  handleCancel = () => {
    this.props.onCancel();
  }
}
