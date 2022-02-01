import Connection from "connection";
import Question from "./question";

export class QuestionMap extends Map<string, Question>{
    connection: Connection

    constructor(root: HTMLElement, connection: Connection) {
        super()
        $(".que", root)
            .map((_, q) => Question.create(q, connection))
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
}