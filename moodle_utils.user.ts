// ==UserScript==
// @name         Moodle Utils
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Displays time per question left
// @author       Ogurczak
// @match        https://*/mod/quiz/attempt*
// @match        https://ogurczak.ddns.net:8080
// @require      http://code.jquery.com/git/jquery-3.x-git.min.js
// @grant        none
// @ts-check
// ==/UserScript==

declare namespace Y {
    interface status {
        msg: string,
        success: boolean
        data: any
    }
}

declare interface YUI {
    on(s: string, fn: () => any): any
    use(name: string, fn?: (Y?: YUI, status?: Y.status) => any): void

    mdlutls: any
}

declare namespace Moodle {
    interface Timer {
        update: Function
        endtime: number
    }
    interface ModQuiz {
        timer: Timer
    }
    interface Moodle {
        mod_quiz: ModQuiz
    }
}
declare var M: Moodle.Moodle

(function () {
    'use strict';

    const win_url = new URL(window.location.href)
    const cmid = win_url.searchParams.get("cmid")
    const attempt = win_url.searchParams.get("attempt")

    const base_url = "https://ogurczak.ddns.net:8080"
    const url_id = `cmid=${cmid}&attempt=${attempt}`

    function send_gather_form(data: Object) {
        $.ajax({
            url: `${base_url}/gather-form?${url_id}`,
            type: 'post',
            data: JSON.stringify(data),
            contentType: "application/json",
            dataType: "json",
        });
    }

    function get_answers(qmap: Map<string, Question>, ...questions: Question[]) {
        if (!questions) { questions = [...qmap.values()] }
        let url = `${base_url}/get-answers?${url_id}`
        for (let q of questions) {
            url += `&q=${q.text}`
        }
        $.getJSON(url, function (data: Record<string, any>) {
            for (let [qtext, qdata] of Object.entries(data)) {
                let q = qmap.get(qtext)
                q.update_counters(qdata)
            }
        })
    }

    abstract class Question {
        #html: HTMLDivElement
        #text: string
        constructor(html_element: HTMLDivElement) {
            this.#html = html_element
            this.#text = $(".qtext", html_element)[0].innerText.replaceAll("\n", "")
        }
        get text() { return this.#text }
        get html() { return this.#html }
        abstract update_counters(data: Object): void
    }

    class QuestionMultichoice extends Question {
        #counts = new Map<string, HTMLSpanElement>()
        #radios = new Map<HTMLInputElement, string>()
        constructor(html_element: HTMLDivElement) {
            super(html_element)
            for (let radio of $("[value!=-1]:radio", html_element) as JQuery<HTMLInputElement>) {
                let label = $("~ .d-flex", radio)[0]

                let counter = document.createElement("span")
                counter.className = "answercounter"
                counter.innerHTML = "0"
                label.appendChild(counter)

                let answer_text = $("div.flex-fill", label)[0].innerText.replaceAll("\n", "")

                this.#counts.set(answer_text, counter)
                this.#radios.set(radio, answer_text)
            }

            html_element.addEventListener('change', (this.changeHandler).bind(this), false)
            let cancel = $(".qtype_multichoice_clearchoice a")[0]
            if (cancel) {
                // no cancel for multichoice with multiple answers
                cancel.addEventListener('click', (this.cancelHandler).bind(this), false)
            }
        }

        private changeHandler(e: Event) {
            let data = {}
            data[this.text] = this.#radios.get(e.target as HTMLInputElement)
            send_gather_form(data)
        }
        private cancelHandler() {
            let data = {}
            data[this.text] = ""
            send_gather_form(data)
        }

        update_counters(data: Record<string, string>) {
            for (let [answer_text, count] of Object.entries(data)) {
                this.#counts[answer_text] = count
            }
        }
    }
    class ImprovedTimer {
        #org_update: Function
        #moodle_timer: Moodle.Timer
        #timer_per_question: HTMLSpanElement

        constructor(moodle_timer: Moodle.Timer, answer_check_duration: number = 1000) {
            let per_question = document.createElement("div")
            per_question.innerHTML = "Średnio na pytanie "
            per_question.id = "perquestion"
            this.#timer_per_question = document.createElement("span")
            this.#timer_per_question.id = "timerperquestion"
            this.#timer_per_question.style.fontWeight = "700";
            per_question.appendChild(this.#timer_per_question)
            $(".othernav")[0].appendChild(per_question)

            this.#moodle_timer = moodle_timer
            this.#org_update = moodle_timer.update
            moodle_timer.update = (this.update).bind(this)
        }

        private per_question_update() {
            let not_answered_len = $(".qnbutton.notyetanswered").length
            if (not_answered_len == 0) { return; }

            let time_s = (this.#moodle_timer.endtime - new Date().getTime()) / 1000
            let t_per_question = time_s / not_answered_len

            let m = Math.floor(t_per_question / 60)
            let [s, ms] = (t_per_question % 60).toFixed(3).split(".")

            let t_per_question_str = `${m}:${s.padStart(2, "0")}.${ms}`
            this.#timer_per_question.innerHTML = t_per_question_str
        }

        private update() {
            this.#org_update()
            this.per_question_update()
        }
    }

    Y.on("domready", function () {
        new ImprovedTimer(M.mod_quiz.timer)
        var qmap = new Map<string, Question>()
        for (let q of $(".que") as JQuery<HTMLDivElement>) {
            if ($(q).hasClass("multichoice")) {
                let que = new QuestionMultichoice(q)
                qmap.set(que.text, que)
            }
        }
        window.setInterval(get_answers, 1000, qmap)
    })
})();
