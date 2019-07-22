/**
 * The state of a zone on a Premier Elite panel.
 */
export enum ZoneState {
    Secure = 0,
    Active = 1,
    Tamper = 2
}

/**
 * The state of an area on a Premier Elite panel.
 */
export enum AreaState {
    Armed,
    Disarmed,
    Exit,
    Entry,
    Alarm
}

/**
 * A general event occurring on a Premier Elite panel.
 */
export class PanelEvent {
}

/**
 * An event indicating that an area changed state.
 */
export class AreaStateChangeEvent extends PanelEvent {
    constructor (public area: number, public newState: AreaState, public byUser: number) {
        super();
    }
}

/**
 * An event indicating that a zone changed state.
 */
export class ZoneStateChangeEvent extends PanelEvent {
    constructor (public zone: number, public newState: ZoneState) {
        super();
    }
}

/**
 * An event relating to a user.
 */
export class UserEvent extends PanelEvent {
    constructor (public user: number) {
        super();
    }
}

/**
 * A mechanism for a user login.
 */
export enum UserLoginMechanism {
    Code,
    Tag
}

/**
 * An event indicating that a user logged in.
 */
export class UserLoginEvent extends UserEvent {
    constructor (user: number, public using: UserLoginMechanism) {
        super(user);
    }
}
