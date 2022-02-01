import Connection from "../connection"
import MoodleUtilsElem from "../moodle-utils-elem"
import OnHTMLElement from "../on-html-element"
import Question from "./question"

export class Option extends OnHTMLElement {
    parent: GapSelectPlace
    #originalText: string
    #value: string

    constructor(parent: GapSelectPlace, htmlElement: HTMLElement) {
        super(htmlElement)
        this.parent = parent
        this.#originalText = htmlElement.innerText

        const value = htmlElement.getAttribute("value")
        if (value == null)
            throw new OnHTMLElement.ConstructionError(htmlElement, "Option: no value attribute");
        this.#value = value

        this.setCount("0")
    }

    public setCount(count: string) {
        this.html.innerText = `${this.#originalText} (${count})`
    }

    get originalText() { return this.#originalText }
    get value() { return this.#value }
    get select() { return this.parent }
}

export class GapSelectPlace extends OnHTMLElement<HTMLSelectElement> {
    static #nameValidator = /^place\d+$/
    static #isName(str: string) {
        return GapSelectPlace.#nameValidator.test(str)
    }

    parent: QuestionGapSelect
    #options = new Map<string, Option>()
    #name: string

    #addOption(htmlElement: HTMLElement) {
        const option = new Option(this, htmlElement)
        this.#options.set(option.value, option)
        return option
    }

    constructor(parent: QuestionGapSelect, htmlElement: HTMLSelectElement) {
        super(htmlElement)
        this.parent = parent

        $("option[value]", htmlElement).not("[value='']")
            .each((_, o) => { this.#addOption(o) })

        let name: string | null = null
        htmlElement.classList.forEach(n => {
            if (GapSelectPlace.#isName(n)) { name = n }
        })
        if (name === null) {
            const matcher = GapSelectPlace.#nameValidator.source
            throw new OnHTMLElement.ConstructionError(htmlElement,
                `GapSelectPlace: no name (class matching ${matcher})`);
        }
        this.#name = name

        $(htmlElement).on("change", (this.#onChange).bind(this))
    }

    #onChange(e: JQuery.TriggeredEvent) {
        const answers: string[] = []
        const selected = this.selected
        if (selected !== null)
            answers.push(selected.value)

        this.parent.connection.postAnswers({
            [this.parent.text]: {
                [this.#name]: answers
            }
        })
    }

    public update(data: Record<string, string>) {
        for (const [optionName, option] of this.#options) {
            option.setCount(data[optionName] || "0")
        }
    }

    get name() { return this.#name }
    get question() { return this.parent }
    get selected(): Option | null {
        const selected = this.html.selectedOptions
        if (selected.length == 0)
            return null
        else
            return this.#options.get(selected[0].value) || null
    }
}

export default class QuestionGapSelect extends Question {
    #places = new Map<string, GapSelectPlace>()

    #addPlace(htmlElement: HTMLSelectElement) {
        const place = new GapSelectPlace(this, htmlElement)
        this.#places.set(place.name, place)
        return place
    }

    constructor(htmlElement: HTMLElement, connection: Connection) {
        super(htmlElement, connection)
        $("select", htmlElement)
            .each((_, p) => { this.#addPlace(p as HTMLSelectElement) })


        MoodleUtilsElem("<div>").addClass("moodleutils-info")
            .text("(numbers in brackets show answer counts)")
            .prependTo($(".formulation", htmlElement))
    }

    protected static extractText(htmlElement: HTMLElement): string {
        return $(".qtext", htmlElement).clone().find(".control").remove().end().text()
    }

    public update(data: Record<string, Record<string, string>>) {
        for (const [placeText, place] of this.#places) {
            place.update(data[placeText])
        }
    }
}