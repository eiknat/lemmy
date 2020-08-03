import React, { Component } from 'react';
import { WebSocketService } from '../services';
import { i18n } from '../i18next';
import { Trans } from 'react-i18next';
import { repoUrl } from '../utils';
import { BASE_PATH } from "../isProduction";

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
      <div className="about-container">
        <div className="about-header">
          <img
            src={`${BASE_PATH}banner.png`}
            className="img-fluid"
            alt="bear with black text reading 'you have nothing to lose but your chains'"
          />
        </div>
        <div className="my-4">
          <div className="about-body">
            <p>
              The Chapo Cooperative is a collective of leftist software
              developers building an independent space for solidarity and true
              democratization on the internet.
            </p>
            <p>
              We believe in unrestrained criticism of power and limitless
              compassion for vulnerable populations. We believe the people who
              do the work should own the results of their labor. We believe that
              there is a better way.
            </p>
            <p>
              Since the beginning there have always been two types of people
              online: posters and mods.
            </p>
            <p>
              In the earlier days of the internet, this hierarchy existed on
              message boards in small, insular groups of people. Even though
              mods had power, they were still members of their communities and
              had a vested interest in their overall well-being.
            </p>
            <p>
              But with the rise of enormous monopolistic platforms like Facebook
              and Twitter, moderators and admins have become agents of
              corporations. They are heavily incentivized to only make decisions
              based on profitability and keeping their advertisers happy,
              regardless of whether it is the right thing for their actual
              products.
            </p>
            <p>
              Our goal is not to turn a profit, because profit is just unpaid
              wages. Our goal is to demonstrate that community-funded and
              worker-owned technology can scale and maintain itself. We intend
              to create a community that isn&apos;t powered by selling ourselves
              and our community to advertisers.
            </p>
            <p>
              We are Chapo Cooperative and we&apos;re here to show these venture
              capitalist vultures what actual disruption of a stale and tired
              industry looks like.
            </p>
            <p>
              PS: John Brown did nothing wrong. We can say that all we want now
              that we&apos;re independent.{' '}
            </p>

            <div className="my-4">
              <img
                src={`${BASE_PATH}last-comment.png`}
                alt="the last comment before the r/chapotraphouse subreddit was shut down"
                className="img-fluid"
              />
              <small>
                The last comment on the r/chapotraphouse subreddit before it was
                shut down.
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
