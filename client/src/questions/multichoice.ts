import Connection from "../connection"
import MoodleUtilsElem from "../moodle-utils-elem"
import OnHTMLElement from "../on-html-element"
import Question from "./question"

class Choice extends OnHTMLElement<HTMLInputElement> {
    #text: string
    #counter: HTMLSpanElement

    constructor(htmlElement: HTMLInputElement) {
        super(htmlElement)

        const label = $("~ .d-flex", htmlElement)
        this.#text = $("div.flex-fill", label).text()
        this.#counter = MoodleUtilsElem("<span>")
            .addClass("answer-counter")
            .text(0)
            .appendTo(label)
            .get(0)
    }

    setCount(count: string) { this.#counter.innerText = count }
    get text() { return this.#text }
}

export default class QuestionMultichoice extends Question {
    #choices = new Map<HTMLInputElement, Choice>()
    #isSingleChoice: boolean
    get isSingleChoice() { return this.#isSingleChoice }

    #addChoice(htmlElement: HTMLInputElement) {
        const choice = new Choice(htmlElement)
        this.#choices.set(htmlElement, choice)
        return choice
    }

    constructor(htmlElement: HTMLElement, connection: Connection) {
        super(htmlElement, connection)
        $<HTMLInputElement>("[value!=-1]:radio, :checkbox", this.answerBlock)
            .map((_, c) => { this.#addChoice(c) })

        const cancel = $(".qtype_multichoice_clearchoice a", this.answerBlock)
        // no cancel in multichoice with multiple answers
        if (cancel.length > 0) {
            this.#isSingleChoice = true
            $(this.answerBlock).on('change', (this.#onChangeRadio).bind(this))
            cancel.on('click', (this.#onCancel).bind(this))
        } else {
            this.#isSingleChoice = false
            $(this.answerBlock).on('change', (this.#onChangeMultichoice).bind(this))
        }

        this.postAnswers(this.fullAnswerData())
    }

    #onChangeMultichoice() {
        this.postAnswers(this.fullAnswerData())
    }

    #onChangeRadio(e: JQuery.TriggeredEvent) {
        this.postAnswers([this.#choices.get(e.target)!.text])
    }

    #onCancel() {
        this.resetAnswer()
    }

    public fullAnswerData() {
        return $<HTMLInputElement>(":checked[value!=-1]", this.answerBlock)
            .map((_, e) => this.#choices.get(e)!.text)
            .get()
    }

    public update(data: Record<string, string>) {
        for (const choice of this.#choices.values()) {
            choice.setCount(data[choice.text] || "0")
        }
    }
}