// ==UserScript==
// @name        moodle-utils
// @description Displays time per question left
// @namespace   https://github.com/Ogurczak
// @require     https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @require     http://code.jquery.com/jquery-3.4.1.min.js
// @match       https://*/mod/quiz/attempt*
// @match       https://*/mod/quiz*
// @match       https://github.com/Ogurczak/moodle-utils*
// @match       https://*.moodlecloud.com/*
// @version     0.7.2
// @homepage    https://github.com/Ogurczak/moodle-utils
// @author      Ogurczak
// @license     MIT
// @grant       GM_getValue
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// ==/UserScript==

/*
MIT License

Copyright (c) 2020 cvzi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

(function () {
    'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    function __classPrivateFieldGet(receiver, state, kind, f) {
      if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
      return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    }
    function __classPrivateFieldSet(receiver, state, value, kind, f) {
      if (kind === "m") throw new TypeError("Private method is not writable");
      if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
      return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
    }

    var _Connection_instances, _Connection_serverAddress, _Connection_cmid, _Connection_attemptId, _Connection_urlId_get, _Connection_endpointUrl;
    class Connection {
        constructor(serverAddress, cmid, attemptId) {
            _Connection_instances.add(this);
            _Connection_serverAddress.set(this, void 0);
            _Connection_cmid.set(this, void 0);
            _Connection_attemptId.set(this, void 0);
            this.onFail = () => { };
            this.onSuccess = () => { };
            __classPrivateFieldSet(this, _Connection_serverAddress, serverAddress, "f");
            __classPrivateFieldSet(this, _Connection_cmid, cmid, "f");
            __classPrivateFieldSet(this, _Connection_attemptId, attemptId, "f");
        }
        static fromQuizURL(serverAddress, quizUrl) {
            const parsedUrl = new URL(quizUrl);
            const cmid = parsedUrl.searchParams.get("cmid");
            const attempt = parsedUrl.searchParams.get("attempt");
            if (cmid === null) {
                throw new Error("required 'cmid' query not found in url");
            }
            else if (attempt === null) {
                throw new Error("required 'attempt' query not found in url");
            }
            return new Connection(serverAddress, cmid, attempt);
        }
        postAnswers(data) {
            return $.ajax({
                url: __classPrivateFieldGet(this, _Connection_instances, "m", _Connection_endpointUrl).call(this, "gather-form"),
                type: 'post',
                data: JSON.stringify(data),
                contentType: "application/json",
                dataType: "json",
            }).fail(this.onFail).done(this.onSuccess);
        }
        getAnswers(callback, ...questions) {
            let url = __classPrivateFieldGet(this, _Connection_instances, "m", _Connection_endpointUrl).call(this, "get-answers");
            for (let q of questions) {
                url += `&q=${encodeURIComponent(q.text)}`;
            }
            return $.getJSON(url, callback).fail(this.onFail).done(this.onSuccess);
        }
    }
    _Connection_serverAddress = new WeakMap(), _Connection_cmid = new WeakMap(), _Connection_attemptId = new WeakMap(), _Connection_instances = new WeakSet(), _Connection_urlId_get = function _Connection_urlId_get() {
        return `cmid=${__classPrivateFieldGet(this, _Connection_cmid, "f")}&attempt=${__classPrivateFieldGet(this, _Connection_attemptId, "f")}`;
    }, _Connection_endpointUrl = function _Connection_endpointUrl(endpointName) {
        return `${__classPrivateFieldGet(this, _Connection_serverAddress, "f")}/${endpointName}?${__classPrivateFieldGet(this, _Connection_instances, "a", _Connection_urlId_get)}`;
    };

    function MoodleUtilsElem(str) {
        return $(str).addClass("moodleutils");
    }

    var _ImprovedTimer_instances, _ImprovedTimer_moodleTimer, _ImprovedTimer_timer, _ImprovedTimer_perQuestionUpdate;
    class ImprovedTimer {
        constructor(moodleTimer) {
            _ImprovedTimer_instances.add(this);
            _ImprovedTimer_moodleTimer.set(this, void 0);
            _ImprovedTimer_timer.set(this, void 0);
            let perQuestion = MoodleUtilsElem("<div>").addClass("perquestion")
                .text("Średnio na pytanie ").appendTo(".othernav");
            let timer = MoodleUtilsElem("<span>").addClass("timerperquestion")
                .appendTo(perQuestion);
            __classPrivateFieldSet(this, _ImprovedTimer_timer, timer[0], "f");
            __classPrivateFieldSet(this, _ImprovedTimer_moodleTimer, moodleTimer, "f");
            let orgUpdate = moodleTimer.update;
            moodleTimer.update = () => {
                orgUpdate();
                __classPrivateFieldGet(this, _ImprovedTimer_instances, "m", _ImprovedTimer_perQuestionUpdate).call(this);
            };
        }
    }
    _ImprovedTimer_moodleTimer = new WeakMap(), _ImprovedTimer_timer = new WeakMap(), _ImprovedTimer_instances = new WeakSet(), _ImprovedTimer_perQuestionUpdate = function _ImprovedTimer_perQuestionUpdate() {
        let notAnsweredLen = $(".qnbutton.notyetanswered").length;
        if (notAnsweredLen == 0) {
            return;
        }
        let timeS = (__classPrivateFieldGet(this, _ImprovedTimer_moodleTimer, "f").endtime - new Date().getTime()) / 1000;
        let tPerQuestion = timeS / notAnsweredLen;
        let m = Math.floor(tPerQuestion / 60);
        let [s, ms] = (tPerQuestion % 60).toFixed(3).split(".");
        let tPerQuestionStr = `${m}:${s.padStart(2, "0")}.${ms}`;
        __classPrivateFieldGet(this, _ImprovedTimer_timer, "f").innerHTML = tPerQuestionStr;
    };

    var _MoodleUtilsConfig_config;
    class MoodleUtilsConfig {
        constructor() {
            _MoodleUtilsConfig_config.set(this, void 0);
            __classPrivateFieldSet(this, _MoodleUtilsConfig_config, new MonkeyConfig({
                title: 'Moodle Utils Configuration',
                menuCommand: true,
                params: {
                    serverAddress: {
                        type: 'text',
                        default: ""
                    }
                }
            }), "f");
        }
        get serverAddress() {
            return __classPrivateFieldGet(this, _MoodleUtilsConfig_config, "f").get('serverAddress');
        }
    }
    _MoodleUtilsConfig_config = new WeakMap();

    var _OnHTMLElement_html;
    class OnHTMLElement {
        constructor(htmlElement) {
            _OnHTMLElement_html.set(this, void 0);
            __classPrivateFieldSet(this, _OnHTMLElement_html, htmlElement, "f");
        }
        get html() {
            return __classPrivateFieldGet(this, _OnHTMLElement_html, "f");
        }
    }
    _OnHTMLElement_html = new WeakMap();
    OnHTMLElement.ConstructionError = class extends Error {
        constructor(htmlElement, message) {
            super(`#${htmlElement.id} construction: ${message}`);
            this.htmlElement = htmlElement;
        }
    };

    var _Question_text;
    class Question extends OnHTMLElement {
        constructor(htmlElement, connection) {
            super(htmlElement);
            _Question_text.set(this, void 0);
            __classPrivateFieldSet(this, _Question_text, Question.extractText(htmlElement), "f");
            this.connection = connection;
        }
        static extractText(htmlElement) {
            return $(".qtext", htmlElement).text();
        }
        get text() { return __classPrivateFieldGet(this, _Question_text, "f"); }
    }
    _Question_text = new WeakMap();

    var _Option_originalText, _Option_value, _GapSelectPlace_instances, _a, _GapSelectPlace_nameValidator, _GapSelectPlace_isName, _GapSelectPlace_options, _GapSelectPlace_name, _GapSelectPlace_addOption, _GapSelectPlace_onChange, _QuestionGapSelect_instances, _QuestionGapSelect_places, _QuestionGapSelect_addPlace;
    class Option extends OnHTMLElement {
        constructor(parent, htmlElement) {
            super(htmlElement);
            _Option_originalText.set(this, void 0);
            _Option_value.set(this, void 0);
            this.parent = parent;
            __classPrivateFieldSet(this, _Option_originalText, htmlElement.innerText, "f");
            const value = htmlElement.getAttribute("value");
            if (value == null)
                throw new OnHTMLElement.ConstructionError(htmlElement, "Option: no value attribute");
            __classPrivateFieldSet(this, _Option_value, value, "f");
            this.setCount("0");
        }
        setCount(count) {
            this.html.innerText = `${__classPrivateFieldGet(this, _Option_originalText, "f")} (${count})`;
        }
        get originalText() { return __classPrivateFieldGet(this, _Option_originalText, "f"); }
        get value() { return __classPrivateFieldGet(this, _Option_value, "f"); }
        get select() { return this.parent; }
    }
    _Option_originalText = new WeakMap(), _Option_value = new WeakMap();
    class GapSelectPlace extends OnHTMLElement {
        constructor(parent, htmlElement) {
            super(htmlElement);
            _GapSelectPlace_instances.add(this);
            _GapSelectPlace_options.set(this, new Map());
            _GapSelectPlace_name.set(this, void 0);
            this.parent = parent;
            $("option[value]", htmlElement).not("[value='']")
                .each((_, o) => { __classPrivateFieldGet(this, _GapSelectPlace_instances, "m", _GapSelectPlace_addOption).call(this, o); });
            let name = null;
            htmlElement.classList.forEach(n => {
                if (__classPrivateFieldGet(GapSelectPlace, _a, "m", _GapSelectPlace_isName).call(GapSelectPlace, n)) {
                    name = n;
                }
            });
            if (name === null) {
                const matcher = __classPrivateFieldGet(GapSelectPlace, _a, "f", _GapSelectPlace_nameValidator).source;
                throw new OnHTMLElement.ConstructionError(htmlElement, `GapSelectPlace: no name (class matching ${matcher})`);
            }
            __classPrivateFieldSet(this, _GapSelectPlace_name, name, "f");
            $(htmlElement).on("change", __classPrivateFieldGet(this, _GapSelectPlace_instances, "m", _GapSelectPlace_onChange));
        }
        update(data) {
            for (const [optionName, option] of __classPrivateFieldGet(this, _GapSelectPlace_options, "f")) {
                option.setCount(data[optionName] || "0");
            }
        }
        get name() { return __classPrivateFieldGet(this, _GapSelectPlace_name, "f"); }
        get question() { return this.parent; }
        get selected() {
            const selected = this.html.selectedOptions;
            if (selected.length == 0)
                return null;
            else
                return __classPrivateFieldGet(this, _GapSelectPlace_options, "f").get(selected[0].value) || null;
        }
    }
    _a = GapSelectPlace, _GapSelectPlace_options = new WeakMap(), _GapSelectPlace_name = new WeakMap(), _GapSelectPlace_instances = new WeakSet(), _GapSelectPlace_isName = function _GapSelectPlace_isName(str) {
        return __classPrivateFieldGet(GapSelectPlace, _a, "f", _GapSelectPlace_nameValidator).test(str);
    }, _GapSelectPlace_addOption = function _GapSelectPlace_addOption(htmlElement) {
        const option = new Option(this, htmlElement);
        __classPrivateFieldGet(this, _GapSelectPlace_options, "f").set(option.value, option);
        return option;
    }, _GapSelectPlace_onChange = function _GapSelectPlace_onChange(e) {
        const answers = [];
        const selected = this.selected;
        if (selected !== null)
            answers.push(selected.value);
        this.parent.connection.postAnswers({
            [this.parent.text]: {
                [__classPrivateFieldGet(this, _GapSelectPlace_name, "f")]: answers
            }
        });
    };
    _GapSelectPlace_nameValidator = { value: /^place\d+$/ };
    class QuestionGapSelect extends Question {
        constructor(htmlElement, connection) {
            super(htmlElement, connection);
            _QuestionGapSelect_instances.add(this);
            _QuestionGapSelect_places.set(this, new Map());
            $("select", htmlElement)
                .each((_, p) => { __classPrivateFieldGet(this, _QuestionGapSelect_instances, "m", _QuestionGapSelect_addPlace).call(this, p); });
        }
        static extractText(htmlElement) {
            return $(".qtext", htmlElement).clone().find(".control").remove().end().text();
        }
        update(data) {
            for (const [placeText, place] of __classPrivateFieldGet(this, _QuestionGapSelect_places, "f")) {
                place.update(data[placeText]);
            }
        }
    }
    _QuestionGapSelect_places = new WeakMap(), _QuestionGapSelect_instances = new WeakSet(), _QuestionGapSelect_addPlace = function _QuestionGapSelect_addPlace(htmlElement) {
        const place = new GapSelectPlace(this, htmlElement);
        __classPrivateFieldGet(this, _QuestionGapSelect_places, "f").set(place.name, place);
        return place;
    };

    var _QuestionMultichoice_instances, _QuestionMultichoice_counts, _QuestionMultichoice_inputs, _QuestionMultichoice_onChangeMultichoice, _QuestionMultichoice_onChangeRadio, _QuestionMultichoice_onCancel;
    class QuestionMultichoice extends Question {
        constructor(htmlElement, connection) {
            super(htmlElement, connection);
            _QuestionMultichoice_instances.add(this);
            _QuestionMultichoice_counts.set(this, new Map());
            _QuestionMultichoice_inputs.set(this, new Map());
            for (let input of $("[value!=-1]:radio, :checkbox", htmlElement)) {
                let label = $("~ .d-flex", input);
                let counter = MoodleUtilsElem("<span>").addClass("answercounter").text(0).appendTo(label)[0];
                let answerText = $("div.flex-fill", label).text();
                __classPrivateFieldGet(this, _QuestionMultichoice_counts, "f").set(answerText, counter);
                __classPrivateFieldGet(this, _QuestionMultichoice_inputs, "f").set(input, answerText);
            }
            let cancel = $(".qtype_multichoice_clearchoice a", htmlElement)[0];
            // no cancel in multichoice with multiple answers
            if (cancel) {
                $(htmlElement).on('change', __classPrivateFieldGet(this, _QuestionMultichoice_instances, "m", _QuestionMultichoice_onChangeRadio));
                $(cancel).on('click', __classPrivateFieldGet(this, _QuestionMultichoice_instances, "m", _QuestionMultichoice_onCancel));
                $("[value!=-1]:radio:checked", htmlElement).trigger('change'); // send initial value
            }
            else {
                $(htmlElement).on('change', __classPrivateFieldGet(this, _QuestionMultichoice_instances, "m", _QuestionMultichoice_onChangeMultichoice));
                $(":checkbox:checked", htmlElement).trigger('change'); // send initial value
            }
        }
        update(data) {
            for (let [answerText, counter] of __classPrivateFieldGet(this, _QuestionMultichoice_counts, "f")) {
                let count = data[answerText] || "0";
                counter.innerText = count;
            }
        }
    }
    _QuestionMultichoice_counts = new WeakMap(), _QuestionMultichoice_inputs = new WeakMap(), _QuestionMultichoice_instances = new WeakSet(), _QuestionMultichoice_onChangeMultichoice = function _QuestionMultichoice_onChangeMultichoice() {
        let data = {};
        let dataChecked = data[this.text] = [];
        for (let checked of $(":checkbox:checked", this.html)) {
            dataChecked.push(__classPrivateFieldGet(this, _QuestionMultichoice_inputs, "f").get(checked));
        }
        this.connection.postAnswers(data);
    }, _QuestionMultichoice_onChangeRadio = function _QuestionMultichoice_onChangeRadio(e) {
        let data = {};
        data[this.text] = [__classPrivateFieldGet(this, _QuestionMultichoice_inputs, "f").get(e.target)];
        this.connection.postAnswers(data);
    }, _QuestionMultichoice_onCancel = function _QuestionMultichoice_onCancel() {
        let data = {};
        data[this.text] = [];
        this.connection.postAnswers(data);
    };

    var _QuestionShortAnswer_instances, _QuestionShortAnswer_top, _QuestionShortAnswer_onChange;
    class QuestionShortAnswer extends Question {
        constructor(htmlElement, connection) {
            super(htmlElement, connection);
            _QuestionShortAnswer_instances.add(this);
            _QuestionShortAnswer_top.set(this, void 0);
            let formulation = $(".formulation", htmlElement);
            let top = MoodleUtilsElem('<div>').addClass("topanswers")
                .appendTo(formulation);
            __classPrivateFieldSet(this, _QuestionShortAnswer_top, top[0], "f");
            MoodleUtilsElem('<div>').addClass("topshortanswerslabel")
                .text("Najliczniejsze odpowiedzi:").appendTo(top);
            for (let i = 0; i < 5; i++) {
                let a = MoodleUtilsElem('<div>').addClass("topshortanswer").appendTo(top);
                MoodleUtilsElem('<div>').addClass("topshortanswercontent").appendTo(a);
                MoodleUtilsElem('<div>').addClass("answercounter").appendTo(a);
            }
            $(htmlElement).on('change', __classPrivateFieldGet(this, _QuestionShortAnswer_instances, "m", _QuestionShortAnswer_onChange));
            $(":text", htmlElement).on('keypress', e => {
                if (e.key == "Enter")
                    __classPrivateFieldGet(this, _QuestionShortAnswer_instances, "m", _QuestionShortAnswer_onChange).call(this, e);
            });
            $(":text", htmlElement).trigger('change'); // send initial value
        }
        update(data) {
            let sorted = Object.entries(data).sort((a, b) => parseInt(b[1]) - parseInt(a[1]));
            let el = $(__classPrivateFieldGet(this, _QuestionShortAnswer_top, "f")).children(".topshortanswer").first();
            for (let [answerText, count] of sorted) {
                if (el.length == 0) {
                    break;
                }
                el.children(".topshortanswercontent").text(answerText);
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
    _QuestionShortAnswer_top = new WeakMap(), _QuestionShortAnswer_instances = new WeakSet(), _QuestionShortAnswer_onChange = function _QuestionShortAnswer_onChange(e) {
        let data = {};
        let answer = e.target.value.trim();
        data[this.text] = answer == "" ? [] : [answer];
        this.connection.postAnswers(data);
    };

    var _QuestionTrueFalse_instances, _QuestionTrueFalse_trueCount, _QuestionTrueFalse_falseCount, _QuestionTrueFalse_onChange;
    class QuestionTrueFalse extends Question {
        constructor(htmlElement, connection) {
            super(htmlElement, connection);
            _QuestionTrueFalse_instances.add(this);
            _QuestionTrueFalse_trueCount.set(this, void 0);
            _QuestionTrueFalse_falseCount.set(this, void 0);
            let trueCount = null;
            let falseCount = null;
            for (let input of $(":radio", htmlElement)) {
                let counter = MoodleUtilsElem("<span>").addClass("answercounter")
                    .text(0).appendTo(input.parentElement)[0];
                switch (input.value) {
                    case "0":
                        falseCount = counter;
                        break;
                    case "1":
                        trueCount = counter;
                        break;
                }
            }
            if (trueCount === null || falseCount === null) {
                throw new OnHTMLElement.ConstructionError(htmlElement, "TrueFalse: no have true and/or false radio");
            }
            __classPrivateFieldSet(this, _QuestionTrueFalse_trueCount, trueCount, "f");
            __classPrivateFieldSet(this, _QuestionTrueFalse_falseCount, falseCount, "f");
            $(htmlElement).on('change', __classPrivateFieldGet(this, _QuestionTrueFalse_instances, "m", _QuestionTrueFalse_onChange));
            $(":radio:checked", htmlElement).trigger('change'); // send initial value
        }
        update(data) {
            __classPrivateFieldGet(this, _QuestionTrueFalse_trueCount, "f").innerText = data["1"] || "0";
            __classPrivateFieldGet(this, _QuestionTrueFalse_falseCount, "f").innerText = data["0"] || "0";
        }
    }
    _QuestionTrueFalse_trueCount = new WeakMap(), _QuestionTrueFalse_falseCount = new WeakMap(), _QuestionTrueFalse_instances = new WeakSet(), _QuestionTrueFalse_onChange = function _QuestionTrueFalse_onChange(e) {
        let data = {};
        data[this.text] = [e.target.value];
        this.connection.postAnswers(data);
    };

    var _QuestionMap_instances, _QuestionMap_create;
    class QuestionMap extends Map {
        constructor(root, connection) {
            super();
            _QuestionMap_instances.add(this);
            $(".que", root)
                .map((_, q) => __classPrivateFieldGet(this, _QuestionMap_instances, "m", _QuestionMap_create).call(this, q, connection))
                .each((_, q) => { this.set(q.text, q); });
            this.connection = connection;
        }
        updateAll() {
            this.connection.getAnswers(data => {
                for (let [qtext, qdata] of Object.entries(data)) {
                    let q = this.get(qtext);
                    if (q !== undefined)
                        try {
                            q.update(qdata);
                        }
                        catch (error) {
                            console.error(`error updating question '${qtext}': ${error}`);
                        }
                    else
                        console.error(`no question '${qtext}' on current page`);
                }
            }, ...this.values());
        }
    }
    _QuestionMap_instances = new WeakSet(), _QuestionMap_create = function _QuestionMap_create(htmlElement, connection) {
        const classes = htmlElement.classList;
        if ("multichoice" in classes) {
            return new QuestionMultichoice(htmlElement, connection);
        }
        else if ("truefalse" in classes) {
            return new QuestionTrueFalse(htmlElement, connection);
        }
        else if ("shortanswer" in classes) {
            return new QuestionShortAnswer(htmlElement, connection);
        }
        else if ("gapselect" in classes) {
            return new QuestionGapSelect(htmlElement, connection);
        }
        return null;
    };

    var _ServerStatusBar_element, _ServerStatusBar_status;
    class ServerStatusBar {
        constructor(parent) {
            _ServerStatusBar_element.set(this, void 0);
            _ServerStatusBar_status.set(this, "unknown");
            __classPrivateFieldSet(this, _ServerStatusBar_element, MoodleUtilsElem('<div>')
                .text("Moodle Utils server status: ")
                .addClass("status unknown"), "f");
            __classPrivateFieldGet(this, _ServerStatusBar_element, "f").appendTo(parent);
        }
        set status(newStatus) {
            __classPrivateFieldGet(this, _ServerStatusBar_element, "f").removeClass(this.status);
            __classPrivateFieldGet(this, _ServerStatusBar_element, "f").addClass(newStatus);
            __classPrivateFieldSet(this, _ServerStatusBar_status, newStatus, "f");
        }
        get status() {
            return __classPrivateFieldGet(this, _ServerStatusBar_status, "f");
        }
    }
    _ServerStatusBar_element = new WeakMap(), _ServerStatusBar_status = new WeakMap();

    var e = [],
        t = [];

    function n(n, r) {
      if (n && "undefined" != typeof document) {
        var a,
            s = !0 === r.prepend ? "prepend" : "append",
            d = !0 === r.singleTag,
            i = "string" == typeof r.container ? document.querySelector(r.container) : document.getElementsByTagName("head")[0];

        if (d) {
          var u = e.indexOf(i);
          -1 === u && (u = e.push(i) - 1, t[u] = {}), a = t[u] && t[u][s] ? t[u][s] : t[u][s] = c();
        } else a = c();

        65279 === n.charCodeAt(0) && (n = n.substring(1)), a.styleSheet ? a.styleSheet.cssText += n : a.appendChild(document.createTextNode(n));
      }

      function c() {
        var e = document.createElement("style");
        if (e.setAttribute("type", "text/css"), r.attributes) for (var t = Object.keys(r.attributes), n = 0; n < t.length; n++) e.setAttribute(t[n], r.attributes[t[n]]);
        var a = "prepend" === s ? "afterbegin" : "beforeend";
        return i.insertAdjacentElement(a, e), e;
      }
    }

    var css = ".moodleutils {\n    color: grey\n}\n\n/* ANSWERS */\n\n.moodleutils .answercounter {\n    float: right;\n}\n\n.moodleutils .topshortanswers {\n    display: flex;\n    flex-direction: column;\n    flex-wrap: nowrap;\n}\n\n.moodleutils .topshortanswer {\n    display: flex;\n    flex-direction: row;\n    flex-wrap: nowrap;\n}\n\n.moodleutils .topshortanswercontent {\n    width: -webkit-fill-available;\n}\n\n/* TIMER */\n\n.moodleutils .perquestion {\n    color: black\n}\n\n.moodleutils .timerperquestion {\n    font-weight: 700;\n    color: black\n}\n\n/* SERVER STATUS */\n\n.moodleutils .status::after {\n    content: \"???\";\n    float: right;\n}\n\n.moodleutils .status .unknown::after {\n    content: \"???\";\n    float: right;\n}\n\n.moodleutils .status .ok::after {\n    content: \"OK\";\n    color: hsla(120, 100%, 41%, 0.75);\n}\n\n.moodleutils .status .failed::after {\n    content: \"FAILED\";\n    color: hsla(0, 100%, 54%, 0.75);\n}";
    n(css,{});

    (function () {
        const cfg = new MoodleUtilsConfig();
        // enable only on quizes
        // on the rest of matches enable just the configuration
        // (could do this using @include UserScript param, but
        // this is said to be faster)
        const enableRegex = /^https:\/\/.*\/mod\/quiz\/attempt.*$/;
        if (!enableRegex.test(window.location.href))
            return;
        Y.on("domready", function () {
            // add timer
            if ($(".qnbutton.notyetanswered").length != 0
                && M.mod_quiz.timer.endtime != 0)
                new ImprovedTimer(M.mod_quiz.timer);
            // return if no server address
            if (cfg.serverAddress == "")
                return;
            // add status bar
            const serverStatusBar = new ServerStatusBar($("#mod_quiz_navblock > .card-body"));
            // create connection to server
            const conn = Connection.fromQuizURL(cfg.serverAddress, window.location.href);
            conn.onFail = () => serverStatusBar.status = "failed";
            conn.onSuccess = () => serverStatusBar.status = "ok";
            // create current page's question map
            const qmap = new QuestionMap(document.body, conn);
            // refresh question map every second
            if (qmap.size != 0) {
                window.setInterval(() => qmap.updateAll, 1000);
            }
        });
    })();

})();
//# sourceMappingURL=bundle.user.js.map
