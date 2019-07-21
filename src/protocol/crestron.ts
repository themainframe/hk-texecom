import * as fs from 'fs';
import * as net from 'net';
import { ProtocolInterface } from './protocol';
import { ConnectionConfig } from '../config-file';
import { Subject } from 'rxjs';
import { PanelEvent, ZoneStateChangeEvent, AreaStateChangeEvent, AreaState, UserLoginEvent, UserLoginMechanism } from '../panel-events';

/**
 * Driver for receiving panel events via Crestron protocol over the network.
 */
export class CrestronProtocol implements ProtocolInterface {

    private client: net.Socket;
    public panelObservable: Subject<PanelEvent>;

    constructor (private config: ConnectionConfig) {}

    /**
     * Connect and start listening for events
     */
    public connect() : Subject<PanelEvent> {
        this.panelObservable = new Subject<PanelEvent>();
        this.client = new net.Socket();
        this.client.connect({
            host: this.config.host,
            port: this.config.port
        });
        this.client.on('data', (data: Buffer) => {
            this.onData(data);
        });
        return this.panelObservable;
    }

    /**
     * Disconnect.
     */
    public disconnect() {
        this.client.end();
    }

    /**
     * Data arrived from the panel.
     * @param data
     */
    private onData(data: Buffer) {

        // Parse the received buffer and translate it into an appropriate PanelEvent
        const decodedBuffer = data.toString('utf8');
        
        // Must begin with the Crestron start character
        if (decodedBuffer.length < 2) {
            console.debug(`Discarded short Crestron message ${decodedBuffer}`);
            return;
        }

        if (decodedBuffer[0] != '"') {
            console.debug(`Discarded invalid-start Crestron message ${decodedBuffer}`);
            return;
        }

        // Switch on the second character which indicates the message type
        switch (decodedBuffer[1]) {

            case 'Z':

                // Zone state change
                this.panelObservable.next(new ZoneStateChangeEvent(
                    parseInt(decodedBuffer.substr(2, 3)),
                    parseInt(decodedBuffer[5])
                ));
                break;

            case 'U':
            case 'T':

                // User login
                let userLoginInfo = decodedBuffer.match(/"([UT])([0-9]{3})0/);
                if (!userLoginInfo) {
                    console.debug(`Discarded invalid Crestron user login message ${decodedBuffer}`);
                    return;
                }

                this.panelObservable.next(new UserLoginEvent(
                    parseInt(userLoginInfo[2]),
                    userLoginInfo[1] == 'T' ? UserLoginMechanism.Tag : UserLoginMechanism.Code
                ));

                break;

            case 'A':
            case 'D':
            case 'X':
            case 'E':
            case 'L':

                // Area state change
                let stateChangeInfo = decodedBuffer.match(/"([ADXEL])([0-9]{3})([0-9]+)/);
                this.panelObservable.next(new AreaStateChangeEvent(
                    parseInt(stateChangeInfo[2]),
                    {
                        'A': AreaState.Armed,
                        'D': AreaState.Disarmed,
                        'E': AreaState.Entry,
                        'X': AreaState.Exit,
                        'L': AreaState.Alarm
                    }[stateChangeInfo[1]],
                    stateChangeInfo[3] ? parseInt(stateChangeInfo[3]) : null
                ));

                break;

            default:
                // Unsupported
                console.debug(`Received unsupported Crestron message ${decodedBuffer}`);
                break;

        }
        

        // this.panelObservable.next();
    }

}