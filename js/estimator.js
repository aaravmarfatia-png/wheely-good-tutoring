/*
 * estimator.js — Grade Estimator page logic.
 * Loaded with `defer`. Plain script (non-module); no JSON / render.js involved.
 *
 * The core math lives in a PURE function (estimateGrade) so it can be
 * unit-checked with node. The DOM is built with textContent only — user-entered
 * numbers are never interpolated into innerHTML.
 *
 * Formula (standard, honest):
 *   r      = remain / 100            (fraction of grade still ungraded)
 *   locked = 1 - r                   (already-decided portion)
 *   needed = (target - current * locked) / r      [percentage points]
 *          = current + (target - current) / r     (equivalent form)
 *   `needed` is the average score required on the remaining work.
 */
(function (global) {
  'use strict';

  /**
   * Pure calculation. Returns a plain result object; does not touch the DOM.
   *
   * @param {number} current - current grade %, 0..100
   * @param {number} target  - target grade %, 0..100
   * @param {number} remain  - % of grade still remaining, 0..100
   * @returns {{status:string, needed:(number|null), onTrack:boolean,
   *            meetsTarget:(boolean|undefined)}}
   */
  function estimateGrade(current, target, remain) {
    // Validate: all three must be finite numbers within 0..100.
    var vals = [current, target, remain];
    for (var i = 0; i < vals.length; i++) {
      var v = vals[i];
      if (typeof v !== 'number' || !isFinite(v) || v < 0 || v > 100) {
        return { status: 'invalid', needed: null, onTrack: false };
      }
    }

    var r = remain / 100;
    var locked = 1 - r;

    // No remaining work: grade is locked. Guard against divide-by-zero.
    if (r === 0) {
      return {
        status: 'locked',
        needed: null,
        onTrack: false,
        meetsTarget: current >= target
      };
    }

    // Required average on the remaining work.
    var needed = (target - current * locked) / r;

    var onTrack = target <= current;

    var status;
    if (needed < 0) {
      status = 'guaranteed';       // target hit no matter what happens
    } else if (needed > 100) {
      status = 'unreachable';      // can't get there with remaining work alone
    } else {
      status = 'reachable';
    }

    return { status: status, needed: needed, onTrack: onTrack };
  }

  /**
   * Achievability label + pill class from `needed` (only meaningful when
   * there's remaining work and needed >= 0, but the thresholds also cover
   * needed > 100).
   */
  function achievability(needed) {
    if (needed > 100) {
      return {
        label: 'Not reachable with the work that\u2019s left \u2014 but tutoring can help going forward.',
        pill: 'pill-hard'
      };
    }
    if (needed > 95) {
      return {
        label: 'Tough but possible \u2014 aim for near-perfect on what\u2019s left.',
        pill: 'pill-push'
      };
    }
    if (needed > 85) {
      return {
        label: 'A real push \u2014 consistent work needed.',
        pill: 'pill-push'
      };
    }
    if (needed > 70) {
      return {
        label: 'Achievable with steady effort.',
        pill: 'pill-ok'
      };
    }
    return {
      label: 'Very achievable \u2014 you\u2019ve got this.',
      pill: 'pill-ok'
    };
  }

  // Round to one decimal place for display.
  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  // Expose the pure functions for node checks / reuse.
  global.GradeEstimator = {
    estimateGrade: estimateGrade,
    achievability: achievability,
    round1: round1
  };

  // --- DOM wiring (skipped in non-browser environments like node) ---
  if (typeof document === 'undefined') {
    return;
  }

  function init() {
    var form = document.getElementById('estimator-form');
    var result = document.getElementById('estimator-result');
    if (!form || !result) {
      return;
    }

    var currentEl = document.getElementById('current-grade');
    var targetEl = document.getElementById('target-grade');
    var remainNum = document.getElementById('remaining-number');
    var remainRange = document.getElementById('remaining-range');

    // Keep the number input and the range slider in sync (both ways).
    remainNum.addEventListener('input', function () {
      remainRange.value = remainNum.value;
      scheduleCompute();
    });
    remainRange.addEventListener('input', function () {
      remainNum.value = remainRange.value;
      scheduleCompute();
    });

    currentEl.addEventListener('input', scheduleCompute);
    targetEl.addEventListener('input', scheduleCompute);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      compute();
    });

    // Debounced live update as the user types.
    var timer = null;
    function scheduleCompute() {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(compute, 250);
    }

    // Parse a field; empty string -> NaN so we can show a friendly message.
    function parse(el) {
      var raw = el.value.trim();
      if (raw === '') {
        return NaN;
      }
      return Number(raw);
    }

    function compute() {
      var current = parse(currentEl);
      var target = parse(targetEl);
      var remain = parse(remainNum);

      var res = global.GradeEstimator.estimateGrade(current, target, remain);
      render(res, { current: current, target: target, remain: remain });
    }

    // Build the result region with textContent only.
    function render(res, inputs) {
      // Clear previous output.
      while (result.firstChild) {
        result.removeChild(result.firstChild);
      }

      if (res.status === 'invalid') {
        var warn = document.createElement('p');
        warn.className = 'estimator-msg';
        warn.textContent =
          'Please enter all three values as numbers between 0 and 100.';
        result.appendChild(warn);
        return;
      }

      if (res.status === 'locked') {
        var lockMsg = document.createElement('p');
        lockMsg.className = 'estimator-msg';
        if (res.meetsTarget) {
          lockMsg.textContent =
            'There\u2019s no remaining work, so your grade is locked \u2014 and the good ' +
            'news is you already meet your target. Nice work.';
        } else {
          lockMsg.textContent =
            'There\u2019s no remaining work, so your grade is locked in and can\u2019t ' +
            'change. It currently falls short of your target \u2014 worth chatting with ' +
            'your teacher about any options.';
        }
        result.appendChild(lockMsg);
        result.appendChild(buildDisclaimer());
        result.appendChild(buildCta());
        return;
      }

      var needed = res.needed;
      var neededDisplay = round1(needed);

      // Main sentence.
      var lead = document.createElement('p');
      lead.className = 'estimator-lead';

      if (res.status === 'guaranteed') {
        lead.textContent =
          'You\u2019ll reach ' + round1(inputs.target) + '% no matter what happens on the ' +
          'remaining ' + round1(inputs.remain) + '% \u2014 even a zero keeps you at or above ' +
          'your target. You\u2019re set.';
      } else {
        var verb = res.onTrack ? 'to stay at' : 'to reach';
        lead.textContent =
          'To ' + (res.onTrack ? 'stay at ' : 'reach ') + round1(inputs.target) +
          '%, you\u2019ll need to average about ' + neededDisplay +
          '% on the remaining ' + round1(inputs.remain) + '% of your grade.';
      }
      result.appendChild(lead);

      if (res.onTrack && res.status !== 'guaranteed') {
        var onTrackNote = document.createElement('p');
        onTrackNote.className = 'estimator-msg';
        onTrackNote.textContent =
          'You\u2019re already on track \u2014 your target is at or below your current grade, ' +
          'so the number above is the minimum you\u2019d need to hold your ground.';
        result.appendChild(onTrackNote);
      }

      // Achievability pill (meaningful for any non-negative needed).
      if (needed >= 0) {
        var info = achievability(needed);
        var pillWrap = document.createElement('p');
        pillWrap.className = 'pill-row';
        var pill = document.createElement('span');
        pill.className = 'pill ' + info.pill;
        pill.textContent = info.label;
        pillWrap.appendChild(pill);
        result.appendChild(pillWrap);
      }

      if (res.status === 'unreachable') {
        var hard = document.createElement('p');
        hard.className = 'estimator-msg';
        hard.textContent =
          'That\u2019s above 100%, so the target isn\u2019t reachable with the work that\u2019s ' +
          'left alone. Talk to your teacher about any extra credit, and tutoring can help you ' +
          'finish as strong as possible.';
        result.appendChild(hard);
      }

      result.appendChild(buildDisclaimer());
      result.appendChild(buildCta());
    }

    function buildDisclaimer() {
      var d = document.createElement('p');
      d.className = 'estimator-disclaimer';
      d.textContent =
        'This is an estimate. Real grades depend on your class\u2019s exact weighting and ' +
        'grading policy, so check with your teacher.';
      return d;
    }

    function buildCta() {
      var p = document.createElement('p');
      p.className = 'btn-row';
      var a = document.createElement('a');
      a.className = 'btn btn-secondary';
      a.href = 'signup.html';
      a.textContent = 'Want help getting there? Sign up for tutoring.';
      p.appendChild(a);
      return p;
    }

    // Shorthand so render() can call the exposed rounder.
    function round1(n) {
      return global.GradeEstimator.round1(n);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
