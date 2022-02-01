export default class OnHTMLElement<T extends HTMLElement = HTMLElement> {
    static ConstructionError = class extends Error {
        htmlElement: HTMLElement

        constructor(htmlElement: HTMLElement, message: string) {
            super(`#${htmlElement.id} construction: ${message}`)
            this.htmlElement = htmlElement
        }
    }

    #html: T

    constructor(htmlElement: T) {
        this.#html = htmlElement
    }

    get html() {
        return this.#html
    }
}