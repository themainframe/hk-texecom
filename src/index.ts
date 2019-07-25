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
import * as storage from 'node-persist'
import { ConfigFile, ZoneType } from './config-file';
import { Panel } from './panel';
import { ZoneStateChangeEvent, ZoneState } from './panel/panel-events';
import { HomekitZoneMapper } from './homekit/homekit-zones';
import { HomekitSystemMapper } from './homekit/homekit-areas';

// Initialise storage
storage.initSync();

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
const zoneDelegates: { [key: number]: {
    state: boolean,
    update: (boolean) => void
} } = {};
let zoneIndex = 0;

// Create an accessory
let accessory = new HAPNodeJS.Accessory(config.homekit.name, HAPNodeJS.uuid.generate(config.homekit.uuid + ':' + zoneIndex));
accessory.on('identify', (paired, callback) => {
    callback();
});

// Add the accessory information service
accessory.getService(HAPNodeJS.Service.AccessoryInformation)
    .setCharacteristic(HAPNodeJS.Characteristic.Manufacturer, config.homekit.manufacturer)
    .setCharacteristic(HAPNodeJS.Characteristic.Model, config.homekit.model)
    .setCharacteristic(HAPNodeJS.Characteristic.SerialNumber, config.homekit.serial);

// Output the HomeKit PIN
console.info(`** Use HomeKit PIN: ${config.homekit.pincode} **`);

// Create the panel
const panel = new Panel(config.panel);
const panelEventSubject = panel.startObservation();

// Map zones as HomeKit sensors
const zoneMapper = new HomekitZoneMapper(accessory);
zoneMapper.map(panelEventSubject, config.panel.zones);

// Map areas as HomeKit security systems
if (config.panel.hasOwnProperty('areas') && config.panel.areas) {
    const areaMapper = new HomekitSystemMapper(accessory);
    areaMapper.map(panelEventSubject, config.panel.areas);
}

// Publish the accessory
console.info('Publishing accessory', accessory.displayName);
accessory.publish({
    port: config.homekit.hap_start_port + zoneIndex,
    username: config.homekit.username,
    pincode: config.homekit.pincode,
    category: HAPNodeJS.Accessory.Categories.SENSOR
}, true);
