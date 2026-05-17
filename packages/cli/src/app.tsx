import React from 'react';
import { Box, Text } from 'ink';
import { useAppState } from './state.js';
import { MainMenu } from './screens/main-menu.js';
import { ScaffoldScreen } from './screens/scaffold.js';
import { AuditScreen } from './screens/audit.js';
import { GeoScreen } from './screens/geo.js';
import { SettingsScreen } from './screens/settings.js';

const SCREENS: Record<string, React.ComponentType> = {
  'main-menu': MainMenu,
  scaffold: ScaffoldScreen,
  audit: AuditScreen,
  geo: GeoScreen,
  settings: SettingsScreen,
};

export function App() {
  const { screen } = useAppState();

  const Screen = SCREENS[screen] || MainMenu;
  return React.createElement(Screen);
}
