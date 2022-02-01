import MoodleUtilsElem from "moodle-utils-elem"

export default class ImprovedTimer {
    #moodleTimer: Moodle.Timer
    #timer: HTMLSpanElement

    constructor(moodleTimer: Moodle.Timer) {
        let perQuestion = MoodleUtilsElem("<div>").addClass("perquestion")
            .text("Średnio na pytanie ").appendTo(".othernav")

        let timer = MoodleUtilsElem("<span>").addClass("timerperquestion")
            .appendTo(perQuestion)
        this.#timer = timer[0]

        this.#moodleTimer = moodleTimer
        let orgUpdate = moodleTimer.update
        moodleTimer.update = () => {
            orgUpdate()
            this.#perQuestionUpdate()
        }
    }

    #perQuestionUpdate() {
        let notAnsweredLen = $(".qnbutton.notyetanswered").length
        if (notAnsweredLen == 0) { return; }

        let timeS = (this.#moodleTimer.endtime - new Date().getTime()) / 1000
        let tPerQuestion = timeS / notAnsweredLen

        let m = Math.floor(tPerQuestion / 60)
        let [s, ms] = (tPerQuestion % 60).toFixed(3).split(".")

        let tPerQuestionStr = `${m}:${s.padStart(2, "0")}.${ms}`
        this.#timer.innerHTML = tPerQuestionStr
    }
}