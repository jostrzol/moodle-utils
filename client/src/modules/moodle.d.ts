// Moodle
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