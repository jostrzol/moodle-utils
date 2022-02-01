import Connection from "../connection"
import OnHTMLElement from "../on-html-element"

export default abstract class Question extends OnHTMLElement {
    #text: string
    connection: Connection

    constructor(htmlElement: HTMLElement, connection: Connection) {
        super(htmlElement)
        this.#text = Question.extractText(htmlElement)
        this.connection = connection
    }

    protected static extractText(htmlElement: HTMLElement): string {
        return $(".qtext", htmlElement).text()
    }

    get text() { return this.#text }

    public abstract update(data: Object): void
}