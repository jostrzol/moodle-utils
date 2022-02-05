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
// @version     0.7.3
// @homepage    https://github.com/Ogurczak/moodle-utils
// @author      Ogurczak
// @license     MIT
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addValueChangeListener
// @grant       GM_addStyle
// @grant       GM_registerMenuCommand
// ==/UserScript==

/*
MIT License

Copyright (c) 2022 Ogurczak

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
    class NoURLQueryError extends Error {
        constructor(queryName) {
            super(`required '${queryName}' query not found in url`);
            this.queryName = queryName;
        }
    }
    class Connection {
        constructor(serverAddress, cmid, attemptId) {
            _Connection_instances.add(this);
            _Connection_serverAddress.set(this, void 0);
            _Connection_cmid.set(this, void 0);
            _Connection_attemptId.set(this, void 0);
            this.onFail = () => { };
            this.onSuccess = () => { };
            // trim trailing slashes
            __classPrivateFieldSet(this, _Connection_serverAddress, serverAddress.replace(/\/+$/, ''), "f");
            __classPrivateFieldSet(this, _Connection_cmid, cmid, "f");
            __classPrivateFieldSet(this, _Connection_attemptId, attemptId, "f");
        }
        static fromQuizURL(serverAddress, quizUrl) {
            const parsedUrl = new URL(quizUrl);
            const cmid = parsedUrl.searchParams.get("cmid");
            const attempt = parsedUrl.searchParams.get("attempt");
            if (cmid === null) {
                throw new NoURLQueryError('cmid');
            }
            else if (attempt === null) {
                throw new NoURLQueryError('attempt');
            }
            return new Connection(serverAddress, cmid, attempt);
        }
        postAnswers(data) {
            return $.ajax({
                url: __classPrivateFieldGet(this, _Connection_instances, "m", _Connection_endpointUrl).call(this, "gather-form"),
                type: 'post',
                data: JSON.stringify(data),
                contentType: "application/json",
            }).fail(this.onFail).done(this.onSuccess);
        }
        getAnswers(callback, ...questions) {
            let url = __classPrivateFieldGet(this, _Connection_instances, "m", _Connection_endpointUrl).call(this, "get-answers");
            for (const q of questions) {
                url += `&q=${encodeURIComponent(q.questionText)}`;
            }
            return $.getJSON(url, callback).fail(this.onFail).done(this.onSuccess);
        }
        resetAnswers(...questions) {
            let url = __classPrivateFieldGet(this, _Connection_instances, "m", _Connection_endpointUrl).call(this, "reset-answers");
            for (const q of questions) {
                url += `&q=${encodeURIComponent(q.questionText)}`;
            }
            return $.ajax({
                url: url,
                type: 'delete',
            }).fail(this.onFail).done(this.onSuccess);
        }
    }
    _Connection_serverAddress = new WeakMap(), _Connection_cmid = new WeakMap(), _Connection_attemptId = new WeakMap(), _Connection_instances = new WeakSet(), _Connection_urlId_get = function _Connection_urlId_get() {
        return `cmid=${__classPrivateFieldGet(this, _Connection_cmid, "f")}&attempt=${__classPrivateFieldGet(this, _Connection_attemptId, "f")}`;
    }, _Connection_endpointUrl = function _Connection_endpointUrl(endpointName) {
        return `${__classPrivateFieldGet(this, _Connection_serverAddress, "f")}/${endpointName}?${__classPrivateFieldGet(this, _Connection_instances, "a", _Connection_urlId_get)}`;
    };

    var _a$1, _AttemptCookies_defaultExpire_get, _AttemptCookies_unsureSet, _MoodleUtilsCookies_instances, _b, _MoodleUtilsCookies_instance, _MoodleUtilsCookies_unsureMap, _MoodleUtilsCookies_unsureMapFromObject, _MoodleUtilsCookies_unsureMapObjectified, _MoodleUtilsCookies_attemptId_get, _MoodleUtilsCookies_onUnsureMapChange;
    class AttemptCookies {
        constructor(expire) {
            _AttemptCookies_unsureSet.set(this, new Set());
            this.expire = expire ?? __classPrivateFieldGet(AttemptCookies, _a$1, "a", _AttemptCookies_defaultExpire_get);
        }
        setUnsure(questionText, newValue) {
            if (newValue)
                __classPrivateFieldGet(this, _AttemptCookies_unsureSet, "f").add(questionText);
            else
                __classPrivateFieldGet(this, _AttemptCookies_unsureSet, "f").delete(questionText);
        }
        getUnsure(questionText) {
            return __classPrivateFieldGet(this, _AttemptCookies_unsureSet, "f").has(questionText);
        }
        isEmpty() { return __classPrivateFieldGet(this, _AttemptCookies_unsureSet, "f").size == 0; }
        isExpired() { return this.expire < Date.now(); }
        objectified() {
            const object = Object.fromEntries(Object.entries(this));
            object.unsureSet = [...__classPrivateFieldGet(this, _AttemptCookies_unsureSet, "f").keys()];
            return object;
        }
        static fromObject(object) {
            const result = new AttemptCookies(object.expire);
            for (const questionText of object.unsureSet) {
                __classPrivateFieldGet(result, _AttemptCookies_unsureSet, "f").add(questionText);
            }
            return result;
        }
    }
    _a$1 = AttemptCookies, _AttemptCookies_unsureSet = new WeakMap(), _AttemptCookies_defaultExpire_get = function _AttemptCookies_defaultExpire_get() { return Date.now() + 1000 * 60 * 60 * 24 * 3; };
    // singleton
    class MoodleUtilsCookies {
        constructor() {
            _MoodleUtilsCookies_instances.add(this);
            _MoodleUtilsCookies_unsureMap.set(this, void 0);
            __classPrivateFieldGet(this, _MoodleUtilsCookies_instances, "m", _MoodleUtilsCookies_unsureMapFromObject).call(this, GM_getValue('unsureMap', {}));
            GM_addValueChangeListener('unsureMap', (__classPrivateFieldGet(this, _MoodleUtilsCookies_instances, "m", _MoodleUtilsCookies_onUnsureMapChange)).bind(this));
            __classPrivateFieldGet(this, _MoodleUtilsCookies_unsureMap, "f").forEach((v, k) => {
                if (v.isExpired())
                    __classPrivateFieldGet(this, _MoodleUtilsCookies_unsureMap, "f").delete(k);
            });
            GM_setValue('unsureMap', __classPrivateFieldGet(this, _MoodleUtilsCookies_instances, "m", _MoodleUtilsCookies_unsureMapObjectified).call(this));
        }
        static get instance() {
            if (__classPrivateFieldGet(this, _b, "f", _MoodleUtilsCookies_instance) === undefined)
                __classPrivateFieldSet(this, _b, new MoodleUtilsCookies(), "f", _MoodleUtilsCookies_instance);
            return __classPrivateFieldGet(this, _b, "f", _MoodleUtilsCookies_instance);
        }
        setUnsure(questionText, newValue) {
            let attemptCookies = __classPrivateFieldGet(this, _MoodleUtilsCookies_unsureMap, "f").get(__classPrivateFieldGet(this, _MoodleUtilsCookies_instances, "a", _MoodleUtilsCookies_attemptId_get));
            if (attemptCookies === undefined) {
                if (!newValue)
                    //dont have to do anything
                    return;
                const expire = M.mod_quiz.timer.endtime; // =0 if not set
                attemptCookies = new AttemptCookies(expire || null);
                __classPrivateFieldGet(this, _MoodleUtilsCookies_unsureMap, "f").set(__classPrivateFieldGet(this, _MoodleUtilsCookies_instances, "a", _MoodleUtilsCookies_attemptId_get), attemptCookies);
            }
            attemptCookies.setUnsure(questionText, newValue);
            if (attemptCookies.isEmpty())
                __classPrivateFieldGet(this, _MoodleUtilsCookies_unsureMap, "f").delete(__classPrivateFieldGet(this, _MoodleUtilsCookies_instances, "a", _MoodleUtilsCookies_attemptId_get));
            GM_setValue('unsureMap', __classPrivateFieldGet(this, _MoodleUtilsCookies_instances, "m", _MoodleUtilsCookies_unsureMapObjectified).call(this));
        }
        getUnsure(questionText) {
            let attemptCookies = __classPrivateFieldGet(this, _MoodleUtilsCookies_unsureMap, "f").get(__classPrivateFieldGet(this, _MoodleUtilsCookies_instances, "a", _MoodleUtilsCookies_attemptId_get));
            if (attemptCookies === undefined)
                return false;
            return attemptCookies.getUnsure(questionText);
        }
    }
    _b = MoodleUtilsCookies, _MoodleUtilsCookies_unsureMap = new WeakMap(), _MoodleUtilsCookies_instances = new WeakSet(), _MoodleUtilsCookies_unsureMapFromObject = function _MoodleUtilsCookies_unsureMapFromObject(newValue) {
        __classPrivateFieldSet(this, _MoodleUtilsCookies_unsureMap, new Map(), "f");
        Object.entries(newValue).forEach(([key, value]) => {
            __classPrivateFieldGet(this, _MoodleUtilsCookies_unsureMap, "f").set(key, AttemptCookies.fromObject(value));
        });
        return __classPrivateFieldGet(this, _MoodleUtilsCookies_unsureMap, "f");
    }, _MoodleUtilsCookies_unsureMapObjectified = function _MoodleUtilsCookies_unsureMapObjectified() {
        const result = {};
        __classPrivateFieldGet(this, _MoodleUtilsCookies_unsureMap, "f").forEach((value, key) => { result[key] = value.objectified(); });
        return result;
    }, _MoodleUtilsCookies_attemptId_get = function _MoodleUtilsCookies_attemptId_get() { return `${this.cmid},${this.attempt}`; }, _MoodleUtilsCookies_onUnsureMapChange = function _MoodleUtilsCookies_onUnsureMapChange(name, oldValue, newValue, remote) {
        if (remote)
            __classPrivateFieldGet(this, _MoodleUtilsCookies_instances, "m", _MoodleUtilsCookies_unsureMapFromObject).call(this, newValue);
    };
    _MoodleUtilsCookies_instance = { value: void 0 };

    function MoodleUtilsElem(str) {
        return $(str).addClass("moodle-utils");
    }

    var _ImprovedTimer_instances, _ImprovedTimer_moodconstimer, _ImprovedTimer_timer, _ImprovedTimer_perQuestionUpdate;
    class ImprovedTimer {
        constructor(moodconstimer) {
            _ImprovedTimer_instances.add(this);
            _ImprovedTimer_moodconstimer.set(this, void 0);
            _ImprovedTimer_timer.set(this, void 0);
            const perQuestion = MoodleUtilsElem("<div>").addClass("per-question")
                .text("Średnio na pytanie ").appendTo(".othernav");
            const timer = MoodleUtilsElem("<span>").addClass("timer-per-question")
                .appendTo(perQuestion);
            __classPrivateFieldSet(this, _ImprovedTimer_timer, timer[0], "f");
            __classPrivateFieldSet(this, _ImprovedTimer_moodconstimer, moodconstimer, "f");
            const orgUpdate = moodconstimer.update;
            moodconstimer.update = () => {
                orgUpdate();
                __classPrivateFieldGet(this, _ImprovedTimer_instances, "m", _ImprovedTimer_perQuestionUpdate).call(this);
            };
        }
    }
    _ImprovedTimer_moodconstimer = new WeakMap(), _ImprovedTimer_timer = new WeakMap(), _ImprovedTimer_instances = new WeakSet(), _ImprovedTimer_perQuestionUpdate = function _ImprovedTimer_perQuestionUpdate() {
        const notAnsweredLen = $(".qnbutton.notyetanswered").length;
        if (notAnsweredLen == 0) {
            return;
        }
        const timeS = (__classPrivateFieldGet(this, _ImprovedTimer_moodconstimer, "f").endtime - new Date().getTime()) / 1000;
        const tPerQuestion = timeS / notAnsweredLen;
        const m = Math.floor(tPerQuestion / 60);
        const [s, ms] = (tPerQuestion % 60).toFixed(3).split(".");
        const tPerQuestionStr = `${m}:${s.padStart(2, "0")}.${ms}`;
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
                    },
                    improveTimer: {
                        type: 'checkbox',
                        default: true,
                    },
                }
            }), "f");
        }
        get serverAddress() {
            return __classPrivateFieldGet(this, _MoodleUtilsConfig_config, "f").get('serverAddress');
        }
        get improveTimer() {
            return __classPrivateFieldGet(this, _MoodleUtilsConfig_config, "f").get('improveTimer');
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

    var _Question_instances, _Question_questionText, _Question_answerBlock, _Question_topBar, _Question_info, _Question_unsureCheckbox, _Question_onUnsureChange, _Question_onUnload;
    class Question extends OnHTMLElement {
        constructor(htmlElement, connection) {
            super(htmlElement);
            _Question_instances.add(this);
            _Question_questionText.set(this, void 0);
            _Question_answerBlock.set(this, void 0);
            _Question_topBar.set(this, void 0);
            _Question_info.set(this, void 0);
            _Question_unsureCheckbox.set(this, void 0);
            this.connection = connection;
            __classPrivateFieldSet(this, _Question_questionText, this.constructor.extractText(htmlElement), "f");
            __classPrivateFieldSet(this, _Question_answerBlock, $(".ablock", htmlElement).get(0), "f");
            __classPrivateFieldSet(this, _Question_topBar, MoodleUtilsElem("<div>")
                .addClass("moodle-utils-top-bar")
                .prependTo($(".formulation", htmlElement))
                .get(0), "f");
            const unsureBox = MoodleUtilsElem("<div>")
                .addClass("moodle-utils-unsure-box")
                .appendTo(__classPrivateFieldGet(this, _Question_topBar, "f"));
            const checkboxId = `moodle-utils-unsure-checkbox-${htmlElement.id}`;
            MoodleUtilsElem("<label>")
                .attr("for", checkboxId)
                .text("? ")
                .appendTo(unsureBox);
            __classPrivateFieldSet(this, _Question_unsureCheckbox, MoodleUtilsElem("<input>")
                .attr("id", checkboxId)
                .attr("type", "checkbox")
                .on("change", (__classPrivateFieldGet(this, _Question_instances, "m", _Question_onUnsureChange)).bind(this))
                .appendTo(unsureBox)
                .get(0), "f");
            __classPrivateFieldSet(this, _Question_info, MoodleUtilsElem("<div>")
                .addClass("moodle-utils-info")
                .appendTo(__classPrivateFieldGet(this, _Question_topBar, "f"))
                .get(0), "f");
            // remember unsure setting
            const cookies = MoodleUtilsCookies.instance;
            __classPrivateFieldGet(this, _Question_unsureCheckbox, "f").checked = cookies.getUnsure(__classPrivateFieldGet(this, _Question_questionText, "f"));
            $(window).on("beforeunload", (__classPrivateFieldGet(this, _Question_instances, "m", _Question_onUnload)).bind(this));
        }
        get questionText() { return __classPrivateFieldGet(this, _Question_questionText, "f"); }
        get answerBlock() { return __classPrivateFieldGet(this, _Question_answerBlock, "f"); }
        get topBar() { return __classPrivateFieldGet(this, _Question_topBar, "f"); }
        get info() { return __classPrivateFieldGet(this, _Question_info, "f"); }
        setInfoText(text) { __classPrivateFieldGet(this, _Question_info, "f").innerText = text; }
        get unsureCheckbox() { return __classPrivateFieldGet(this, _Question_unsureCheckbox, "f"); }
        get isUnsure() { return __classPrivateFieldGet(this, _Question_unsureCheckbox, "f").checked; }
        static extractText(htmlElement) {
            return $(".qtext", htmlElement).text();
        }
        resetAnswer() {
            this.connection.resetAnswers(this);
        }
        postAnswers(data) {
            if (this.isUnsure)
                return;
            this.connection.postAnswers({ [this.questionText]: data });
        }
    }
    _Question_questionText = new WeakMap(), _Question_answerBlock = new WeakMap(), _Question_topBar = new WeakMap(), _Question_info = new WeakMap(), _Question_unsureCheckbox = new WeakMap(), _Question_instances = new WeakSet(), _Question_onUnsureChange = function _Question_onUnsureChange(e) {
        if (this.isUnsure)
            this.resetAnswer();
        else
            this.postAnswers(this.fullAnswerData());
        // prevent any question-specific handlers 
        // from firing on this checkbox
        e.stopPropagation();
    }, _Question_onUnload = function _Question_onUnload(e) {
        MoodleUtilsCookies.instance.setUnsure(__classPrivateFieldGet(this, _Question_questionText, "f"), __classPrivateFieldGet(this, _Question_unsureCheckbox, "f").checked);
    };

    var _Option_originalText, _Option_value, _GapSelectPlace_instances, _a, _GapSelectPlace_nameValidator_get, _GapSelectPlace_isName, _GapSelectPlace_options, _GapSelectPlace_name, _GapSelectPlace_addOption, _GapSelectPlace_onChange, _QuestionGapSelect_instances, _QuestionGapSelect_places, _QuestionGapSelect_addPlace;
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
                const matcher = __classPrivateFieldGet(GapSelectPlace, _a, "a", _GapSelectPlace_nameValidator_get).source;
                throw new OnHTMLElement.ConstructionError(htmlElement, `GapSelectPlace: no name (class matching ${matcher})`);
            }
            __classPrivateFieldSet(this, _GapSelectPlace_name, name, "f");
            $(htmlElement).on("change", (__classPrivateFieldGet(this, _GapSelectPlace_instances, "m", _GapSelectPlace_onChange)).bind(this));
        }
        fullAnswerData() {
            const selected = this.selected;
            return { [__classPrivateFieldGet(this, _GapSelectPlace_name, "f")]: selected !== null ? [selected.value] : [] };
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
    _a = GapSelectPlace, _GapSelectPlace_options = new WeakMap(), _GapSelectPlace_name = new WeakMap(), _GapSelectPlace_instances = new WeakSet(), _GapSelectPlace_nameValidator_get = function _GapSelectPlace_nameValidator_get() { return /^place\d+$/; }, _GapSelectPlace_isName = function _GapSelectPlace_isName(str) {
        return __classPrivateFieldGet(GapSelectPlace, _a, "a", _GapSelectPlace_nameValidator_get).test(str);
    }, _GapSelectPlace_addOption = function _GapSelectPlace_addOption(htmlElement) {
        const option = new Option(this, htmlElement);
        __classPrivateFieldGet(this, _GapSelectPlace_options, "f").set(option.value, option);
        return option;
    }, _GapSelectPlace_onChange = function _GapSelectPlace_onChange(e) {
        this.parent.postAnswers(this.fullAnswerData());
    };
    class QuestionGapSelect extends Question {
        constructor(htmlElement, connection) {
            super(htmlElement, connection);
            _QuestionGapSelect_instances.add(this);
            _QuestionGapSelect_places.set(this, new Map());
            $("select", htmlElement)
                .each((_, p) => { __classPrivateFieldGet(this, _QuestionGapSelect_instances, "m", _QuestionGapSelect_addPlace).call(this, p); });
            this.setInfoText("(numbers in brackets show answer counts)");
            this.postAnswers(this.fullAnswerData());
        }
        static extractText(htmlElement) {
            return $(".qtext", htmlElement).clone().find(".control").remove().end().text();
        }
        fullAnswerData() {
            const result = {};
            for (const [placeText, place] of __classPrivateFieldGet(this, _QuestionGapSelect_places, "f")) {
                Object.assign(result, place.fullAnswerData());
            }
            return result;
        }
        update(data) {
            for (const [placeText, place] of __classPrivateFieldGet(this, _QuestionGapSelect_places, "f")) {
                place.update(data[placeText] || {});
            }
        }
    }
    _QuestionGapSelect_places = new WeakMap(), _QuestionGapSelect_instances = new WeakSet(), _QuestionGapSelect_addPlace = function _QuestionGapSelect_addPlace(htmlElement) {
        const place = new GapSelectPlace(this, htmlElement);
        __classPrivateFieldGet(this, _QuestionGapSelect_places, "f").set(place.name, place);
        return place;
    };

    var _Choice_text, _Choice_counter, _QuestionMultichoice_instances, _QuestionMultichoice_choices, _QuestionMultichoice_isSingleChoice, _QuestionMultichoice_addChoice, _QuestionMultichoice_onChangeMultichoice, _QuestionMultichoice_onChangeRadio, _QuestionMultichoice_onCancel;
    class Choice extends OnHTMLElement {
        constructor(htmlElement) {
            super(htmlElement);
            _Choice_text.set(this, void 0);
            _Choice_counter.set(this, void 0);
            const label = $("~ .d-flex", htmlElement);
            __classPrivateFieldSet(this, _Choice_text, $("div.flex-fill", label).text(), "f");
            __classPrivateFieldSet(this, _Choice_counter, MoodleUtilsElem("<span>")
                .addClass("answer-counter")
                .text(0)
                .appendTo(label)
                .get(0), "f");
        }
        setCount(count) { __classPrivateFieldGet(this, _Choice_counter, "f").innerText = count; }
        get text() { return __classPrivateFieldGet(this, _Choice_text, "f"); }
    }
    _Choice_text = new WeakMap(), _Choice_counter = new WeakMap();
    class QuestionMultichoice extends Question {
        constructor(htmlElement, connection) {
            super(htmlElement, connection);
            _QuestionMultichoice_instances.add(this);
            _QuestionMultichoice_choices.set(this, new Map());
            _QuestionMultichoice_isSingleChoice.set(this, void 0);
            $("[value!=-1]:radio, :checkbox", this.answerBlock)
                .map((_, c) => { __classPrivateFieldGet(this, _QuestionMultichoice_instances, "m", _QuestionMultichoice_addChoice).call(this, c); });
            const cancel = $(".qtype_multichoice_clearchoice a", this.answerBlock);
            // no cancel in multichoice with multiple answers
            if (cancel.length > 0) {
                __classPrivateFieldSet(this, _QuestionMultichoice_isSingleChoice, true, "f");
                $(this.answerBlock).on('change', (__classPrivateFieldGet(this, _QuestionMultichoice_instances, "m", _QuestionMultichoice_onChangeRadio)).bind(this));
                cancel.on('click', (__classPrivateFieldGet(this, _QuestionMultichoice_instances, "m", _QuestionMultichoice_onCancel)).bind(this));
            }
            else {
                __classPrivateFieldSet(this, _QuestionMultichoice_isSingleChoice, false, "f");
                $(this.answerBlock).on('change', (__classPrivateFieldGet(this, _QuestionMultichoice_instances, "m", _QuestionMultichoice_onChangeMultichoice)).bind(this));
            }
            this.postAnswers(this.fullAnswerData());
        }
        get isSingleChoice() { return __classPrivateFieldGet(this, _QuestionMultichoice_isSingleChoice, "f"); }
        fullAnswerData() {
            return $(":checked[value!=-1]", this.answerBlock)
                .map((_, e) => __classPrivateFieldGet(this, _QuestionMultichoice_choices, "f").get(e).text)
                .get();
        }
        update(data) {
            for (const choice of __classPrivateFieldGet(this, _QuestionMultichoice_choices, "f").values()) {
                choice.setCount(data[choice.text] || "0");
            }
        }
    }
    _QuestionMultichoice_choices = new WeakMap(), _QuestionMultichoice_isSingleChoice = new WeakMap(), _QuestionMultichoice_instances = new WeakSet(), _QuestionMultichoice_addChoice = function _QuestionMultichoice_addChoice(htmlElement) {
        const choice = new Choice(htmlElement);
        __classPrivateFieldGet(this, _QuestionMultichoice_choices, "f").set(htmlElement, choice);
        return choice;
    }, _QuestionMultichoice_onChangeMultichoice = function _QuestionMultichoice_onChangeMultichoice() {
        this.postAnswers(this.fullAnswerData());
    }, _QuestionMultichoice_onChangeRadio = function _QuestionMultichoice_onChangeRadio(e) {
        this.postAnswers([__classPrivateFieldGet(this, _QuestionMultichoice_choices, "f").get(e.target).text]);
    }, _QuestionMultichoice_onCancel = function _QuestionMultichoice_onCancel() {
        this.resetAnswer();
    };

    var _QuestionShortAnswer_instances, _QuestionShortAnswer_top, _QuestionShortAnswer_textField, _QuestionShortAnswer_timerId, _QuestionShortAnswer_sendTimeout, _QuestionShortAnswer_onKeypress, _QuestionShortAnswer_sendAnswer;
    class QuestionShortAnswer extends Question {
        constructor(htmlElement, connection) {
            super(htmlElement, connection);
            _QuestionShortAnswer_instances.add(this);
            _QuestionShortAnswer_top.set(this, void 0);
            _QuestionShortAnswer_textField.set(this, void 0);
            _QuestionShortAnswer_timerId.set(this, null);
            _QuestionShortAnswer_sendTimeout.set(this, 1000);
            const formulation = $(".formulation", htmlElement);
            const top = MoodleUtilsElem('<div>')
                .addClass("topanswers")
                .appendTo(formulation);
            __classPrivateFieldSet(this, _QuestionShortAnswer_top, top[0], "f");
            MoodleUtilsElem('<div>')
                .addClass("top-short-answers-label")
                .text("Najliczniejsze odpowiedzi:")
                .appendTo(top);
            for (let i = 0; i < 5; i++) {
                const a = MoodleUtilsElem('<div>').addClass("top-short-answer").appendTo(top);
                MoodleUtilsElem('<div>').addClass("top-short-answer-content").appendTo(a);
                MoodleUtilsElem('<div>').addClass("answer-counter").appendTo(a);
            }
            $(htmlElement).on("change", (__classPrivateFieldGet(this, _QuestionShortAnswer_instances, "m", _QuestionShortAnswer_sendAnswer)).bind(this));
            __classPrivateFieldSet(this, _QuestionShortAnswer_textField, $(":text", htmlElement)
                .on("keydown", (__classPrivateFieldGet(this, _QuestionShortAnswer_instances, "m", _QuestionShortAnswer_onKeypress)).bind(this)).get(0), "f");
            __classPrivateFieldGet(this, _QuestionShortAnswer_instances, "m", _QuestionShortAnswer_sendAnswer).call(this);
        }
        fullAnswerData() {
            const answer = __classPrivateFieldGet(this, _QuestionShortAnswer_textField, "f").value;
            return answer == "" ? [] : [answer];
        }
        update(data) {
            const sorted = Object.entries(data).sort(([_1, a], [_2, b]) => parseInt(b) - parseInt(a));
            let el = $(__classPrivateFieldGet(this, _QuestionShortAnswer_top, "f")).children(".top-short-answer").first();
            for (const [answerText, count] of sorted) {
                if (el.length == 0) {
                    break;
                }
                el.children(".top-short-answer-content").text(answerText);
                el.children(".answer-counter").text(count);
                el = el.next();
            }
            while (el.length != 0) {
                el.children(".top-short-answer-content").text("");
                el.children(".answer-counter").text("");
                el = el.next();
            }
        }
        get sendTimeout() { return __classPrivateFieldGet(this, _QuestionShortAnswer_sendTimeout, "f"); }
        set sendTimeout(value) {
            if (value < 0)
                throw new Error("sendTimeout value cannot be negative");
            __classPrivateFieldSet(this, _QuestionShortAnswer_sendTimeout, value, "f");
        }
    }
    _QuestionShortAnswer_top = new WeakMap(), _QuestionShortAnswer_textField = new WeakMap(), _QuestionShortAnswer_timerId = new WeakMap(), _QuestionShortAnswer_sendTimeout = new WeakMap(), _QuestionShortAnswer_instances = new WeakSet(), _QuestionShortAnswer_onKeypress = function _QuestionShortAnswer_onKeypress(e) {
        if (e.key == "Enter") {
            // send immediately
            __classPrivateFieldGet(this, _QuestionShortAnswer_instances, "m", _QuestionShortAnswer_sendAnswer).call(this);
        }
        else {
            // send after timeout
            if (__classPrivateFieldGet(this, _QuestionShortAnswer_timerId, "f") !== null)
                window.clearTimeout(__classPrivateFieldGet(this, _QuestionShortAnswer_timerId, "f"));
            __classPrivateFieldSet(this, _QuestionShortAnswer_timerId, window.setTimeout(() => {
                __classPrivateFieldSet(this, _QuestionShortAnswer_timerId, null, "f");
                __classPrivateFieldGet(this, _QuestionShortAnswer_instances, "m", _QuestionShortAnswer_sendAnswer).call(this);
            }, __classPrivateFieldGet(this, _QuestionShortAnswer_sendTimeout, "f")), "f");
        }
    }, _QuestionShortAnswer_sendAnswer = function _QuestionShortAnswer_sendAnswer() {
        this.postAnswers(this.fullAnswerData());
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
            for (const input of $(":radio", this.answerBlock)) {
                const counter = MoodleUtilsElem("<span>").addClass("answer-counter")
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
            $(this.answerBlock).on('change', (__classPrivateFieldGet(this, _QuestionTrueFalse_instances, "m", _QuestionTrueFalse_onChange)).bind(this));
            this.postAnswers(this.fullAnswerData());
        }
        fullAnswerData() {
            const checked = $(":radio:checked", this.answerBlock).get(0);
            return checked === undefined ? [] : [checked.value];
        }
        update(data) {
            __classPrivateFieldGet(this, _QuestionTrueFalse_trueCount, "f").innerText = data["1"] || "0";
            __classPrivateFieldGet(this, _QuestionTrueFalse_falseCount, "f").innerText = data["0"] || "0";
        }
    }
    _QuestionTrueFalse_trueCount = new WeakMap(), _QuestionTrueFalse_falseCount = new WeakMap(), _QuestionTrueFalse_instances = new WeakSet(), _QuestionTrueFalse_onChange = function _QuestionTrueFalse_onChange(e) {
        this.postAnswers([e.target.value]);
    };

    var _QuestionMap_instances, _QuestionMap_create;
    class QuestionMap extends Map {
        constructor(root, connection) {
            super();
            _QuestionMap_instances.add(this);
            $(".que", root)
                .map((_, q) => __classPrivateFieldGet(this, _QuestionMap_instances, "m", _QuestionMap_create).call(this, q, connection))
                .each((_, q) => { this.set(q.questionText, q); });
            this.connection = connection;
        }
        updateAll() {
            this.connection.getAnswers(data => {
                for (const [qtext, qdata] of Object.entries(data)) {
                    const q = this.get(qtext);
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
        for (const className of classes) {
            switch (className) {
                case "multichoice":
                    return new QuestionMultichoice(htmlElement, connection);
                case "truefalse":
                    return new QuestionTrueFalse(htmlElement, connection);
                case "shortanswer":
                    return new QuestionShortAnswer(htmlElement, connection);
                case "gapselect":
                    return new QuestionGapSelect(htmlElement, connection);
            }
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
                .addClass("status unknown")
                .append("<hr/>"), "f");
            __classPrivateFieldGet(this, _ServerStatusBar_element, "f").prependTo(parent);
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

    var css = ".moodle-utils {\n    color: grey\n}\n\n/* QUESTIONS */\n\n.moodle-utils.moodle-utils-top-bar {\n    margin-bottom: 1em;\n}\n\n.moodle-utils.moodle-utils-unsure-box {\n    float: right;\n}\n\n.moodle-utils.moodle-utils-info {\n    font-style: italic;\n}\n\n/* ANSWERS */\n\n.moodle-utils.answer-counter {\n    float: right;\n}\n\n.moodle-utils.top-short-answers {\n    display: flex;\n    flex-direction: column;\n    flex-wrap: nowrap;\n}\n\n.moodle-utils.top-short-answer {\n    display: flex;\n    flex-direction: row;\n    flex-wrap: nowrap;\n}\n\n.moodle-utils.top-short-answer-content {\n    width: -webkit-fill-available;\n}\n\n/* TIMER */\n\n.moodle-utils.per-question {\n    color: black\n}\n\n.moodle-utils.timer-per-question {\n    font-weight: 700;\n    color: black\n}\n\n/* SERVER STATUS */\n\n.moodle-utils.status::before {\n    content: \"???\";\n    float: right;\n}\n\n.moodle-utils.status.unknown::before {\n    content: \"???\";\n    float: right;\n}\n\n.moodle-utils.status.ok::before {\n    content: \"OK\";\n    color: hsla(120, 100%, 41%, 0.75);\n}\n\n.moodle-utils.status.failed::before {\n    content: \"FAILED\";\n    color: hsla(0, 100%, 54%, 0.75);\n}";
    n(css,{});

    (function () {
        // load configuration
        const cfg = new MoodleUtilsConfig();
        const address = new URL(window.location.href);
        const cmid = address.searchParams.get('cmid');
        const attempt = address.searchParams.get('attempt');
        // load cookies
        const cookies = MoodleUtilsCookies.instance;
        cookies.cmid = cmid;
        cookies.attempt = attempt;
        // enable only on quizes
        // on the rest of matches enable just the configuration
        const enableRegex = /^https:\/\/.*\/mod\/quiz\/attempt.*$/;
        if (!enableRegex.test(window.location.href))
            return;
        Y.on("domready", function () {
            // add timer
            if (cfg.improveTimer
                && $(".qnbutton.notyetanswered").length != 0
                && M.mod_quiz.timer.endtime != 0)
                new ImprovedTimer(M.mod_quiz.timer);
            // return if no server address
            if (cfg.serverAddress == "")
                return;
            // add status bar
            const serverStatusBar = new ServerStatusBar($("#mod_quiz_navblock > .card-body"));
            // create connection to server
            const conn = new Connection(cfg.serverAddress, cmid, attempt);
            conn.onSuccess = () => serverStatusBar.status = "ok";
            conn.onFail = (t, u, v, r) => {
                serverStatusBar.status = "failed";
                console.error("moodle-utils server connection error: ", v);
            };
            // create current page's question map
            const qmap = new QuestionMap(document.body, conn);
            // refresh question map every second
            qmap.updateAll();
            if (qmap.size != 0) {
                window.setInterval((qmap.updateAll).bind(qmap), 1000);
            }
        });
    })();

})();
