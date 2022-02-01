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
        for (let input of $(":radio", htmlElement) as JQuery<HTMLInputElement>) {
            let counter = MoodleUtilsElem("<span>").addClass("answercounter")
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


        $(htmlElement).on('change', this.#onChange)
        $(":radio:checked", htmlElement).trigger('change') // send initial value
    }

    #onChange(e: JQuery.TriggeredEvent) {
        let data: any = {}
        data[this.text] = [(e.target as HTMLInputElement).value]
        this.connection.postAnswers(data)
    }

    public update(data: Record<string, string>) {
        this.#trueCount.innerText = data["1"] || "0"
        this.#falseCount.innerText = data["0"] || "0"
    }
}