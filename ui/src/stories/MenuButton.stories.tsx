import React from 'react';
import {
  // Menu,
  // MenuList,
  // MenuButton,
  // MenuItem,
  MenuItems,
  MenuPopover,
  MenuLink
} from "@reach/menu-button";
import "@reach/menu-button/styles.css";
import { Menu, MenuButton, MenuItem, MenuList } from '../components/MenuButton';
import { ThemeSystemProvider } from '../components/ThemeSystemProvider';
import { Icon } from '../components/icon';

export default { title: 'MenuButton' };

export const Basic = () => (
  <ThemeSystemProvider>
    <Menu>
      <MenuButton>Actions</MenuButton>
      <MenuList>
        <MenuItem><Icon name="report" /> Report</MenuItem>
        <MenuLink to="view">View</MenuLink>
      </MenuList>
    </Menu>
  </ThemeSystemProvider>
)