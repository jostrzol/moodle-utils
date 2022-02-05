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
                },
                improveTimer: {
                    type: 'checkbox',
                    default: true,
                },
            }
        })
    }

    get serverAddress(): string {
        return this.#config.get('serverAddress')
    }

    get improveTimer(): boolean {
        return this.#config.get<boolean>('improveTimer')
    }
}