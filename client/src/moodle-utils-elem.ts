export default function MoodleUtilsElem<T extends HTMLElement = HTMLElement>(str: string): JQuery<T> {
    return $<T>(str).addClass("moodle-utils")
}