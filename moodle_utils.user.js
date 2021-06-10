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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
(function () {
    'use strict';
    var _Question_html, _Question_text, _QuestionMultichoice_counts, _QuestionMultichoice_inputs, _ImprovedTimer_org_update, _ImprovedTimer_moodle_timer, _ImprovedTimer_timer_per_question;
    const win_url = new URL(window.location.href);
    const cmid = win_url.searchParams.get("cmid");
    const attempt = win_url.searchParams.get("attempt");
    const base_url = "https://ogurczak.ddns.net:8080";
    const url_id = `cmid=${cmid}&attempt=${attempt}`;
    function send_gather_form(data) {
        $.ajax({
            url: `${base_url}/gather-form?${url_id}`,
            type: 'post',
            data: JSON.stringify(data),
            contentType: "application/json",
            dataType: "json",
        });
    }
    function get_answers(qmap, ...questions) {
        if (questions.length == 0) {
            questions = [...qmap.values()];
        }
        let url = `${base_url}/get-answers?${url_id}`;
        for (let q of questions) {
            url += `&q=${q.text}`;
        }
        $.getJSON(url, function (data) {
            for (let [qtext, qdata] of Object.entries(data)) {
                let q = qmap.get(qtext);
                q.update_counters(qdata);
            }
        });
    }
    class Question {
        constructor(html_element) {
            _Question_html.set(this, void 0);
            _Question_text.set(this, void 0);
            __classPrivateFieldSet(this, _Question_html, html_element, "f");
            __classPrivateFieldSet(this, _Question_text, $(".qtext", html_element)[0].innerText.replaceAll("\n", ""), "f");
        }
        get text() { return __classPrivateFieldGet(this, _Question_text, "f"); }
        get html() { return __classPrivateFieldGet(this, _Question_html, "f"); }
    }
    _Question_html = new WeakMap(), _Question_text = new WeakMap();
    class QuestionMultichoice extends Question {
        constructor(html_element) {
            super(html_element);
            _QuestionMultichoice_counts.set(this, new Map());
            _QuestionMultichoice_inputs.set(this, new Map());
            for (let input of $("[value!=-1]:radio, :checkbox", html_element)) {
                let label = $("~ .d-flex", input)[0];
                let counter = document.createElement("span");
                counter.className = "answercounter";
                counter.innerHTML = "0";
                label.appendChild(counter);
                let answer_text = $("div.flex-fill", label)[0].innerText.replaceAll("\n", "");
                __classPrivateFieldGet(this, _QuestionMultichoice_counts, "f").set(answer_text, counter);
                __classPrivateFieldGet(this, _QuestionMultichoice_inputs, "f").set(input, answer_text);
            }
            let cancel = $(".qtype_multichoice_clearchoice a", html_element)[0];
            if (cancel) {
                // no cancel in multichoice with multiple answers
                html_element.addEventListener('change', (this.changeHandlerRadio).bind(this), false);
                cancel.addEventListener('click', (this.cancelHandler).bind(this), false);
            }
            else {
                html_element.addEventListener('change', (this.changeHandlerMultichoice).bind(this), false);
            }
        }
        changeHandlerMultichoice() {
            let data = {};
            let data_checked = data[this.text] = [];
            for (let checked of $("input[value!=-1]:checked", this.html)) {
                data_checked.push(__classPrivateFieldGet(this, _QuestionMultichoice_inputs, "f").get(checked));
            }
            send_gather_form(data);
        }
        changeHandlerRadio(e) {
            let data = {};
            data[this.text] = [__classPrivateFieldGet(this, _QuestionMultichoice_inputs, "f").get(e.target)];
            send_gather_form(data);
        }
        cancelHandler() {
            let data = {};
            data[this.text] = [];
            send_gather_form(data);
        }
        update_counters(data) {
            for (let [answer_text, count] of Object.entries(data)) {
                __classPrivateFieldGet(this, _QuestionMultichoice_counts, "f").get(answer_text).innerText = count;
            }
        }
    }
    _QuestionMultichoice_counts = new WeakMap(), _QuestionMultichoice_inputs = new WeakMap();
    class ImprovedTimer {
        constructor(moodle_timer, answer_check_duration = 1000) {
            _ImprovedTimer_org_update.set(this, void 0);
            _ImprovedTimer_moodle_timer.set(this, void 0);
            _ImprovedTimer_timer_per_question.set(this, void 0);
            let per_question = document.createElement("div");
            per_question.innerHTML = "Średnio na pytanie ";
            per_question.id = "perquestion";
            __classPrivateFieldSet(this, _ImprovedTimer_timer_per_question, document.createElement("span"), "f");
            __classPrivateFieldGet(this, _ImprovedTimer_timer_per_question, "f").id = "timerperquestion";
            __classPrivateFieldGet(this, _ImprovedTimer_timer_per_question, "f").style.fontWeight = "700";
            per_question.appendChild(__classPrivateFieldGet(this, _ImprovedTimer_timer_per_question, "f"));
            $(".othernav")[0].appendChild(per_question);
            __classPrivateFieldSet(this, _ImprovedTimer_moodle_timer, moodle_timer, "f");
            __classPrivateFieldSet(this, _ImprovedTimer_org_update, moodle_timer.update, "f");
            moodle_timer.update = (this.update).bind(this);
        }
        per_question_update() {
            let not_answered_len = $(".qnbutton.notyetanswered").length;
            if (not_answered_len == 0) {
                return;
            }
            let time_s = (__classPrivateFieldGet(this, _ImprovedTimer_moodle_timer, "f").endtime - new Date().getTime()) / 1000;
            let t_per_question = time_s / not_answered_len;
            let m = Math.floor(t_per_question / 60);
            let [s, ms] = (t_per_question % 60).toFixed(3).split(".");
            let t_per_question_str = `${m}:${s.padStart(2, "0")}.${ms}`;
            __classPrivateFieldGet(this, _ImprovedTimer_timer_per_question, "f").innerHTML = t_per_question_str;
        }
        update() {
            __classPrivateFieldGet(this, _ImprovedTimer_org_update, "f").call(this);
            this.per_question_update();
        }
    }
    _ImprovedTimer_org_update = new WeakMap(), _ImprovedTimer_moodle_timer = new WeakMap(), _ImprovedTimer_timer_per_question = new WeakMap();
    Y.on("domready", function () {
        new ImprovedTimer(M.mod_quiz.timer);
        var qmap = new Map();
        for (let q of $(".que")) {
            if ($(q).hasClass("multichoice")) {
                let que = new QuestionMultichoice(q);
                qmap.set(que.text, que);
            }
        }
        window.setInterval(get_answers, 1000, qmap);
    });
})();
