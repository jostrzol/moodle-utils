"use strict";
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
// @resource        css https://raw.githubusercontent.com/Ogurczak/moodle-utils/{{pre-push:branch}}/client/style.css
// @require         https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @require         http://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==
System.register("OnHTMLElement", [], function (exports_1, context_1) {
    "use strict";
    var _OnHTMLElement_html, OnHTMLElement;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            OnHTMLElement = class OnHTMLElement {
                constructor(htmlElement) {
                    _OnHTMLElement_html.set(this, void 0);
                    __classPrivateFieldSet(this, _OnHTMLElement_html, htmlElement, "f");
                }
                get html() {
                    return __classPrivateFieldGet(this, _OnHTMLElement_html, "f");
                }
            };
            exports_1("default", OnHTMLElement);
            _OnHTMLElement_html = new WeakMap();
            OnHTMLElement.ConstructionError = class extends Error {
                constructor(htmlElement, message) {
                    super(`#${htmlElement.id} construction: ${message}`);
                    this.htmlElement = htmlElement;
                }
            };
        }
    };
});
System.register("MoodleUtilsElem", [], function (exports_2, context_2) {
    "use strict";
    var __moduleName = context_2 && context_2.id;
    function MoodleUtilsElem(str) {
        return $(str).addClass("moodleutils");
    }
    exports_2("default", MoodleUtilsElem);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("questions/Multichoice", ["MoodleUtilsElem", "questions/Question"], function (exports_3, context_3) {
    "use strict";
    var _QuestionMultichoice_instances, _QuestionMultichoice_counts, _QuestionMultichoice_inputs, _QuestionMultichoice_onChangeMultichoice, _QuestionMultichoice_onChangeRadio, _QuestionMultichoice_onCancel, MoodleUtilsElem_1, Question_1, QuestionMultichoice;
    var __moduleName = context_3 && context_3.id;
    return {
        setters: [
            function (MoodleUtilsElem_1_1) {
                MoodleUtilsElem_1 = MoodleUtilsElem_1_1;
            },
            function (Question_1_1) {
                Question_1 = Question_1_1;
            }
        ],
        execute: function () {
            QuestionMultichoice = class QuestionMultichoice extends Question_1.default {
                constructor(htmlElement, connection) {
                    super(htmlElement, connection);
                    _QuestionMultichoice_instances.add(this);
                    _QuestionMultichoice_counts.set(this, new Map());
                    _QuestionMultichoice_inputs.set(this, new Map());
                    for (let input of $("[value!=-1]:radio, :checkbox", htmlElement)) {
                        let label = $("~ .d-flex", input);
                        let counter = MoodleUtilsElem_1.default("<span>").addClass("answercounter").text(0).appendTo(label)[0];
                        let answerText = $("div.flex-fill", label).text().replaceAll("\n", "");
                        __classPrivateFieldGet(this, _QuestionMultichoice_counts, "f").set(answerText, counter);
                        __classPrivateFieldGet(this, _QuestionMultichoice_inputs, "f").set(input, answerText);
                    }
                    let cancel = $(".qtype_multichoice_clearchoice a", htmlElement)[0];
                    // no cancel in multichoice with multiple answers
                    if (cancel) {
                        $(htmlElement).on('change', (__classPrivateFieldGet(this, _QuestionMultichoice_instances, "m", _QuestionMultichoice_onChangeRadio)).bind(this));
                        $(cancel).on('click', (__classPrivateFieldGet(this, _QuestionMultichoice_instances, "m", _QuestionMultichoice_onCancel)).bind(this));
                        $("[value!=-1]:radio:checked", htmlElement).trigger('change'); // send initial value
                    }
                    else {
                        $(htmlElement).on('change', (__classPrivateFieldGet(this, _QuestionMultichoice_instances, "m", _QuestionMultichoice_onChangeMultichoice)).bind(this));
                        $(":checkbox:checked", htmlElement).trigger('change'); // send initial value
                    }
                }
                update(data) {
                    for (let [answerText, counter] of __classPrivateFieldGet(this, _QuestionMultichoice_counts, "f")) {
                        let count = data[answerText] || "0";
                        counter.innerText = count;
                    }
                }
            };
            exports_3("default", QuestionMultichoice);
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
        }
    };
});
System.register("questions/ShortAnswer", ["MoodleUtilsElem", "questions/Question"], function (exports_4, context_4) {
    "use strict";
    var _QuestionShortAnswer_instances, _QuestionShortAnswer_top, _QuestionShortAnswer_onChange, MoodleUtilsElem_2, Question_2, QuestionShortAnswer;
    var __moduleName = context_4 && context_4.id;
    return {
        setters: [
            function (MoodleUtilsElem_2_1) {
                MoodleUtilsElem_2 = MoodleUtilsElem_2_1;
            },
            function (Question_2_1) {
                Question_2 = Question_2_1;
            }
        ],
        execute: function () {
            QuestionShortAnswer = class QuestionShortAnswer extends Question_2.default {
                constructor(htmlElement, connection) {
                    super(htmlElement, connection);
                    _QuestionShortAnswer_instances.add(this);
                    _QuestionShortAnswer_top.set(this, void 0);
                    let formulation = $(".formulation", htmlElement);
                    let top = MoodleUtilsElem_2.default('<div>').addClass("topanswers")
                        .appendTo(formulation);
                    __classPrivateFieldSet(this, _QuestionShortAnswer_top, top[0], "f");
                    MoodleUtilsElem_2.default('<div>').addClass("topshortanswerslabel")
                        .text("Najliczniejsze odpowiedzi:").appendTo(top);
                    for (let i = 0; i < 5; i++) {
                        let a = MoodleUtilsElem_2.default('<div>').addClass("topshortanswer").appendTo(top);
                        MoodleUtilsElem_2.default('<div>').addClass("topshortanswercontent").appendTo(a);
                        MoodleUtilsElem_2.default('<div>').addClass("answercounter").appendTo(a);
                    }
                    $(htmlElement).on('change', (__classPrivateFieldGet(this, _QuestionShortAnswer_instances, "m", _QuestionShortAnswer_onChange)).bind(this));
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
            };
            exports_4("default", QuestionShortAnswer);
            _QuestionShortAnswer_top = new WeakMap(), _QuestionShortAnswer_instances = new WeakSet(), _QuestionShortAnswer_onChange = function _QuestionShortAnswer_onChange(e) {
                let data = {};
                let answer = e.target.value.trim();
                data[this.text] = answer == "" ? [] : [answer];
                this.connection.postAnswers(data);
            };
        }
    };
});
System.register("questions/TrueFalse", ["MoodleUtilsElem", "OnHTMLElement", "questions/Question"], function (exports_5, context_5) {
    "use strict";
    var _QuestionTrueFalse_instances, _QuestionTrueFalse_trueCount, _QuestionTrueFalse_falseCount, _QuestionTrueFalse_onChange, MoodleUtilsElem_3, OnHTMLElement_1, Question_3, QuestionTrueFalse;
    var __moduleName = context_5 && context_5.id;
    return {
        setters: [
            function (MoodleUtilsElem_3_1) {
                MoodleUtilsElem_3 = MoodleUtilsElem_3_1;
            },
            function (OnHTMLElement_1_1) {
                OnHTMLElement_1 = OnHTMLElement_1_1;
            },
            function (Question_3_1) {
                Question_3 = Question_3_1;
            }
        ],
        execute: function () {
            QuestionTrueFalse = class QuestionTrueFalse extends Question_3.default {
                constructor(htmlElement, connection) {
                    super(htmlElement, connection);
                    _QuestionTrueFalse_instances.add(this);
                    _QuestionTrueFalse_trueCount.set(this, void 0);
                    _QuestionTrueFalse_falseCount.set(this, void 0);
                    let trueCount = null;
                    let falseCount = null;
                    for (let input of $(":radio", htmlElement)) {
                        let counter = MoodleUtilsElem_3.default("<span>").addClass("answercounter")
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
                        throw new OnHTMLElement_1.default.ConstructionError(htmlElement, "TrueFalse: no have true and/or false radio");
                    }
                    __classPrivateFieldSet(this, _QuestionTrueFalse_trueCount, trueCount, "f");
                    __classPrivateFieldSet(this, _QuestionTrueFalse_falseCount, falseCount, "f");
                    $(htmlElement).on('change', (__classPrivateFieldGet(this, _QuestionTrueFalse_instances, "m", _QuestionTrueFalse_onChange)).bind(this));
                    $(":radio:checked", htmlElement).trigger('change'); // send initial value
                }
                update(data) {
                    __classPrivateFieldGet(this, _QuestionTrueFalse_trueCount, "f").innerText = data["1"] || "0";
                    __classPrivateFieldGet(this, _QuestionTrueFalse_falseCount, "f").innerText = data["0"] || "0";
                }
            };
            exports_5("default", QuestionTrueFalse);
            _QuestionTrueFalse_trueCount = new WeakMap(), _QuestionTrueFalse_falseCount = new WeakMap(), _QuestionTrueFalse_instances = new WeakSet(), _QuestionTrueFalse_onChange = function _QuestionTrueFalse_onChange(e) {
                let data = {};
                data[this.text] = [e.target.value];
                this.connection.postAnswers(data);
            };
        }
    };
});
System.register("questions/Question", ["OnHTMLElement", "questions/Multichoice", "questions/ShortAnswer", "questions/TrueFalse"], function (exports_6, context_6) {
    "use strict";
    var _Question_text, OnHTMLElement_2, Multichoice_1, ShortAnswer_1, TrueFalse_1, Question;
    var __moduleName = context_6 && context_6.id;
    return {
        setters: [
            function (OnHTMLElement_2_1) {
                OnHTMLElement_2 = OnHTMLElement_2_1;
            },
            function (Multichoice_1_1) {
                Multichoice_1 = Multichoice_1_1;
            },
            function (ShortAnswer_1_1) {
                ShortAnswer_1 = ShortAnswer_1_1;
            },
            function (TrueFalse_1_1) {
                TrueFalse_1 = TrueFalse_1_1;
            }
        ],
        execute: function () {
            Question = class Question extends OnHTMLElement_2.default {
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
                // utility function for quick question creation
                static create(htmlElement, connection) {
                    const classes = htmlElement.classList;
                    if ("multichoice" in classes) {
                        return new Multichoice_1.default(htmlElement, connection);
                    }
                    else if ("truefalse" in classes) {
                        return new TrueFalse_1.default(htmlElement, connection);
                    }
                    else if ("shortanswer" in classes) {
                        return new ShortAnswer_1.default(htmlElement, connection);
                    }
                    return null;
                }
            };
            exports_6("default", Question);
            _Question_text = new WeakMap();
        }
    };
});
System.register("Connection", [], function (exports_7, context_7) {
    "use strict";
    var _Connection_instances, _Connection_serverAddress, _Connection_cmid, _Connection_attemptId, _Connection_urlId_get, _Connection_endpointUrl, Connection;
    var __moduleName = context_7 && context_7.id;
    return {
        setters: [],
        execute: function () {
            Connection = class Connection {
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
            };
            exports_7("default", Connection);
            _Connection_serverAddress = new WeakMap(), _Connection_cmid = new WeakMap(), _Connection_attemptId = new WeakMap(), _Connection_instances = new WeakSet(), _Connection_urlId_get = function _Connection_urlId_get() {
                return `cmid=${__classPrivateFieldGet(this, _Connection_cmid, "f")}&attempt=${__classPrivateFieldGet(this, _Connection_attemptId, "f")}`;
            }, _Connection_endpointUrl = function _Connection_endpointUrl(endpointName) {
                return `${__classPrivateFieldGet(this, _Connection_serverAddress, "f")}/${endpointName}?${__classPrivateFieldGet(this, _Connection_instances, "a", _Connection_urlId_get)}`;
            };
        }
    };
});
System.register("ImprovedTimer", ["MoodleUtilsElem"], function (exports_8, context_8) {
    "use strict";
    var _ImprovedTimer_instances, _ImprovedTimer_moodleTimer, _ImprovedTimer_timer, _ImprovedTimer_perQuestionUpdate, MoodleUtilsElem_4, ImprovedTimer;
    var __moduleName = context_8 && context_8.id;
    return {
        setters: [
            function (MoodleUtilsElem_4_1) {
                MoodleUtilsElem_4 = MoodleUtilsElem_4_1;
            }
        ],
        execute: function () {
            ImprovedTimer = class ImprovedTimer {
                constructor(moodleTimer) {
                    _ImprovedTimer_instances.add(this);
                    _ImprovedTimer_moodleTimer.set(this, void 0);
                    _ImprovedTimer_timer.set(this, void 0);
                    let perQuestion = MoodleUtilsElem_4.default("<div>").addClass("perquestion")
                        .text("Średnio na pytanie ").appendTo(".othernav");
                    let timer = MoodleUtilsElem_4.default("<span>").addClass("timerperquestion")
                        .appendTo(perQuestion);
                    __classPrivateFieldSet(this, _ImprovedTimer_timer, timer[0], "f");
                    __classPrivateFieldSet(this, _ImprovedTimer_moodleTimer, moodleTimer, "f");
                    let orgUpdate = moodleTimer.update;
                    moodleTimer.update = () => {
                        orgUpdate();
                        __classPrivateFieldGet(this, _ImprovedTimer_instances, "m", _ImprovedTimer_perQuestionUpdate).call(this);
                    };
                }
            };
            exports_8("default", ImprovedTimer);
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
        }
    };
});
System.register("MoodleUtilsConfig", ["ExternalTypes"], function (exports_9, context_9) {
    "use strict";
    var _MoodleUtilsConfig_config, ExternalTypes_1, MoodleUtilsConfig;
    var __moduleName = context_9 && context_9.id;
    return {
        setters: [
            function (ExternalTypes_1_1) {
                ExternalTypes_1 = ExternalTypes_1_1;
            }
        ],
        execute: function () {
            MoodleUtilsConfig = class MoodleUtilsConfig {
                constructor() {
                    _MoodleUtilsConfig_config.set(this, void 0);
                    __classPrivateFieldSet(this, _MoodleUtilsConfig_config, new ExternalTypes_1.MonkeyConfig({
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
            };
            exports_9("default", MoodleUtilsConfig);
            _MoodleUtilsConfig_config = new WeakMap();
        }
    };
});
System.register("questions/QuestionMap", ["questions/Question"], function (exports_10, context_10) {
    "use strict";
    var Question_4, QuestionMap;
    var __moduleName = context_10 && context_10.id;
    return {
        setters: [
            function (Question_4_1) {
                Question_4 = Question_4_1;
            }
        ],
        execute: function () {
            QuestionMap = class QuestionMap extends Map {
                constructor(root, connection) {
                    super();
                    $(".que", root)
                        .map((_, q) => Question_4.default.create(q, connection))
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
            };
            exports_10("QuestionMap", QuestionMap);
        }
    };
});
System.register("ServerStatusBar", ["MoodleUtilsElem"], function (exports_11, context_11) {
    "use strict";
    var _ServerStatusBar_element, _ServerStatusBar_status, MoodleUtilsElem_5, ServerStatusBar;
    var __moduleName = context_11 && context_11.id;
    return {
        setters: [
            function (MoodleUtilsElem_5_1) {
                MoodleUtilsElem_5 = MoodleUtilsElem_5_1;
            }
        ],
        execute: function () {
            ServerStatusBar = class ServerStatusBar {
                constructor(parent) {
                    _ServerStatusBar_element.set(this, void 0);
                    _ServerStatusBar_status.set(this, "unknown");
                    __classPrivateFieldSet(this, _ServerStatusBar_element, MoodleUtilsElem_5.default('<div>')
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
            };
            exports_11("default", ServerStatusBar);
            _ServerStatusBar_element = new WeakMap(), _ServerStatusBar_status = new WeakMap();
        }
    };
});
System.register("MoodleUtils", ["+Header", "Connection", "ExternalTypes", "ImprovedTimer", "MoodleUtilsConfig", "questions/QuestionMap", "ServerStatusBar"], function (exports_12, context_12) {
    "use strict";
    var Connection_1, ExternalTypes_2, ImprovedTimer_1, MoodleUtilsConfig_1, QuestionMap_1, ServerStatusBar_1;
    var __moduleName = context_12 && context_12.id;
    return {
        setters: [
            function (_1) {
            },
            function (Connection_1_1) {
                Connection_1 = Connection_1_1;
            },
            function (ExternalTypes_2_1) {
                ExternalTypes_2 = ExternalTypes_2_1;
            },
            function (ImprovedTimer_1_1) {
                ImprovedTimer_1 = ImprovedTimer_1_1;
            },
            function (MoodleUtilsConfig_1_1) {
                MoodleUtilsConfig_1 = MoodleUtilsConfig_1_1;
            },
            function (QuestionMap_1_1) {
                QuestionMap_1 = QuestionMap_1_1;
            },
            function (ServerStatusBar_1_1) {
                ServerStatusBar_1 = ServerStatusBar_1_1;
            }
        ],
        execute: function () {
            (function () {
                'use strict';
                const cfg = new MoodleUtilsConfig_1.default();
                // enable only on quizes
                // on the rest of matches enable just the configuration
                // (could do this using @include UserScript param, but
                // this is said to be faster)
                const enableRegex = /^https:\/\/.*\/mod\/quiz\/attempt.*$/;
                if (!enableRegex.test(window.location.href))
                    return;
                ExternalTypes_2.Y.on("domready", function () {
                    var _a;
                    // add style
                    ExternalTypes_2.GM_addStyle(ExternalTypes_2.GM_getResourceText('css'));
                    // add timer
                    if ($(".qnbutton.notyetanswered").length != 0 && ((_a = ExternalTypes_2.M.mod_quiz.timer) === null || _a === void 0 ? void 0 : _a.endtime) != 0)
                        new ImprovedTimer_1.default(ExternalTypes_2.M.mod_quiz.timer);
                    // return if no server address
                    if (cfg.serverAddress == "")
                        return;
                    // add status bar
                    const serverStatusBar = new ServerStatusBar_1.default($("#mod_quiz_navblock > .card-body"));
                    // create connection to server
                    const conn = Connection_1.default.fromQuizURL(cfg.serverAddress, window.location.href);
                    conn.onFail = () => serverStatusBar.status = "failed";
                    conn.onSuccess = () => serverStatusBar.status = "ok";
                    // create current page's question map
                    const qmap = new QuestionMap_1.QuestionMap(document.body, conn);
                    // refresh question map every second
                    if (qmap.size != 0) {
                        window.setInterval(() => qmap.updateAll, 1000);
                    }
                });
            })();
        }
    };
});
System.register("questions/GapSelect", ["OnHTMLElement", "questions/Question"], function (exports_13, context_13) {
    "use strict";
    var _Option_originalText, _Option_value, _GapSelectPlace_instances, _a, _GapSelectPlace_nameValidator, _GapSelectPlace_isName, _GapSelectPlace_options, _GapSelectPlace_name, _GapSelectPlace_addOption, _GapSelectPlace_onChange, _QuestionGapSelect_instances, _QuestionGapSelect_places, _QuestionGapSelect_addPlace, OnHTMLElement_3, Question_5, Option, GapSelectPlace, QuestionGapSelect;
    var __moduleName = context_13 && context_13.id;
    return {
        setters: [
            function (OnHTMLElement_3_1) {
                OnHTMLElement_3 = OnHTMLElement_3_1;
            },
            function (Question_5_1) {
                Question_5 = Question_5_1;
            }
        ],
        execute: function () {
            Option = class Option extends OnHTMLElement_3.default {
                constructor(parent, htmlElement) {
                    super(htmlElement);
                    _Option_originalText.set(this, void 0);
                    _Option_value.set(this, void 0);
                    this.parent = parent;
                    __classPrivateFieldSet(this, _Option_originalText, htmlElement.innerText, "f");
                    const value = htmlElement.getAttribute("value");
                    if (value == null)
                        throw new OnHTMLElement_3.default.ConstructionError(htmlElement, "Option: no value attribute");
                    __classPrivateFieldSet(this, _Option_value, value, "f");
                    this.setCount("0");
                }
                setCount(count) {
                    this.html.innerText = `${__classPrivateFieldGet(this, _Option_originalText, "f")} (${count})`;
                }
                get originalText() { return __classPrivateFieldGet(this, _Option_originalText, "f"); }
                get value() { return __classPrivateFieldGet(this, _Option_value, "f"); }
                get select() { return this.parent; }
            };
            exports_13("Option", Option);
            _Option_originalText = new WeakMap(), _Option_value = new WeakMap();
            GapSelectPlace = class GapSelectPlace extends OnHTMLElement_3.default {
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
                        throw new OnHTMLElement_3.default.ConstructionError(htmlElement, `GapSelectPlace: no name (class matching ${matcher})`);
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
            };
            exports_13("GapSelectPlace", GapSelectPlace);
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
            QuestionGapSelect = class QuestionGapSelect extends Question_5.default {
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
            };
            exports_13("default", QuestionGapSelect);
            _QuestionGapSelect_places = new WeakMap(), _QuestionGapSelect_instances = new WeakSet(), _QuestionGapSelect_addPlace = function _QuestionGapSelect_addPlace(htmlElement) {
                const place = new GapSelectPlace(this, htmlElement);
                __classPrivateFieldGet(this, _QuestionGapSelect_places, "f").set(place.name, place);
                return place;
            };
        }
    };
});
