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
import { ZoneStateChangeEvent, ZoneState } from './panel-events';

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

for (let zoneNumber in config.panel.zones) {
    
    let zone = config.panel.zones[zoneNumber];

    zoneDelegates[zoneNumber] = {
        state: false,
        update: () => {}
    };

    // Depending on the zone type...
    switch (zone.type) {

        case ZoneType.Contact:
        
            let contactService = accessory.addService(new HAPNodeJS.Service.ContactSensor(zone.name, "contact-" + zoneIndex));
            contactService.getCharacteristic(HAPNodeJS.Characteristic.ContactSensorState)
                .on('set', (value, callback) => {
                    zoneDelegates[zoneNumber].state = value ? true : false;
                    callback();
                })
                .on('get', (callback) => {
                    callback(zoneDelegates[zoneNumber].state);
                });
            
            zoneDelegates[zoneNumber].update = (state: boolean) => {
                contactService.setCharacteristic(HAPNodeJS.Characteristic.ContactSensorState, zoneDelegates[zoneNumber].state);
            };

            break;

        case ZoneType.Motion:
        
            let motionService = accessory.addService(new HAPNodeJS.Service.MotionSensor(zone.name, "motion-" + zoneIndex));
            motionService
                .getCharacteristic(HAPNodeJS.Characteristic.MotionDetected)
                .on('set', (value, callback) => {
                    zoneDelegates[zoneNumber].state = value ? true : false;
                    callback();
                })
                .on('get', (callback) => {
                    callback(zoneDelegates[zoneNumber].state);
                });

            zoneDelegates[zoneNumber].update = (state: boolean) => {
                motionService.setCharacteristic(HAPNodeJS.Characteristic.MotionDetected, zoneDelegates[zoneNumber].state);
            };

            break;
        
    }

    zoneIndex ++;
}

// Publish the accessory
console.info('Publishing accessory', accessory.displayName);
accessory.publish({
    port: config.homekit.hap_start_port + zoneIndex,
    username: config.homekit.username,
    pincode: config.homekit.pincode,
    category: HAPNodeJS.Accessory.Categories.SENSOR
}, true);

// Output the HomeKit PIN
console.info(`Use HomeKit PIN: ${config.homekit.pincode}`);

// Create the panel
const panel = new Panel(config.panel);
panel.startObservation().subscribe(panelEvent => {
    
    // When zone change events occur, update the state cache
    if (panelEvent instanceof ZoneStateChangeEvent) {

        // Is the zone configured?
        if (config.panel.zones.hasOwnProperty(panelEvent.zone)) {

            console.info(
                `Zone ${panelEvent.zone} (${config.panel.zones[panelEvent.zone].name}) ` + 
                `is now ${panelEvent.newState} ${panelEvent.newState == ZoneState.Active ? 'ACTIVE' : 'SECURE'}`
            );

            zoneDelegates[panelEvent.zone].state = panelEvent.newState == ZoneState.Active;
            zoneDelegates[panelEvent.zone].update(panelEvent.newState == ZoneState.Active)
        }

    }

});