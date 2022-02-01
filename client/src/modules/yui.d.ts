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