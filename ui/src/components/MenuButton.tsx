import React from 'react';

import {
  Menu as ReachMenu,
  MenuList as ReachMenuList,
  MenuButton as ReachMenuButton,
  MenuItem as ReachMenuItem,
  MenuItems as ReachMenuItems,
  MenuPopover as ReachMenuPopover,
  MenuLink as ReachMenuLink,
} from "@reach/menu-button";
import "@reach/menu-button/styles.css";
import { Box, Button, Flex } from 'theme-ui';

export const Menu = props => <Box as={ReachMenu} {...props} />
export const MenuButton = props => <Button as={ReachMenuButton} {...props} />
export const MenuList = props => <Box bg="muted" css={{ borderRadius: '4px' }} color="text" mt={1} py={2} as={ReachMenuList} {...props} />

export const MenuItem = props => <Flex px={3} css={{ alignItems: 'center' }} as={ReachMenuItem} {...props} />