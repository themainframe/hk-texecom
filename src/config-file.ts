
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
 * Configuration for a single area.
 */
export interface AreaConfig {
    name: string
}

/**
 * Panel configuration.
 */
export interface PanelConfig {

    connection: ConnectionConfig,
    code: string,

    // Zones to map
    zones: {
        [key: number]: ZoneConfig
    },

    areas?: {
        [key: number]: AreaConfig
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
