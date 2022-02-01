import Connection from "../connection";
import QuestionGapSelect from "./gap-select";
import QuestionMultichoice from "./multichoice";
import Question from "./question";
import QuestionShortAnswer from "./short-answer";
import QuestionTrueFalse from "./true-false";

export class QuestionMap extends Map<string, Question>{
    connection: Connection

    constructor(root: HTMLElement, connection: Connection) {
        super()
        $(".que", root)
            .map((_, q) => this.#create(q, connection))
            .each((_, q) => { this.set(q.text, q) })
        this.connection = connection
    }

    public updateAll() {
        this.connection.getAnswers(data => {
            for (let [qtext, qdata] of Object.entries(data)) {
                let q = this.get(qtext)
                if (q !== undefined)
                    try {
                        q.update(qdata)
                    } catch (error) {
                        console.error(`error updating question '${qtext}': ${error}`)
                    }
                else
                    console.error(`no question '${qtext}' on current page`);
            }
        }, ...this.values())
    }

    // utility function for quick question creation
    #create(htmlElement: HTMLElement, connection: Connection): Question | null {
        const classes = htmlElement.classList
        for (const className of classes) {
            switch (className) {
                case "multichoice":
                    return new QuestionMultichoice(htmlElement, connection)
                case "truefalse":
                    return new QuestionTrueFalse(htmlElement, connection)
                case "shortanswer":
                    return new QuestionShortAnswer(htmlElement, connection)
                case "gapselect":
                    return new QuestionGapSelect(htmlElement, connection)
            }
        }
        return null
    }
}