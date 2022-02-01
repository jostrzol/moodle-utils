import Connection from "connection"
import MoodleUtilsElem from "moodle-utils-elem"
import Question from "./question"

export default class QuestionShortAnswer extends Question {
    #top: HTMLDivElement
    constructor(htmlElement: HTMLElement, connection: Connection) {
        super(htmlElement, connection)

        let formulation = $(".formulation", htmlElement)
        let top = MoodleUtilsElem('<div>').addClass("topanswers")
            .appendTo(formulation)
        this.#top = top[0] as HTMLDivElement

        MoodleUtilsElem('<div>').addClass("topshortanswerslabel")
            .text("Najliczniejsze odpowiedzi:").appendTo(top)

        for (let i = 0; i < 5; i++) {
            let a = MoodleUtilsElem('<div>').addClass("topshortanswer").appendTo(top)
            MoodleUtilsElem('<div>').addClass("topshortanswercontent").appendTo(a)
            MoodleUtilsElem('<div>').addClass("answercounter").appendTo(a)
        }

        $(htmlElement).on('change', this.#onChange)
        $(":text", htmlElement).on('keypress', e => {
            if (e.key == "Enter")
                this.#onChange(e)
        })
        $(":text", htmlElement).trigger('change') // send initial value
    }

    #onChange(e: JQuery.TriggeredEvent) {
        let data: any = {}
        let answer = (e.target as HTMLInputElement).value.trim()
        data[this.text] = answer == "" ? [] : [answer]
        this.connection.postAnswers(data)
    }

    public update(data: Record<string, string>) {
        type entry = [string, string]
        let sorted = Object.entries(data).sort((a: entry, b: entry) =>
            parseInt(b[1]) - parseInt(a[1]))
        let el = $(this.#top).children(".topshortanswer").first()
        for (let [answerText, count] of sorted) {
            if (el.length == 0) { break }
            el.children(".topshortanswercontent").text(answerText)
            el.children(".answercounter").text(count)
            el = el.next()
        }
        while (el.length != 0) {
            el.children(".topshortanswercontent").text("")
            el.children(".answercounter").text("")
            el = el.next()
        }
    }
}