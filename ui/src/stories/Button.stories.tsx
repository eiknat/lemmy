import React, { useState } from 'react';
import { Box,  Label,
  Input,
  Select,
  Textarea,
  Radio,
  Flex,
  Checkbox,
  Slider, } from 'theme-ui';
import Button from '../components/elements/Button';
import { ThemeSystemProvider } from '../components/ThemeSystemProvider';
import { themes } from '../theme';

export default { title: 'Buttons' };

export const Basic = () => {
  return (
    <div>
      {Object.keys(themes).map(theme => {
        return (
          <ThemeSystemProvider key={theme} initialTheme={theme}>
            <Box bg="background" p={2}>
              <Button mx={1}>Primary</Button>
              <Button variant="secondary" mx={1}>Secondary</Button>
              <Button variant="highlight" mx={1}>Highlight</Button>
              <Button variant="muted" mx={1}>Muted</Button>
              <Button disabled mx={1}>Disabled</Button>
              <Button variant="danger" mx={1}>Danger</Button>
              <Button variant="outline" mx={1}>Outline</Button>
            </Box>
          </ThemeSystemProvider>
        )
      })}
    </div>
  )
}