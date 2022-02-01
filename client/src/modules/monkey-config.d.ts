// YUI
declare namespace YUI {
    interface status {
        msg: string,
        success: boolean
        data: any
    }

    interface Y {
        on(s: string, fn: () => any): any
        use(name: string, fn?: (Y?: Y, status?: status) => any): void
    }
}

declare var Y: YUI.Y

// Moodle
declare namespace Moodle {
    interface Timer {
        update: Function
        endtime: number
    }
    interface ModQuiz {
        timer: Timer
    }
    interface Moodle {
        mod_quiz: ModQuiz
    }
}
declare var M: Moodle.Moodle

// MonkeyConfig
declare class MonkeyConfig {
    constructor(config: any)
    public get(param: string): string
}