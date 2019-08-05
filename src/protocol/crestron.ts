import * as fs from 'fs';
import * as net from 'net';
import { ProtocolInterface } from './protocol';
import { ConnectionConfig } from '../config-file';
import { Subject, Subscription, noop } from 'rxjs';
import { PanelEvent, ZoneStateChangeEvent, AreaStateChangeEvent, AreaState, UserLoginEvent, UserLoginMechanism } from '../panel/panel-events';
import { PanelCommand } from '../panel/panel-commands';

/**
 * Driver for receiving panel events via Crestron protocol over the network.
 */
export class CrestronProtocol implements ProtocolInterface {

    // The socket connected to the panel
    private client: net.Socket;

    // Timeout on which to retry connectivity if connection is lost (Wi-Fi dropouts, etc...)
    private retryConnectionTimeout: NodeJS.Timeout;

    // Stream of commands to execute on the panel
    private commandSubscriber: Subscription;

    // Stream of events reported by the panel
    public panelObservable: Subject<PanelEvent>;

    constructor (private config: ConnectionConfig) {}

    /**
     * Connect and start listening for events
     */
    public connect(commandSubject: Subject<PanelCommand>) : Subject<PanelEvent> {

        this.panelObservable = new Subject<PanelEvent>();

        // Connect to the panel via TCP
        this.client = new net.Socket();

        // Subscribe to data events
        this.client.on('data', (data: Buffer) => {
            this.onData(data);
        });

        // Keep the socket alive
        this.client.setKeepAlive(true, 5000);
        this.client.setTimeout(5000);

        // Connect the socket
        const connect = () => {
            console.debug(`(Re)connecting socket to ${this.config.host}:${this.config.port}...`);
            this.client.connect({
                host: this.config.host,
                port: this.config.port
            });
        };

        // On closure, schedule a reconnect
        this.client.on('close', () => {
            console.error(`Socket was closed - scheduling reconnect...`);
            this.retryConnectionTimeout = setTimeout(connect, 5000);
        });

        // Do nothing on error
        this.client.on('error', (error) => {
            console.error(`Socket error: ${error}`);
        });

        this.client.on('connect', () => {
            console.debug(`Connected to panel`);
        });

        // Connect now, and then periodically retry if we become disconnected
        connect();

        // TODO: Observe commandSubject and react to commands issued
        // TODO: This might end up being only used for other protocols (I.e. Connect)

        return this.panelObservable;
    }

    /**
     * Disconnect.
     */
    public disconnect() {

        // Unsubscribe from commands
        this.commandSubscriber.unsubscribe();

        // Stop retrying connections
        clearTimeout(this.retryConnectionTimeout);

        // Disconnect
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