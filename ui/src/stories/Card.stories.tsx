import React, { useState } from 'react';
import { Box, Heading } from 'theme-ui';
import Card from '../components/elements/Card';
import { ThemeSystemProvider } from '../components/ThemeSystemProvider';
import { ThemeSelector } from '../theme';

export default {
  title: 'Card',
};

export const Basic = () => {
  const [theme, setTheme] = useState('chapo');

  return (
    <ThemeSystemProvider>
      <Box m={4}>
        <ThemeSelector
          value={theme}
          onChange={newTheme => setTheme(newTheme)}
        />
      </Box>
      <Box m={4}>
        <Card>
          <div className="card-body">
            <Heading as="h4">
              Trending{' '}
              <a className="text-body" href="/communities">
                communities
              </a>
            </Heading>
            <ul className="list-inline">
              <li className="list-inline-item">
                <a href="/c/nullcom">nullcom</a>
              </li>
              <li className="list-inline-item">
                <a href="/c/chapotraphouse">chapotraphouse</a>
              </li>
              <li className="list-inline-item">
                <a href="/c/mls">mls</a>
              </li>
              <li className="list-inline-item">
                <a href="/c/readonly_test">readonly_test</a>
              </li>
              <li className="list-inline-item">
                <a href="/c/dad">dad</a>
              </li>
            </ul>
          </div>
          <div>
            <h5>
              Subscribed to{' '}
              <a className="text-body" href="/communities">
                communities
              </a>
            </h5>
            <ul className="list-inline">
              <li className="list-inline-item">
                <a href="/c/bug_reports">bug_reports</a>
              </li>
              <li className="list-inline-item">
                <a href="/c/tacobell">tacobell</a>
              </li>
            </ul>
          </div>
          <div className="css-4cffwv">
            <a className="css-18q9lsw" href="/create_community">
              Create a Community
            </a>
          </div>
        </Card>
      </Box>
    </ThemeSystemProvider>
  );
};
