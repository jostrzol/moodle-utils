// ==UserScript==
// @name            Moodle Utils
// @author          Ogurczak
// @description     Displays time per question left
// @version         0.7.2
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
// @resource        css https://raw.githubusercontent.com/Ogurczak/moodle-utils/develop/client/style.css
// @require         https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @require         http://code.jquery.com/jquery-3.4.1.min.js
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
    var _Question_html, _Question_text, _QuestionMultichoice_counts, _QuestionMultichoice_inputs, _QuestionTrueFalse_true_count, _QuestionTrueFalse_false_count, _QuestionShortAnswer_top, _ImprovedTimer_moodle_timer, _ImprovedTimer_timer;
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
    const win_url = new URL(window.location.href);
    const cmid = win_url.searchParams.get("cmid");
    const attempt = win_url.searchParams.get("attempt");
    const base_url = cfg.get("server_address");
    const url_id = `cmid=${cmid}&attempt=${attempt}`;
    function create(str) {
        return $(str).addClass("moodleutils");
    }
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
            url += `&q=${encodeURIComponent(q.text)}`;
        }
        $.getJSON(url, function (data) {
            for (let [qtext, qdata] of Object.entries(data)) {
                let q = qmap.get(qtext);
                q.update(qdata);
            }
        });
    }
    function add_style() {
        GM_addStyle(GM_getResourceText('css'));
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
                let label = $("~ .d-flex", input);
                let counter = create("<span>").addClass("answercounter").text(0).appendTo(label)[0];
                let answer_text = $("div.flex-fill", label).text().replaceAll("\n", "");
                __classPrivateFieldGet(this, _QuestionMultichoice_counts, "f").set(answer_text, counter);
                __classPrivateFieldGet(this, _QuestionMultichoice_inputs, "f").set(input, answer_text);
            }
            let cancel = $(".qtype_multichoice_clearchoice a", html_element)[0];
            // no cancel in multichoice with multiple answers
            if (cancel) {
                $(html_element).on('change', (this.changeHandlerRadio).bind(this));
                $(cancel).on('click', (this.cancelHandler).bind(this));
                $("[value!=-1]:radio:checked", html_element).trigger('change'); // send initial value
            }
            else {
                $(html_element).on('change', (this.changeHandlerMultichoice).bind(this));
                $(":checkbox:checked", html_element).trigger('change'); // send initial value
            }
        }
        changeHandlerMultichoice() {
            let data = {};
            let data_checked = data[this.text] = [];
            for (let checked of $(":checkbox:checked", this.html)) {
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
        update(data) {
            for (let [answer_text, counter] of __classPrivateFieldGet(this, _QuestionMultichoice_counts, "f")) {
                let count = data[answer_text] || "0";
                counter.innerText = count;
            }
        }
    }
    _QuestionMultichoice_counts = new WeakMap(), _QuestionMultichoice_inputs = new WeakMap();
    class QuestionTrueFalse extends Question {
        constructor(html_element) {
            super(html_element);
            _QuestionTrueFalse_true_count.set(this, void 0);
            _QuestionTrueFalse_false_count.set(this, void 0);
            for (let input of $(":radio", html_element)) {
                let counter = create("<span>").addClass("answercounter")
                    .text(0).appendTo(input.parentElement)[0];
                switch (input.value) {
                    case "0":
                        __classPrivateFieldSet(this, _QuestionTrueFalse_false_count, counter, "f");
                        break;
                    case "1":
                        __classPrivateFieldSet(this, _QuestionTrueFalse_true_count, counter, "f");
                        break;
                }
            }
            $(html_element).on('change', (this.changeHandler).bind(this));
            $(":radio:checked", html_element).trigger('change'); // send initial value
        }
        changeHandler(e) {
            let data = {};
            data[this.text] = [e.target.value];
            send_gather_form(data);
        }
        update(data) {
            __classPrivateFieldGet(this, _QuestionTrueFalse_true_count, "f").innerText = data["1"] || "0";
            __classPrivateFieldGet(this, _QuestionTrueFalse_false_count, "f").innerText = data["0"] || "0";
        }
    }
    _QuestionTrueFalse_true_count = new WeakMap(), _QuestionTrueFalse_false_count = new WeakMap();
    class QuestionShortAnswer extends Question {
        constructor(html_element) {
            super(html_element);
            _QuestionShortAnswer_top.set(this, void 0);
            let formulation = $(".formulation", html_element);
            let top = $('<div>').addClass("topanswers moodleutils")
                .appendTo(formulation);
            __classPrivateFieldSet(this, _QuestionShortAnswer_top, top[0], "f");
            $('<div>').addClass("topshortanswerslabel moodleutils")
                .text("Najliczniejsze odpowiedzi:").appendTo(top);
            for (let i = 0; i < 5; i++) {
                let a = $('<div>').addClass("topshortanswer moodleutils").appendTo(top);
                $('<div>').addClass("topshortanswercontent moodleutils").appendTo(a);
                $('<div>').addClass("answercounter moodleutils").appendTo(a);
            }
            $(html_element).on('change', (this.changeHandler).bind(this));
            $(":text", html_element).on('keypress', function (e) {
                if (e.key == "Enter") {
                    this.changeHandler({ target: e.target });
                }
            }.bind(this));
            $(":text", html_element).trigger('change'); // send initial value
        }
        changeHandler(e) {
            let data = {};
            let answer = e.target.value.trim();
            data[this.text] = answer == "" ? [] : [answer];
            send_gather_form(data);
        }
        update(data) {
            let sorted = Object.entries(data).sort((a, b) => parseInt(b[1]) - parseInt(a[1]));
            let el = $(__classPrivateFieldGet(this, _QuestionShortAnswer_top, "f")).children(".topshortanswer").first();
            for (let [answer_text, count] of sorted) {
                if (el.length == 0) {
                    break;
                }
                el.children(".topshortanswercontent").text(answer_text);
                el.children(".answercounter").text(count);
                el = el.next();
            }
            while (el.length != 0) {
                el.children(".topshortanswercontent").text("");
                el.children(".answercounter").text("");
                el = el.next();
            }
        }
    }
    _QuestionShortAnswer_top = new WeakMap();
    class ImprovedTimer {
        constructor(moodle_timer) {
            _ImprovedTimer_moodle_timer.set(this, void 0);
            _ImprovedTimer_timer.set(this, void 0);
            let per_question = create("<div>").addClass("perquestion")
                .text("Średnio na pytanie ").appendTo(".othernav");
            let timer = create("<span>").addClass("timerperquestion")
                .appendTo(per_question);
            __classPrivateFieldSet(this, _ImprovedTimer_timer, timer[0], "f");
            __classPrivateFieldSet(this, _ImprovedTimer_moodle_timer, moodle_timer, "f");
            let org_update = moodle_timer.update;
            moodle_timer.update = function () {
                org_update();
                this.per_question_update();
            }.bind(this);
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
            __classPrivateFieldGet(this, _ImprovedTimer_timer, "f").innerHTML = t_per_question_str;
        }
    }
    _ImprovedTimer_moodle_timer = new WeakMap(), _ImprovedTimer_timer = new WeakMap();
    // enable only on quizes
    // on the rest of matches enable just the configuration
    const enable_regex = /^https:\/\/.*\/mod\/quiz\/attempt.*$/;
    if (!enable_regex.test(window.location.href))
        return;
    Y.on("domready", function () {
        var _a;
        add_style();
        if ($(".qnbutton.notyetanswered").length != 0 && ((_a = M.mod_quiz.timer) === null || _a === void 0 ? void 0 : _a.endtime) != 0) {
            new ImprovedTimer(M.mod_quiz.timer);
        }
        if (base_url == "") {
            return;
        }
        var qmap = new Map();
        for (let q of $(".que")) {
            let que = null;
            if ($(q).hasClass("multichoice")) {
                que = new QuestionMultichoice(q);
            }
            else if ($(q).hasClass("truefalse")) {
                que = new QuestionTrueFalse(q);
            }
            else if ($(q).hasClass("shortanswer")) {
                que = new QuestionShortAnswer(q);
            }
            if (que !== null) {
                qmap.set(que.text, que);
            }
        }
        if (qmap.size != 0) {
            window.setInterval(get_answers, 1000, qmap);
        }
    });
})();
