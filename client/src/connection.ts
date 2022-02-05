import Question from "./questions/question"

export type MoodleUtilsEndpoints = "gather-form" | "get-answers" | "reset-answers"

export class NoURLQueryError extends Error {
    queryName: string
    constructor(queryName: string) {
        super(`required '${queryName}' query not found in url`)
        this.queryName = queryName
    }
}

export type PostAnswerData = { [key: string]: PostAnswerData | string[] }
export type AnswerCounts = { [key: string]: AnswerCounts | string }

type FailCallback = JQuery.Deferred.CallbackBase<JQuery.jqXHR<any>, JQuery.Ajax.ErrorTextStatus, string, never>
type SuccessCallback = JQuery.Deferred.CallbackBase<any, JQuery.Ajax.SuccessTextStatus, JQuery.jqXHR<any>, never>


export default class Connection {
    #serverAddress: string
    #cmid: string
    #attemptId: string
    onFail: FailCallback = () => { }
    onSuccess: SuccessCallback = () => { }

    constructor(serverAddress: string, cmid: string, attemptId: string) {
        // trim trailing slashes
        this.#serverAddress = serverAddress.replace(/\/+$/, '')

        this.#cmid = cmid
        this.#attemptId = attemptId
    }

    static fromQuizURL(serverAddress: string, quizUrl: string): Connection {
        const parsedUrl = new URL(quizUrl)
        const cmid = parsedUrl.searchParams.get("cmid")
        const attempt = parsedUrl.searchParams.get("attempt")
        if (cmid === null) {
            throw new NoURLQueryError('cmid')
        } else if (attempt === null) {
            throw new NoURLQueryError('attempt')
        }
        return new Connection(serverAddress, cmid, attempt)
    }

    get #urlId(): string {
        return `cmid=${this.#cmid}&attempt=${this.#attemptId}`
    }

    #endpointUrl(endpointName: MoodleUtilsEndpoints): string {
        return `${this.#serverAddress}/${endpointName}?${this.#urlId}`
    }

    public postAnswers(data: PostAnswerData): JQuery.jqXHR {
        return $.ajax({
            url: this.#endpointUrl("gather-form"),
            type: 'post',
            data: JSON.stringify(data),
            contentType: "application/json",
        }).fail(this.onFail).done(this.onSuccess);
    }

    public getAnswers(callback: (data: AnswerCounts) => void, ...questions: Question[]): JQuery.jqXHR {
        let url = this.#endpointUrl("get-answers")
        for (const q of questions) {
            url += `&q=${encodeURIComponent(q.questionText)}`
        }
        return $.getJSON(url, callback).fail(this.onFail).done(this.onSuccess)
    }

    public resetAnswers(...questions: Question[]): JQuery.jqXHR {
        let url = this.#endpointUrl("reset-answers")
        for (const q of questions) {
            url += `&q=${encodeURIComponent(q.questionText)}`
        }
        return $.ajax({
            url: url,
            type: 'delete',
        }).fail(this.onFail).done(this.onSuccess);
    }
}