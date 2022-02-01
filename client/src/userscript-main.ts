import "+Header";
import Connection from "Connection";
import { GM_addStyle, GM_getResourceText, M, Y } from "ExternalTypes";
import ImprovedTimer from "ImprovedTimer";
import MoodleUtilsConfig from "MoodleUtilsConfig";
import { QuestionMap } from "questions/QuestionMap";
import ServerStatusBar from "ServerStatusBar";

(function () {
    'use strict';
    const cfg = new MoodleUtilsConfig()

    // enable only on quizes
    // on the rest of matches enable just the configuration
    // (could do this using @include UserScript param, but
    // this is said to be faster)
    const enableRegex = /^https:\/\/.*\/mod\/quiz\/attempt.*$/
    if (!enableRegex.test(window.location.href))
        return

    Y.on("domready", function () {
        // add style
        GM_addStyle(GM_getResourceText('css'))

        // add timer
        if ($(".qnbutton.notyetanswered").length != 0 && M.mod_quiz.timer?.endtime != 0)
            new ImprovedTimer(M.mod_quiz.timer)

        // return if no server address
        if (cfg.serverAddress == "")
            return

        // add status bar
        const serverStatusBar = new ServerStatusBar($("#mod_quiz_navblock > .card-body"))

        // create connection to server
        const conn = Connection.fromQuizURL(
            cfg.serverAddress,
            window.location.href
        )
        conn.onFail = () => serverStatusBar.status = "failed"
        conn.onSuccess = () => serverStatusBar.status = "ok"

        // create current page's question map
        const qmap = new QuestionMap(document.body, conn)

        // refresh question map every second
        if (qmap.size != 0) {
            window.setInterval(() => qmap.updateAll, 1000)
        }
    })
})();
