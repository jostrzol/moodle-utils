// YUI
export declare namespace YUI {
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

export declare var Y: YUI.Y

// GM
export declare function GM_addStyle(css: string): void
export declare function GM_getResourceText(resource: string): string

// Moodle
export declare namespace Moodle {
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
export declare var M: Moodle.Moodle

// MonkeyConfig
export declare class MonkeyConfig {
    constructor(config: any)
    public get(param: string)
}