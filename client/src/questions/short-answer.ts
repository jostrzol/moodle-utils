import Connection, { AnswerCounts } from "../connection"
import MoodleUtilsElem from "../moodle-utils-elem"
import Question from "./question"

export default class QuestionShortAnswer extends Question {
    #top: HTMLDivElement
    #textField: HTMLInputElement
    #timerId: number | null = null
    #sendTimeout: number = 1000

    constructor(htmlElement: HTMLElement, connection: Connection) {
        super(htmlElement, connection)

        const formulation = $(".formulation", htmlElement)
        const top = MoodleUtilsElem<HTMLDivElement>('<div>')
            .addClass("topanswers")
            .appendTo(formulation)
        this.#top = top[0]

        MoodleUtilsElem('<div>')
            .addClass("top-short-answers-label")
            .text("Najliczniejsze odpowiedzi:")
            .appendTo(top)

        for (let i = 0; i < 5; i++) {
            const a = MoodleUtilsElem('<div>').addClass("top-short-answer").appendTo(top)
            MoodleUtilsElem('<div>').addClass("top-short-answer-content").appendTo(a)
            MoodleUtilsElem('<div>').addClass("answer-counter").appendTo(a)
        }

        $(htmlElement).on("change", (this.#sendAnswer).bind(this))
        this.#textField = $<HTMLInputElement>(":text", htmlElement)
            .on("keydown", (this.#onKeypress).bind(this)).get(0)
        this.#sendAnswer()
    }

    #onKeypress(e: JQuery.KeyDownEvent) {
        if (e.key == "Enter") {
            // send immediately
            this.#sendAnswer()
        }
        else {
            // send after timeout
            if (this.#timerId !== null)
                window.clearTimeout(this.#timerId)

            this.#timerId = window.setTimeout(
                () => {
                    this.#timerId = null
                    this.#sendAnswer();
                },
                this.#sendTimeout)
        }
    }

    #sendAnswer() {
        this.postAnswers(this.fullAnswerData())
    }

    public fullAnswerData() {
        const answer = this.#textField.value
        return answer == "" ? [] : [answer]
    }

    public update(data: AnswerCounts) {
        const sorted = Object.entries(data).sort(([_1, a], [_2, b]) =>
            parseInt(b as string) - parseInt(a as string))
        let el = $(this.#top).children(".top-short-answer").first()
        for (const [answerText, count] of sorted) {
            if (el.length == 0) { break }
            el.children(".top-short-answer-content").text(answerText)
            el.children(".answer-counter").text(count as string)
            el = el.next()
        }
        while (el.length != 0) {
            el.children(".top-short-answer-content").text("")
            el.children(".answer-counter").text("")
            el = el.next()
        }
    }

    get sendTimeout() { return this.#sendTimeout }
    set sendTimeout(value: number) {
        if (value < 0)
            throw new Error("sendTimeout value cannot be negative")
        this.#sendTimeout = value
    }
}