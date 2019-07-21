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
const zoneAccessories: { [key: number]: HAPNodeJS.Accessory } = {};
const zoneStateCache: { [key: number]: boolean } = {};
let zoneIndex = 0;

for (let zoneNumber in config.panel.zones) {
    
    let zone = config.panel.zones[zoneNumber];

    // Create an accessory
    let accessory = new HAPNodeJS.Accessory(zone.name, HAPNodeJS.uuid.generate(config.homekit.uuid + ':' + zoneIndex));
    accessory.on('identify', (paired, callback) => {
        callback();
    });

    // Add the accessory information service
    accessory.getService(HAPNodeJS.Service.AccessoryInformation)
        .setCharacteristic(HAPNodeJS.Characteristic.Manufacturer, config.homekit.manufacturer)
        .setCharacteristic(HAPNodeJS.Characteristic.Model, config.homekit.model)
        .setCharacteristic(HAPNodeJS.Characteristic.SerialNumber, config.homekit.serial);

    // Depending on the zone type...
    switch (zone.type) {

        case ZoneType.Contact:
        
            accessory.addService(HAPNodeJS.Service.ContactSensor)
                .getCharacteristic(HAPNodeJS.Characteristic.ContactSensorState)
                .on('set', (value, callback) => {
                    zoneStateCache[zoneNumber] = value ? true : false;
                    callback();
                })
                .on('get', (callback) => {
                    callback(zoneStateCache[zoneNumber]);
                });

            break;

        case ZoneType.Motion:
        
            accessory.addService(HAPNodeJS.Service.MotionSensor)
                .getCharacteristic(HAPNodeJS.Characteristic.MotionDetected)
                .on('set', (value, callback) => {
                    zoneStateCache[zoneNumber] = value ? true : false;
                    callback();
                })
                .on('get', (callback) => {
                    callback(zoneStateCache[zoneNumber]);
                });

            break;
        
    }

    // Add the accessory
    zoneAccessories[zoneNumber] = accessory;

    // Add a state cache entry
    zoneStateCache[zoneNumber] = false;

    accessory.username = config.homekit.username;
    accessory.pincode = config.homekit.pincode;

    // Publish the accessory
    accessory.publish({
        port: config.homekit.hap_start_port + zoneIndex,
        username: config.homekit.username,
        pincode: config.homekit.pincode,
        category: HAPNodeJS.Accessory.Categories.SENSOR
    }, true);

    console.info('Publishing accessory', accessory.displayName);
    zoneIndex ++;
}

// Output the HomeKit PIN
console.info(`Use HomeKit PIN: ${config.homekit.pincode}`);

// Create the panel
const panel = new Panel(config.panel);
panel.startObservation().subscribe(panelEvent => {
    console.log(panelEvent);
});