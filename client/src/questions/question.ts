import Connection, { AnswerCounts, PostAnswerData } from "../connection"
import MoodleUtilsCookies from "../cookies"
import MoodleUtilsElem from "../moodle-utils-elem"
import OnHTMLElement from "../on-html-element"

export default abstract class Question extends OnHTMLElement {
    connection: Connection

    #questionText: string
    get questionText() { return this.#questionText }

    #answerBlock: HTMLDivElement
    get answerBlock() { return this.#answerBlock }

    #topBar: HTMLDivElement
    get topBar() { return this.#topBar }

    #info: HTMLDivElement
    get info() { return this.#info }
    setInfoText(text: string) { this.#info.innerText = text }

    #unsureCheckbox: HTMLInputElement
    get unsureCheckbox() { return this.#unsureCheckbox }
    get isUnsure() { return this.#unsureCheckbox.checked }


    constructor(htmlElement: HTMLElement, connection: Connection) {
        super(htmlElement)
        this.connection = connection
        this.#questionText = (this.constructor as typeof Question).extractText(htmlElement)
        this.#answerBlock = $<HTMLDivElement>(".ablock", htmlElement).get(0)

        this.#topBar = MoodleUtilsElem<HTMLDivElement>("<div>")
            .addClass("moodle-utils-top-bar")
            .prependTo($(".formulation", htmlElement))
            .get(0)
        const unsureBox = MoodleUtilsElem("<div>")
            .addClass("moodle-utils-unsure-box")
            .appendTo(this.#topBar)
        const checkboxId = `moodle-utils-unsure-checkbox-${htmlElement.id}`
        MoodleUtilsElem("<label>")
            .attr("for", checkboxId)
            .text("? ")
            .appendTo(unsureBox)
        this.#unsureCheckbox = MoodleUtilsElem<HTMLInputElement>("<input>")
            .attr("id", checkboxId)
            .attr("type", "checkbox")
            .on("change", (this.#onUnsureChange).bind(this))
            .appendTo(unsureBox)
            .get(0)
        this.#info = MoodleUtilsElem<HTMLDivElement>("<div>")
            .addClass("moodle-utils-info")
            .appendTo(this.#topBar)
            .get(0)

        // remember unsure setting
        const cookies = MoodleUtilsCookies.instance
        this.#unsureCheckbox.checked = cookies.getUnsure(this.#questionText)
        $(window).on("beforeunload", (this.#onUnload).bind(this))
    }

    protected static extractText(htmlElement: HTMLElement): string {
        return $(".qtext", htmlElement).text()
    }

    public resetAnswer() {
        this.connection.resetAnswers(this)
    }

    #onUnsureChange(e: JQuery.ChangeEvent) {
        if (this.isUnsure)
            this.resetAnswer()
        else
            this.postAnswers(this.fullAnswerData())

        // prevent any question-specific handlers 
        // from firing on this checkbox
        e.stopPropagation()
    }

    #onUnload(e: JQuery.TriggeredEvent) {
        MoodleUtilsCookies.instance.setUnsure(
            this.#questionText, this.#unsureCheckbox.checked)
    }

    public postAnswers(data: PostAnswerData[keyof PostAnswerData]): void {
        if (this.isUnsure)
            return

        this.connection.postAnswers({ [this.questionText]: data })
    }

    public abstract fullAnswerData(): PostAnswerData[keyof PostAnswerData]
    public abstract update(data: AnswerCounts[keyof AnswerCounts]): void
}