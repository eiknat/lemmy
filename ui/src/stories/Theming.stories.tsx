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
import { ThemeSelector } from '../theme';
// import { Button } from '@storybook/react/demo';


export default { title: 'Themes' };

function Form() {
  return (
    <Box
  as='form'
  onSubmit={e => e.preventDefault()}>
  <Label htmlFor='username'>Username</Label>
  <Input
    name='username'
    id='username'
    mb={3}
  />
  <Label htmlFor='password'>Password</Label>
  <Input
    type='password'
    name='password'
    id='password'
    mb={3}
  />
  <Box>
    <Label mb={3}>
      <Checkbox />
      Remember me
    </Label>
  </Box>
  <Label htmlFor='sound'>Sound</Label>
  <Select name='sound' id='sound' mb={3}>
    <option>Beep</option>
    <option>Boop</option>
    <option>Blip</option>
  </Select>
  <Label htmlFor='comment'>Comment</Label>
  <Textarea
    name='comment'
    id='comment'
    rows='6'
    mb={3}
  />
  <Flex mb={3}>
    <Label>
      <Radio name='letter' /> Alpha
    </Label>
    <Label>
      <Radio name='letter' /> Bravo
    </Label>
    <Label>
      <Radio name='letter' /> Charlie
    </Label>
  </Flex>
  <Label>
    Slider
  </Label>
  <Slider mb={3} />
  <Button variant="primary">
        Submit
  </Button>
  <Button variant='secondary'>
    Cancel
  </Button>
</Box>
  )
}

export const Basic = () => {
  const [theme, setTheme] = useState('chapo');

  return (
    <ThemeSystemProvider>
      <Box m={4}>
        <Box mb={2}>
          <ThemeSelector value={theme} onChange={newTheme => setTheme(newTheme)} />
        </Box>
        <Form />
      </Box>
    </ThemeSystemProvider>
  )
};