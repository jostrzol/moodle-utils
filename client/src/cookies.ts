
export class AttemptCookies {
    // default: 3 days from now
    static get #defaultExpire() { return Date.now() + 1000 * 60 * 60 * 24 * 3 }

    #unsureSet = new Set<string>()
    expire: number

    constructor(expire: number | null) {
        this.expire = expire ?? AttemptCookies.#defaultExpire
    }

    setUnsure(questionText: string, newValue: boolean) {
        if (newValue)
            this.#unsureSet.add(questionText)
        else
            this.#unsureSet.delete(questionText)
    }

    getUnsure(questionText: string): boolean {
        return this.#unsureSet.has(questionText)
    }

    isEmpty() { return this.#unsureSet.size == 0 }

    isExpired() { return this.expire < Date.now() }

    objectified(): any {
        const object = Object.fromEntries(Object.entries(this))
        object.unsureSet = [...this.#unsureSet.keys()]
        return object
    }

    static fromObject(object: any): AttemptCookies {
        const result = new AttemptCookies(object.expire)
        for (const questionText of object.unsureSet) {
            result.#unsureSet.add(questionText)
        }
        return result
    }
}

// singleton
export default class MoodleUtilsCookies {
    static #instance: MoodleUtilsCookies
    static get instance() {
        if (this.#instance === undefined)
            this.#instance = new MoodleUtilsCookies()
        return this.#instance
    }

    #unsureMap: Map<string, AttemptCookies>
    #unsureMapFromObject(newValue: any) {
        this.#unsureMap = new Map()
        Object.entries(newValue).forEach(([key, value]) => {
            this.#unsureMap.set(key, AttemptCookies.fromObject(value))
        })
        return this.#unsureMap
    }
    #unsureMapObjectified() {
        const result: any = {}
        this.#unsureMap.forEach(
            (value, key) => { result[key] = value.objectified() })
        return result
    }

    cmid: string
    attempt: string
    get #attemptId() { return `${this.cmid},${this.attempt}` }

    private constructor() {
        this.#unsureMapFromObject(GM_getValue('unsureMap', {}))
        GM_addValueChangeListener('unsureMap', (this.#onUnsureMapChange).bind(this))

        this.#unsureMap.forEach((v, k) => {
            if (v.isExpired())
                this.#unsureMap.delete(k)
        })

        GM_setValue('unsureMap', this.#unsureMapObjectified())
    }

    #onUnsureMapChange(name: string, oldValue: any, newValue: any, remote: boolean) {
        if (remote)
            this.#unsureMapFromObject(newValue)
    }

    setUnsure(questionText: string, newValue: boolean) {
        let attemptCookies = this.#unsureMap.get(this.#attemptId)
        if (attemptCookies === undefined) {
            if (!newValue)
                //dont have to do anything
                return
            const expire = M.mod_quiz.timer.endtime // =0 if not set
            attemptCookies = new AttemptCookies(expire || null)
            this.#unsureMap.set(this.#attemptId, attemptCookies)
        }

        attemptCookies.setUnsure(questionText, newValue)
        if (attemptCookies.isEmpty())
            this.#unsureMap.delete(this.#attemptId)

        GM_setValue('unsureMap', this.#unsureMapObjectified())
    }

    getUnsure(questionText: string): boolean {
        let attemptCookies = this.#unsureMap.get(this.#attemptId)
        if (attemptCookies === undefined)
            return false

        return attemptCookies.getUnsure(questionText)
    }
}