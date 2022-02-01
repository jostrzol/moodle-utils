// ==UserScript==
// @name        moodle-utils [dev]
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
// @connect     localhost
// @grant       GM_getValue
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// ==/UserScript==
'use strict';

(function () {
  const url = `http://localhost:8124/bundle.user.js?${Date.now()}`
  new Promise(function loadBundleFromServer(resolve, reject) {
    const req = GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function (r) {
        if (r.status !== 200) {
          return reject(r)
        }
        resolve(r.responseText)
      },
      onerror: e => reject(e)
    })
    if (req && 'catch' in req) {
      req.catch(e => { /* ignore */ })
    }
  }).catch(function (e) {
    const log = function (obj, b) {
      let prefix = 'loadBundleFromServer: '
      try {
        prefix = GM_info.script.name + ': '
      } catch (e) { }
      if (b) {
        console.log(prefix + obj, b)
      } else {
        console.log(prefix, obj)
      }
    }
    if (e && 'status' in e) {
      if (e.status <= 0) {
        log('Server is not responding')
        GM_getValue('scriptlastsource3948218', false).then(function (src) {
          if (src) {
            log('%cExecuting cached script version', 'color: Crimson; font-size:x-large;')
            /* eslint-disable no-eval */
            eval(src)
          }
        })
      } else {
        log('HTTP status: ' + e.status)
      }
    } else {
      log(e)
    }
  }).then(function (s) {
    if (s) {
      /* eslint-disable no-eval */
      eval(`${s}
//# sourceURL=${url}`)
      GM_setValue('scriptlastsource3948218', s)
    }
  })
})()