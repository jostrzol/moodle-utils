// ==UserScript==
// @name         Moodle Utils
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Displays time per question left
// @author       Ogurczak
// @match        https://*/mod/quiz/attempt*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    Y.on('domready', function () {
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

            // var all_len = document.getElementsByClassName("qnbutton").length
            var not_answered_len = document.getElementsByClassName("qnbutton notyetanswered").length

            var t_per_question = time_s / not_answered_len

            var m = parseInt(t_per_question / 60)
            var s = (t_per_question % 60).toFixed(3).toString().split(".")

            var t_per_question_str = m.toString() + ":" + s[0].padStart(2, "0") + "." + s[1]

            timer_per_question.innerHTML = t_per_question_str
        }

        M.mod_quiz.timer.update = function () {
            old_update()
            per_question_update()
        }
    });

})();