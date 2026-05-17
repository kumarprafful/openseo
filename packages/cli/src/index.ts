#!/usr/bin/env node
import { render } from 'ink';
import React from 'react';
import { App } from './app.js';

console.error(''); // blank line
console.error('  ╭──────────────────────────────────────╮');
console.error('  │  OpenSEO — SEO/GEO/AEO Engineering   │');
console.error('  │  v0.1.0                              │');
console.error('  ╰──────────────────────────────────────╯');
console.error('');

const { waitUntilExit } = render(React.createElement(App));
waitUntilExit();
