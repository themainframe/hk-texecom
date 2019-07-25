import * as HAPNodeJS from 'hap-nodejs';
import { filter } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { PanelEvent, AreaStateChangeEvent, AreaState } from '../panel/panel-events';
import { AreaConfig } from '../config-file';

/**
 * These aren't exported by HAP-NodeJS so we'll sorta redefine them here I guess...
 */

// The current (read) state from the panel
enum SecuritySystemCurrentState {
    StayArm = 0,
    AwayArm = 1,
    NightArm = 2,
    Disarmed = 3,
    AlarmTriggered = 4
}
 
// The desired (written) state for the panel
enum SecuritySystemTargetState {
    StayArm = 0,
    AwayArm = 1,
    NightArm = 1,
    Disarm = 1
}

/**
 * Maps the overall system state into a  HomeKit services
 */
export class HomekitSystemMapper {

    constructor (private accessory: HAPNodeJS.Accessory) {}

    // The current state of the HomeKit security system
    private currentState: SecuritySystemCurrentState = SecuritySystemCurrentState.Disarmed;

    // The target state of the HomeKit security system
    private targetState: SecuritySystemTargetState = SecuritySystemTargetState.Disarm;

    // The mapping between Texecom Area States and HomeKit Security System Current States
    private areaCurrentStateMapping = {
        [AreaState.Armed]: SecuritySystemCurrentState.AwayArm,
        [AreaState.Disarmed]: SecuritySystemCurrentState.Disarmed,
        [AreaState.Alarm]: SecuritySystemCurrentState.AlarmTriggered
    };

    // The mapping between Texecom Area States and HomeKit Security System Current States
    private areaTargetStateMapping = {
        [AreaState.Armed]: SecuritySystemTargetState.AwayArm,
        [AreaState.Disarmed]: SecuritySystemTargetState.Disarm
    };

    /**
     * Perform mapping.
     * 
     * @param panelEvents 
     */
    public map(panelEvents: Subject<PanelEvent>, areas: {[key: number]: AreaConfig}) {

        // For each zone, create a HomeKit service on our accessory of the appropriate type
        // with an appropriate characteristic associated
        for (let areaNumber in areas) {
                
            let area = areas[areaNumber];
            
            // Create a Security System service for this area
            let hapService = this.accessory.addService(new HAPNodeJS.Service.SecuritySystem(area.name, "area-" + areaNumber));
            
            hapService
                .getCharacteristic(HAPNodeJS.Characteristic.SecuritySystemCurrentState)
                .on('get', callback => {
                    console.log('Sys: Current state requested, is', this.currentState);
                    callback(null, this.currentState);
                });

            this.accessory.getService(HAPNodeJS.Service.SecuritySystem)
                .getCharacteristic(HAPNodeJS.Characteristic.SecuritySystemTargetState)
                .on('set', (value, callback) => {
                    // Target state has been set in HomeKit
                    console.log('Sys: Target state set to', value);

                    // Emit an area change
                    

                    callback();
                });

            // Subscribe to panel events that relate to system state changes for this area
            panelEvents
                .pipe(

                    // Type guard so that further handling of the event is type-aware
                    filter((panelEvent: PanelEvent): panelEvent is AreaStateChangeEvent => panelEvent instanceof AreaStateChangeEvent),
                    
                    // Must be for this area
                    filter(areaStateChangeEvent => areaStateChangeEvent.area == parseInt(areaNumber))
            
                )
                .subscribe(areaStateChangeEvent => {
                    
                    // Use a mapping to set the HomeKit state from the Texecom panel state
                    if (this.areaCurrentStateMapping.hasOwnProperty(areaStateChangeEvent.newState)) {
                        hapService.setCharacteristic(
                            HAPNodeJS.Characteristic.SecuritySystemCurrentState, 
                            this.areaCurrentStateMapping[areaStateChangeEvent.newState]
                        );
                    }
                    
                    if (this.areaTargetStateMapping.hasOwnProperty(areaStateChangeEvent.newState)) {
                        hapService.setCharacteristic(
                            HAPNodeJS.Characteristic.SecuritySystemTargetState, 
                            this.areaTargetStateMapping[areaStateChangeEvent.newState]
                        );
                    }
                
                    console.info(
                        `Area ${areaStateChangeEvent.area} is now ${areaStateChangeEvent.newState}`
                    );
                });
        }
    }

}