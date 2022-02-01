import MoodleUtilsElem from "MoodleUtilsElem";

type ServerStatus = "ok" | "failed" | "unknown"

export default class ServerStatusBar {
    #element: JQuery<HTMLElement>
    #status: ServerStatus = "unknown"

    constructor(parent: JQuery<HTMLElement>) {
        this.#element = MoodleUtilsElem('<div>')
            .text("Moodle Utils server status: ")
            .addClass("status unknown")
        this.#element.appendTo(parent)
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