import Connection from "Connection"
import OnHTMLElement from "OnHTMLElement"
import QuestionMultichoice from "./Multichoice"
import QuestionShortAnswer from "./ShortAnswer"
import QuestionTrueFalse from "./TrueFalse"

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

    // utility function for quick question creation
    public static create(htmlElement: HTMLElement, connection: Connection): Question | null {
        const classes = htmlElement.classList
        if ("multichoice" in classes) {
            return new QuestionMultichoice(htmlElement, connection)
        } else if ("truefalse" in classes) {
            return new QuestionTrueFalse(htmlElement, connection)
        } else if ("shortanswer" in classes) {
            return new QuestionShortAnswer(htmlElement, connection)
        }
        return null
    }
}