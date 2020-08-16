import React, { useState } from 'react';
import {
  Box,
  Label,
  Input,
  Select,
  Textarea,
  Radio,
  Flex,
  Checkbox,
  Slider,
  Heading,
  Spinner,
  Badge,
  Alert,
} from 'theme-ui';
import Button from '../components/elements/Button';
import { ThemeSystemProvider } from '../components/ThemeSystemProvider';
import { ThemeSelector } from '../theme';
// import { Button } from '@storybook/react/demo';

export default { title: 'Themes' };

function Form() {
  return (
    <Box as="form" onSubmit={e => e.preventDefault()}>
      <Label htmlFor="username">Username</Label>
      <Input name="username" id="username" mb={3} />
      <Box>
        <Label mb={3}>
          <Checkbox />
          Remember me
        </Label>
      </Box>
      <Label htmlFor="comment">Comment</Label>
      <Textarea name="comment" id="comment" rows="6" mb={3} />
      <Flex mb={3}>
        <Label>
          <Radio name="letter" /> Alpha
        </Label>
        <Label>
          <Radio name="letter" /> Bravo
        </Label>
        <Label>
          <Radio name="letter" /> Charlie
        </Label>
      </Flex>
      <Label>Slider</Label>
      <Slider mb={3} />
      <Button variant="primary">Submit</Button>
      <Button variant="secondary">Cancel</Button>
    </Box>
  );
}

const Badges = () => (
  <Box my={3}>
    <Heading>Badges</Heading>
    <Badge mr={2}>Badge 1</Badge>
    <Badge variant="outline">Badge 2</Badge>
  </Box>
);

const Alerts = () => (
  <Box my={3}>
    <Heading>Alerts</Heading>
    <Alert variant="primary" mb={2}>
      Primary
    </Alert>
    <Alert variant="secondary" mb={2}>
      Secondary
    </Alert>
    <Alert variant="muted" mb={2}>
      Muted
    </Alert>
  </Box>
);

export const Basic = () => {
  const [theme, setTheme] = useState('chapo');

  return (
    <ThemeSystemProvider>
      <Box m={4} css={{ maxWidth: '700px' }}>
        <Box mb={2}>
          <Label>Theme</Label>
          <ThemeSelector
            value={theme}
            onChange={newTheme => setTheme(newTheme)}
          />
        </Box>
        <Form />
        <Box my={3}>
          <Spinner />
          <Badges />
          <Alerts />
        </Box>
      </Box>
    </ThemeSystemProvider>
  );
};
