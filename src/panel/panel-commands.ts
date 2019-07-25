import { AreaState } from "./panel-events";

export enum SpecialKeypadKey {
    Yes = 'Y',
    No = 'N',
    Omit = 'O',
    Chime = 'C',
    Part = 'P', 
    Area = 'A',
    Reset = 'R',
    UpArrow = 'U',
    DownArrow = 'D',
    Menu = 'M',
    PanicAttack = 'H',
    Fire = 'F',
    Medical = '+'
}

/**
 * A command/instruction to a panel.
 */
export class PanelCommand {
}

/**
 * An indication that an area should change state.
 */
export class AreaStateChangeCommand extends PanelCommand {
    constructor (public area: number, public newState: AreaState) {
        super();
    }
}

export class KeyPressCommand extends PanelCommand {
    constructor (public key: string|SpecialKeypadKey) {
        super();
    }
}