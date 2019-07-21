import { Subject } from 'rxjs';
import { PanelConfig } from "./config-file";
import { ProtocolInterface } from "./protocol/protocol";
import { CrestronProtocol } from "./protocol/crestron";
import { PanelEvent } from './panel-events';

const protocols = {
    crestron: CrestronProtocol
};

/**
 * A Premier Elite panel from which we may observe events.
 */
export class Panel {

    private protocol: ProtocolInterface;

    constructor (private config: PanelConfig) {

        // Create protocol based on configuration
        if (!protocols.hasOwnProperty(config.connection.protocol)) {
            throw Error(`Unknown protocol ${config.connection.protocol} is unsupported. Supported: ${Object.keys(protocols).join(', ')}`);
        }

        this.protocol = new protocols[config.connection.protocol](config.connection);
    }

    /**
     * Start observing panel events.
     */
    public startObservation() : Subject<PanelEvent> {
        console.info(`Starting observation of panel events on ${this.config.connection.host}...`)
        return this.protocol.connect();
    }

    public stopObservation() {
        console.info(`Stopping observation of panel events on ${this.config.connection.host}...`)
        this.protocol.disconnect();
    }

}