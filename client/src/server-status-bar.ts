import MoodleUtilsElem from "./moodle-utils-elem";

type ServerStatus = "ok" | "failed" | "unknown"

export default class ServerStatusBar {
    #element: JQuery<HTMLElement>
    #status: ServerStatus = "unknown"

    constructor(parent: JQuery<HTMLElement>) {
        this.#element = MoodleUtilsElem('<div>')
            .text("Moodle Utils server status: ")
            .addClass("status unknown")
            .append("<hr/>")
        this.#element.prependTo(parent)
    }

    set status(newStatus: ServerStatus) {
        this.#element.removeClass(this.status)
        this.#element.addClass(newStatus)
        this.#status = newStatus
    }

    get status() {
        return this.#status
    }
}