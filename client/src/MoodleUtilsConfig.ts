import { MonkeyConfig } from "ExternalTypes";

export default class MoodleUtilsConfig {
    #config: MonkeyConfig

    constructor() {
        this.#config = new MonkeyConfig({
            title: 'Moodle Utils Configuration',
            menuCommand: true,
            params: {
                serverAddress: {
                    type: 'text',
                    default: ""
                }
            }
        })
    }

    get serverAddress(): string {
        return this.#config.get('serverAddress')
    }
}