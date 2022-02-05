import MoodleUtilsElem from "./moodle-utils-elem"

export default class ImprovedTimer {
    #moodconstimer: Moodle.Timer
    #timer: HTMLSpanElement

    constructor(moodconstimer: Moodle.Timer) {
        const perQuestion = MoodleUtilsElem("<div>").addClass("per-question")
            .text("Średnio na pytanie ").appendTo(".othernav")

        const timer = MoodleUtilsElem("<span>").addClass("timer-per-question")
            .appendTo(perQuestion)
        this.#timer = timer[0]

        this.#moodconstimer = moodconstimer
        const orgUpdate = moodconstimer.update
        moodconstimer.update = () => {
            orgUpdate()
            this.#perQuestionUpdate()
        }
    }

    #perQuestionUpdate() {
        const notAnsweredLen = $(".qnbutton.notyetanswered").length
        if (notAnsweredLen == 0) { return; }

        const timeS = (this.#moodconstimer.endtime - new Date().getTime()) / 1000
        const tPerQuestion = timeS / notAnsweredLen

        const m = Math.floor(tPerQuestion / 60)
        const [s, ms] = (tPerQuestion % 60).toFixed(3).split(".")

        const tPerQuestionStr = `${m}:${s.padStart(2, "0")}.${ms}`
        this.#timer.innerHTML = tPerQuestionStr
    }
}