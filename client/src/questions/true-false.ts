import Connection from "../connection"
import MoodleUtilsElem from "../moodle-utils-elem"
import OnHTMLElement from "../on-html-element"
import Question from "./question"

export default class QuestionTrueFalse extends Question {
    #trueCount: HTMLSpanElement
    #falseCount: HTMLSpanElement
    constructor(htmlElement: HTMLElement, connection: Connection) {
        super(htmlElement, connection)

        let trueCount: HTMLSpanElement | null = null
        let falseCount: HTMLSpanElement | null = null
        for (const input of $<HTMLInputElement>(":radio", this.answerBlock)) {
            const counter = MoodleUtilsElem("<span>").addClass("answer-counter")
                .text(0).appendTo(input.parentElement!)[0]

            switch (input.value) {
                case "0":
                    falseCount = counter
                    break;
                case "1":
                    trueCount = counter
                    break;
            }
        }

        if (trueCount === null || falseCount === null) {
            throw new OnHTMLElement.ConstructionError(
                htmlElement, "TrueFalse: no have true and/or false radio");
        }

        this.#trueCount = trueCount
        this.#falseCount = falseCount


        $(this.answerBlock).on('change', (this.#onChange).bind(this))
        this.postAnswers(this.fullAnswerData())
    }

    #onChange(e: JQuery.TriggeredEvent) {
        this.postAnswers([e.target.value])
    }

    public fullAnswerData() {
        const checked = $<HTMLInputElement>(":radio:checked", this.answerBlock).get(0)
        return checked === undefined ? [] : [checked.value]
    }

    public update(data: Record<string, string>) {
        this.#trueCount.innerText = data["1"] || "0"
        this.#falseCount.innerText = data["0"] || "0"
    }
}