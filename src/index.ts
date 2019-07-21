#!/usr/bin/env node

/**
 * texecom-homekit
 * Main file.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yaml';
import * as Bunyan from 'bunyan';
import * as HAPNodeJS from 'hap-nodejs';
import { ConfigFile } from './config-file';
import { Panel } from './panel';

// The config file to use
const CONFIG_FILE: string = 'config.yml';

// Parse the configuration file
let config: ConfigFile;

try {
    config = YAML.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    console.info('Loaded', Object.keys(config).length, 'configuration props from', CONFIG_FILE);
} catch (e) {
    console.error('Unable to parse configuration file', CONFIG_FILE, 'error:', e.message);
    process.exit();
}

// Create Homekit accessories for the specified zones
const zoneAccessories: HAPNodeJS.Accessory[] = [];

// Create the panel
const panel = new Panel(config.panel);
panel.startObservation().subscribe(panelEvent => {
    console.log(panelEvent);
});