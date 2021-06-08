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

const answer_check_duration = 1000

const win_url = new URL(window.location.href)
const cmid = win_url.searchParams.get("cmid")
const attempt = win_url.searchParams.get("attempt")

const base_url = "https://ogurczak.ddns.net:8080"
const url_id = `cmid=${cmid}&attempt=${attempt}`

var qmap = new Map<string, Question>()

function send_gather_form(data: Object) {
    $.ajax({
        url: `${base_url}/gather-form?${url_id}`,
        type: 'post',
        data: JSON.stringify(data),
        contentType: "application/json",
        dataType: "json",
    });
}

function get_answers(questions: Array<Question>) {
    let url = `${base_url}/get-answers?${url_id}`
    for (let q of questions) {
        url += `&q=${q.text}`
    }
    $.getJSON(url, function (data: Record<string, any>) {
        for (let qtext in data) {
            let q = qmap[qtext]
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
    abstract update_counters(data: Object)
}

class QuestionRadio extends Question {
    #counts = new Map<string, HTMLSpanElement>()
    #radios = new Map<HTMLElement, string>()
    constructor(html_element: HTMLDivElement) {
        super(html_element)
        for (let radio of $("[value!=-1]:radio", html_element)) {
            let label = $("~ label", radio)[0]

            let counter = document.createElement("span")
            counter.className = "answercounter"
            counter.innerHTML = "0"
            label.appendChild(counter)

            let answer_text = $("div.flex-fill", label)[0].innerText.replaceAll("\n", "")

            this.#counts.set(answer_text, counter)
            this.#radios.set(radio, answer_text)
        }

        html_element.addEventListener('change', this.changeHandler, false)
        let cancel = $(".qtype_multichoice_clearchoice > a")[0]
        cancel.addEventListener('click', this.cancelHandler, false)
    }

    changeHandler(e: Event) {
        let data = {}
        data[this.text] = this.#radios.get(e.target as HTMLDivElement)
        send_gather_form(data)
    }
    cancelHandler() {
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

function get_question_text(question, encode = false) {
    let result = question.getElementsByClassName("qtext")[0].innerText
    result = result.replaceAll("\n", "")
    if (encode) { encodeURI(result); }
    return result
}

function get_answer_text(label, encode = false) {
    let result = label.getElementsByClassName("flex-fill")[0].innerText
    result = result.replaceAll("\n", "")
    if (encode) { encodeURI(result); }
    return result
}

function timer_setup() {
    var per_question = document.createElement("div")
    per_question.innerHTML = "Średnio na pytanie "
    per_question.id = "perquestion"
    var timer_per_question = document.createElement("span")
    timer_per_question.id = "timerperquestion"
    timer_per_question.style.fontWeight = 700;
    per_question.appendChild(timer_per_question)
    document.getElementsByClassName("othernav")[0].appendChild(per_question)

    var old_update = M.mod_quiz.timer.update
    var per_question_update = function () {
        var time_s = (M.mod_quiz.timer.endtime - new Date().getTime()) / 1000

        var not_answered_len = document.getElementsByClassName("qnbutton notyetanswered").length

        if (not_answered_len == 0) {
            return
        }

        var t_per_question = time_s / not_answered_len

        var m = parseInt(t_per_question / 60)
        var s = (t_per_question % 60).toFixed(3).toString().split(".")

        var t_per_question_str = m.toString() + ":" + s[0].padStart(2, "0") + "." + s[1]

        timer_per_question.innerHTML = t_per_question_str
    }
    let questions = $(".que")
    for (let q of questions) {
        q.count_spans = {}
        for (let label of q.getElementsByClassName("d-flex")) {
            let span = document.createElement("span")
            span.className = "answercounter"
            span.innerHTML = "0"
            label.appendChild(span)

            let answer_text = get_answer_text(label, false)
            q.count_spans[answer_text] = span
        }

    }
    var next_check = Date.now()

    var update_answers = function () {
        if (next_check > Date.now()) {
            return
        }
        next_check += answer_check_duration
        for (let question of questions) {
            let q = get_question_text(question, false)
            let url = `${base_url}/get-answers?cmid=${cmid}&question=${q}&attempt=${attempt}`

            $.getJSON(url, function (result) {
                for (let [value, count] of Object.entries(result)) {
                    try {
                        question.count_spans[value].innerHTML = count
                    } catch {
                        console.error("no '" + value + "' in questions")
                    }
                }
            })
        }
    }

    M.mod_quiz.timer.update = function () {
        old_update()
        per_question_update()
        update_answers()
    }
}

function send_answer(e) {
    let data = {}
    let q = $(e.srcElement).closest(".que")
    let question_text = get_question_text(q[0])

    let checked_label = $(e.srcElement).siblings("label")[0]
    let answer_text = get_answer_text(checked_label)
    data[question_text] = answer_text

    send_gather_form(data)
}

function clear_answer(e) {
    let data = {}
    let q = $(e.srcElement).closest(".que")
    let question_text = get_question_text(q[0])

    data[question_text] = ""

    send_gather_form(data)
}

function send_gather_form(data) {
    $.ajax({
        url: `${base_url}/gather-form?cmid=${cmid}&attempt=${attempt}`,
        type: 'post',
        data: JSON.stringify(data),
        contentType: "application/json",
        dataType: "json",
    });
}

function form_gatherer_setup() {
    let form = document.forms["responseform"]
    form.addEventListener('change', send_answer, false)
    let cancel = $(".qtype_multichoice_clearchoice > a")[0]
    cancel.addEventListener('click', clear_answer, false)
};

(function () {
    'use strict';

    form_gatherer_setup()
    Y.on('domready', function () {
        timer_setup()
    });

})();