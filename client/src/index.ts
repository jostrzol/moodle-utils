import Connection from "./connection";
import MoodleUtilsCookies from "./cookies";
import ImprovedTimer from "./improved-timer";
import MoodleUtilsConfig from "./moodle-utils-config";
import { QuestionMap } from "./questions/question-map";
import ServerStatusBar from "./server-status-bar";
import './style.css';

(function () {
    'use strict';

    // load configuration
    const cfg = new MoodleUtilsConfig()
    const address = new URL(window.location.href)
    const cmid = address.searchParams.get('cmid')
    const attempt = address.searchParams.get('attempt')

    // load cookies
    const cookies = MoodleUtilsCookies.instance
    cookies.cmid = cmid
    cookies.attempt = attempt

    // enable only on quizes
    // on the rest of matches enable just the configuration
    const enableRegex = /^https:\/\/.*\/mod\/quiz\/attempt.*$/
    if (!enableRegex.test(window.location.href))
        return

    Y.on("domready", function () {
        // add timer
        if (cfg.improveTimer
            && $(".qnbutton.notyetanswered").length != 0
            && M.mod_quiz.timer.endtime != 0)
            new ImprovedTimer(M.mod_quiz.timer)

        // return if no server address
        if (cfg.serverAddress == "")
            return

        // add status bar
        const serverStatusBar = new ServerStatusBar($("#mod_quiz_navblock > .card-body"))

        // create connection to server
        const conn = new Connection(cfg.serverAddress, cmid, attempt)
        conn.onSuccess = () => serverStatusBar.status = "ok"
        conn.onFail = (t, u, v, r) => {
            serverStatusBar.status = "failed"
        }

        // create current page's question map
        const qmap = new QuestionMap(document.body, conn)

        // refresh question map every second
        qmap.updateAll()
        if (qmap.size != 0) {
            window.setInterval((qmap.updateAll).bind(qmap), 1000)
        }
    })
})();
