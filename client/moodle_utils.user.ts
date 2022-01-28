// ==UserScript==
// @name            Moodle Utils
// @author          Ogurczak
// @description     Displays time per question left
// @version         0.7.1
// @namespace       https://github.com/Ogurczak/
// @updateURL       https://github.com/Ogurczak/moodle-utils/raw/main/client/build/moodle_utils.user.js
// @match           https://*/mod/quiz/attempt*
// @match           https://*/mod/quiz*
// @match           https://github.com/Ogurczak/moodle-utils*
// @match           https://*.moodlecloud.com/*
// @grant           GM_addStyle
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_registerMenuCommand
// @grant           GM_getResourceText
// @resource        css https://raw.githubusercontent.com/Ogurczak/moodle-utils/{{pre-push:branch}}/client/style.css
// @require         https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @require         http://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

declare namespace YUI {
    interface status {
        msg: string,
        success: boolean
        data: any
    }

    interface Y {
        on(s: string, fn: () => any): any
        use(name: string, fn?: (Y?: Y, status?: status) => any): void
    }
}

declare var Y: YUI.Y
declare function GM_addStyle(css: string): void
declare function GM_getResourceText(resource: string): string

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

declare function MonkeyConfig(arg: any): void

(function () {
    'use strict';

    var cfg = new MonkeyConfig({
        title: 'Moodle Utils Configuration',
        menuCommand: true,
        params: {
            server_address: {
                type: 'text',
                default: ""
            }
        }
    });

    const win_url = new URL(window.location.href)
    const cmid = win_url.searchParams.get("cmid")
    const attempt = win_url.searchParams.get("attempt")

    const base_url = cfg.get("server_address")
    const url_id = `cmid=${cmid}&attempt=${attempt}`

    function create(str: string) {
        return $(str).addClass("moodleutils")
    }

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
        if (questions.length == 0) { questions = [...qmap.values()] }
        let url = `${base_url}/get-answers?${url_id}`
        for (let q of questions) {
            url += `&q=${encodeURIComponent(q.text)}`
        }
        $.getJSON(url, function (data: Record<string, any>) {
            for (let [qtext, qdata] of Object.entries(data)) {
                let q = qmap.get(qtext)
                q.update(qdata)
            }
        })
    }

    function add_style() {
        GM_addStyle(GM_getResourceText('css'))
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
        abstract update(data: Object): void
    }

    class QuestionMultichoice extends Question {
        #counts = new Map<string, HTMLSpanElement>()
        #inputs = new Map<HTMLInputElement, string>()
        constructor(html_element: HTMLDivElement) {
            super(html_element)
            for (let input of $("[value!=-1]:radio, :checkbox", html_element) as JQuery<HTMLInputElement>) {
                let label = $("~ .d-flex", input)

                let counter = create("<span>").addClass("answercounter").text(0).appendTo(label)[0]
                let answer_text = $("div.flex-fill", label).text().replaceAll("\n", "")

                this.#counts.set(answer_text, counter)
                this.#inputs.set(input, answer_text)
            }

            let cancel = $(".qtype_multichoice_clearchoice a", html_element)[0]
            // no cancel in multichoice with multiple answers
            if (cancel) {
                $(html_element).on('change', (this.changeHandlerRadio).bind(this))
                $(cancel).on('click', (this.cancelHandler).bind(this))
                $("[value!=-1]:radio:checked", html_element).trigger('change') // send initial value
            } else {
                $(html_element).on('change', (this.changeHandlerMultichoice).bind(this))
                $(":checkbox:checked", html_element).trigger('change') // send initial value
            }
        }

        private changeHandlerMultichoice() {
            let data = {}
            let data_checked: string[] = data[this.text] = []
            for (let checked of $(":checkbox:checked", this.html) as JQuery<HTMLInputElement>) {
                data_checked.push(this.#inputs.get(checked))
            }
            send_gather_form(data)
        }

        private changeHandlerRadio(e: Event) {
            let data = {}
            data[this.text] = [this.#inputs.get(e.target as HTMLInputElement)]
            send_gather_form(data)
        }

        private cancelHandler() {
            let data = {}
            data[this.text] = []
            send_gather_form(data)
        }

        update(data: Record<string, string>) {
            for (let [answer_text, counter] of this.#counts) {
                let count = data[answer_text] || "0"
                counter.innerText = count
            }
        }
    }

    class QuestionTrueFalse extends Question {
        #true_count: HTMLSpanElement
        #false_count: HTMLSpanElement
        constructor(html_element: HTMLDivElement) {
            super(html_element)
            for (let input of $(":radio", html_element) as JQuery<HTMLInputElement>) {
                let counter = create("<span>").addClass("answercounter")
                    .text(0).appendTo(input.parentElement)[0]

                switch (input.value) {
                    case "0":
                        this.#false_count = counter
                        break;
                    case "1":
                        this.#true_count = counter
                        break;
                }
            }

            $(html_element).on('change', (this.changeHandler).bind(this))
            $(":radio:checked", html_element).trigger('change') // send initial value
        }

        private changeHandler(e: Event) {
            let data = {}
            data[this.text] = [(e.target as HTMLInputElement).value]
            send_gather_form(data)
        }

        update(data: Record<string, string>) {
            this.#true_count.innerText = data["1"] || "0"
            this.#false_count.innerText = data["0"] || "0"
        }
    }

    class QuestionShortAnswer extends Question {
        #top: HTMLDivElement
        constructor(html_element: HTMLDivElement) {
            super(html_element)

            let formulation = $(".formulation", html_element)
            let top = $('<div>').addClass("topanswers moodleutils")
                .appendTo(formulation)
            this.#top = top[0] as HTMLDivElement

            $('<div>').addClass("topshortanswerslabel moodleutils")
                .text("Najliczniejsze odpowiedzi:").appendTo(top)

            for (let i = 0; i < 5; i++) {
                let a = $('<div>').addClass("topshortanswer moodleutils").appendTo(top)
                $('<div>').addClass("topshortanswercontent moodleutils").appendTo(a)
                $('<div>').addClass("answercounter moodleutils").appendTo(a)
            }

            $(html_element).on('change', (this.changeHandler).bind(this))
            $(":text", html_element).on('keypress', function (e: KeyboardEvent) {
                if (e.key == "Enter") { this.changeHandler({ target: e.target }) }
            }.bind(this))
            $(":text", html_element).trigger('change') // send initial value
        }

        private changeHandler(e: Event) {
            let data = {}
            let answer = (e.target as HTMLInputElement).value.trim()
            data[this.text] = answer == "" ? [] : [answer]
            send_gather_form(data)
        }

        update(data: Record<string, string>) {
            type entry = [string, string]
            let sorted = Object.entries(data).sort((a: entry, b: entry) =>
                parseInt(b[1]) - parseInt(a[1]))
            let el = $(this.#top).children(".topshortanswer").first()
            for (let [answer_text, count] of sorted) {
                if (el.length == 0) { break }
                el.children(".topshortanswercontent").text(answer_text)
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

    class ImprovedTimer {
        #moodle_timer: Moodle.Timer
        #timer: HTMLSpanElement

        constructor(moodle_timer: Moodle.Timer) {
            let per_question = create("<div>").addClass("perquestion")
                .text("Średnio na pytanie ").appendTo(".othernav")

            let timer = create("<span>").addClass("timerperquestion")
                .appendTo(per_question)
            this.#timer = timer[0]

            this.#moodle_timer = moodle_timer
            let org_update = moodle_timer.update
            moodle_timer.update = function () {
                org_update()
                this.per_question_update()
            }.bind(this)
        }

        private per_question_update() {
            let not_answered_len = $(".qnbutton.notyetanswered").length
            if (not_answered_len == 0) { return; }

            let time_s = (this.#moodle_timer.endtime - new Date().getTime()) / 1000
            let t_per_question = time_s / not_answered_len

            let m = Math.floor(t_per_question / 60)
            let [s, ms] = (t_per_question % 60).toFixed(3).split(".")

            let t_per_question_str = `${m}:${s.padStart(2, "0")}.${ms}`
            this.#timer.innerHTML = t_per_question_str
        }
    }

    // enable only on quizes
    // on the rest of matches enable just the configuration
    const enable_regex = /^https:\/\/.*\/mod\/quiz\/attempt.*$/
    if (!enable_regex.test(window.location.href))
        return

    Y.on("domready", function () {
        add_style()
        if ($(".qnbutton.notyetanswered").length != 0 && M.mod_quiz.timer?.endtime != 0) {
            new ImprovedTimer(M.mod_quiz.timer)
        }

        if (base_url == "") { return }

        var qmap = new Map<string, Question>()
        for (let q of $(".que") as JQuery<HTMLDivElement>) {
            let que = null
            if ($(q).hasClass("multichoice")) {
                que = new QuestionMultichoice(q)
            } else if ($(q).hasClass("truefalse")) {
                que = new QuestionTrueFalse(q)
            } else if ($(q).hasClass("shortanswer")) {
                que = new QuestionShortAnswer(q)
            }

            if (que !== null) { qmap.set(que.text, que) }
        }
        if (qmap.size != 0) { window.setInterval(get_answers, 1000, qmap) }
    })
})();
