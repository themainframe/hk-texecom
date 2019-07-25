import * as HAPNodeJS from 'hap-nodejs';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ZoneConfig, ZoneType } from '../config-file';
import { PanelEvent, ZoneStateChangeEvent, ZoneState } from '../panel/panel-events';

/**
 * Maps configured zones into HomeKit services
 */
export class HomekitZoneMapper {

    constructor (private accessory: HAPNodeJS.Accessory) {}

    // Defines the zone types and how they map to HomeKit data structures
    private zoneTypes = {
        [ZoneType.Contact]: {
            hapService: HAPNodeJS.Service.ContactSensor,
            hapCharacteristic: HAPNodeJS.Characteristic.ContactSensorState
        },
        [ZoneType.Motion]: {
            hapService: HAPNodeJS.Service.MotionSensor,
            hapCharacteristic: HAPNodeJS.Characteristic.MotionDetected
        }
    };

    // Keep track of the state of each mapped zone
    private zoneStates: {[key: number]: boolean} = {};

    /**
     * Perform the zone mapping.
     * 
     * @param panelEvents 
     * @param zones 
     */
    public map(panelEvents: Subject<PanelEvent>, zones: {[key: number]: ZoneConfig}) {

        // For each zone, create a HomeKit service on our accessory of the appropriate type
        // with an appropriate characteristic associated
        for (let zoneNumber in zones) {
            
            let zone = zones[zoneNumber];

            // Initialise the default state
            this.zoneStates[zoneNumber] = false;
       
            // Depending on the zone type...
            let hapService = this.accessory.addService(new (this.zoneTypes[zone.type].hapService)(zone.name, "zone-" + zoneNumber));
            hapService.getCharacteristic(this.zoneTypes[zone.type].hapCharacteristic)
                .on('get', (callback) => {
                    callback(this.zoneStates[zoneNumber]);
                });
            
            // Subscribe to panel events and watch for this zone changing
            panelEvents
                .pipe(
                    // Type guard so that further handling of the event is type-aware
                    filter((panelEvent: PanelEvent): panelEvent is ZoneStateChangeEvent => panelEvent instanceof ZoneStateChangeEvent),
                    // Must be for this zone
                    filter(zoneStateChangeEvent => zoneStateChangeEvent.zone == parseInt(zoneNumber))
                )
                .subscribe(panelEvent => {
                    hapService.setCharacteristic(this.zoneTypes[zone.type].hapCharacteristic, panelEvent.newState);
                    console.info(
                        `Zone ${panelEvent.zone} ` + 
                        `is now ${panelEvent.newState} ${panelEvent.newState == ZoneState.Active ? 'ACTIVE' : 'SECURE'}`
                    );
                });

        }


    }

}