import Question from "questions/Question"

type MoodleUtilsEndpoints = "gather-form" | "get-answers"

export default class Connection {
    #serverAddress: string
    #cmid: string
    #attemptId: string
    onFail: () => void = () => { }
    onSuccess: () => void = () => { }

    constructor(serverAddress: string, cmid: string, attemptId: string) {
        this.#serverAddress = serverAddress
        this.#cmid = cmid
        this.#attemptId = attemptId
    }

    static fromQuizURL(serverAddress: string, quizUrl: string): Connection {
        const parsedUrl = new URL(quizUrl)
        const cmid = parsedUrl.searchParams.get("cmid")
        const attempt = parsedUrl.searchParams.get("attempt")
        if (cmid === null) {
            throw new Error("required 'cmid' query not found in url");
        } else if (attempt === null) {
            throw new Error("required 'attempt' query not found in url");
        }
        return new Connection(serverAddress, cmid, attempt)
    }

    get #urlId(): string {
        return `cmid=${this.#cmid}&attempt=${this.#attemptId}`
    }

    #endpointUrl(endpointName: MoodleUtilsEndpoints): string {
        return `${this.#serverAddress}/${endpointName}?${this.#urlId}`
    }

    public postAnswers(data: Object): JQuery.jqXHR {
        return $.ajax({
            url: this.#endpointUrl("gather-form"),
            type: 'post',
            data: JSON.stringify(data),
            contentType: "application/json",
            dataType: "json",
        }).fail(this.onFail).done(this.onSuccess);
    }

    public getAnswers(callback: (data: Record<string, any>) => void, ...questions: Question[]): JQuery.jqXHR {
        let url = this.#endpointUrl("get-answers")
        for (let q of questions) {
            url += `&q=${encodeURIComponent(q.text)}`
        }
        return $.getJSON(url, callback).fail(this.onFail).done(this.onSuccess)
    }
}