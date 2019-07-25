import { Subject } from 'rxjs';
import { PanelConfig } from "./config-file";
import { ProtocolInterface } from "./protocol/protocol";
import { CrestronProtocol } from "./protocol/crestron";
import { PanelEvent } from './panel/panel-events';
import { PanelCommand } from './panel/panel-commands';

const protocols = {
    crestron: CrestronProtocol
};

/**
 * A Premier Elite panel from which we may observe events.
 */
export class Panel {

    private protocol: ProtocolInterface;

    private commandSubject: Subject<PanelCommand>;

    constructor (private config: PanelConfig) {

        // Create protocol based on configuration
        if (!protocols.hasOwnProperty(config.connection.protocol)) {
            throw Error(`Unknown protocol ${config.connection.protocol} is unsupported. Supported: ${Object.keys(protocols).join(', ')}`);
        }

        this.protocol = new protocols[config.connection.protocol](config.connection);

        // Create a subject to which commands can be published
        this.commandSubject = new Subject<PanelCommand>();
    }

    /**
     * Send a command to this panel.
     * @param command 
     */
    public sendCommand(command: PanelCommand) {
        this.commandSubject.next(command);
    }

    /**
     * Start observing panel events.
     */
    public startObservation() : Subject<PanelEvent> {
        console.info(`Starting observation of panel events on ${this.config.connection.host}...`)
        return this.protocol.connect(this.commandSubject);
    }

    /**
     * Stop observing panel events.
     */
    public stopObservation() {
        console.info(`Stopping observation of panel events on ${this.config.connection.host}...`)
        this.protocol.disconnect();
    }

}