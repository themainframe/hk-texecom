
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
 * Panel configuration.
 */
export interface PanelConfig {

    connection: ConnectionConfig,

    // Zones to map
    zones: {
        [key: number]: {
            name: string,
            type: "contact" | "motion"
        }
    }

}

// Define the shape of the configuration file
export interface ConfigFile {
    panel: PanelConfig
}
