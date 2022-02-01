import Connection from "connection"
import MoodleUtilsElem from "moodle-utils-elem"
import Question from "./question"

export default class QuestionMultichoice extends Question {
    #counts = new Map<string, HTMLSpanElement>()
    #inputs = new Map<HTMLInputElement, string>()
    constructor(htmlElement: HTMLElement, connection: Connection) {
        super(htmlElement, connection)
        for (let input of $("[value!=-1]:radio, :checkbox", htmlElement) as JQuery<HTMLInputElement>) {
            let label = $("~ .d-flex", input)

            let counter = MoodleUtilsElem("<span>").addClass("answercounter").text(0).appendTo(label)[0]
            let answerText = $("div.flex-fill", label).text()

            this.#counts.set(answerText, counter)
            this.#inputs.set(input, answerText)
        }

        let cancel = $(".qtype_multichoice_clearchoice a", htmlElement)[0]
        // no cancel in multichoice with multiple answers
        if (cancel) {
            $(htmlElement).on('change', this.#onChangeRadio)
            $(cancel).on('click', this.#onCancel)
            $("[value!=-1]:radio:checked", htmlElement).trigger('change') // send initial value
        } else {
            $(htmlElement).on('change', this.#onChangeMultichoice)
            $(":checkbox:checked", htmlElement).trigger('change') // send initial value
        }
    }

    #onChangeMultichoice() {
        let data: any = {}
        let dataChecked: string[] = data[this.text] = []
        for (let checked of $(":checkbox:checked", this.html) as JQuery<HTMLInputElement>) {
            dataChecked.push(this.#inputs.get(checked)!)
        }
        this.connection.postAnswers(data)
    }

    #onChangeRadio(e: JQuery.TriggeredEvent) {
        let data: any = {}
        data[this.text] = [this.#inputs.get(e.target as HTMLInputElement)]
        this.connection.postAnswers(data)
    }

    #onCancel() {
        let data: any = {}
        data[this.text] = []
        this.connection.postAnswers(data)
    }

    public update(data: Record<string, string>) {
        for (let [answerText, counter] of this.#counts) {
            let count = data[answerText] || "0"
            counter.innerText = count
        }
    }
}