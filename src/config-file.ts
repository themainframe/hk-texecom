
/**
 * Panel connection configuration.
 */
export interface ConnectionConfig {

    // Supported Protocols
    protocol: "crestron" | "simple" | "connect",

    // Host & Port
    host: string,
    port: number

}

/**
 * Supported types of detection zones.
 */
export enum ZoneType {
    Contact = "contact",
    Motion = "motion"
}

/**
 * Configuration for a single zone.
 */
export interface ZoneConfig {
    name: string,
    type: ZoneType
}

/**
 * Panel configuration.
 */
export interface PanelConfig {

    connection: ConnectionConfig,

    // Zones to map
    zones: {
        [key: number]: ZoneConfig
    }

}

/**
 * HomeKit configuration.
 */
export interface HomeKitConfig {

    hap_start_port: number,
    uuid: string,
    name: string,
    manufacturer: string,
    model: string,
    serial: string,
    username: string,
    pincode: string

}

// Define the shape of the configuration file
export interface ConfigFile {
    homekit: HomeKitConfig,
    panel: PanelConfig
}
