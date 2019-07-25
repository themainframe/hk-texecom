import { Subject } from "rxjs";
import { PanelEvent } from "../panel/panel-events";
import { PanelCommand } from '../panel/panel-commands';

/**
 * Defines an interface for a comms protocol supported by the Premier Elite panel.
 * 
 * Implementations must transparently provide async events even if the underlying protocol
 * does not support them (for example, by polling for changes).
 */
export interface ProtocolInterface {

    /**
     * Connect & Disconnect.
     */
    connect(commandSubject: Subject<PanelCommand>): Subject<PanelEvent>;
    disconnect(): void;
}