/* =========================================================================
 * 다니랜드 - 말하기(TTS) 도우미
 *
 * 브라우저에 내장된 음성 합성 기능을 사용합니다.
 * 목소리 품질 차이가 커서, 자연스러운 목소리를 먼저 고르고
 * 사용자가 직접 고른 목소리가 있으면 그것을 최우선으로 씁니다.
 * ========================================================================= */

(function () {
  var synth = window.speechSynthesis;
  var voices = [];
  var rate = loadRate();

  function loadVoices() {
    if (!synth) return;
    try { voices = synth.getVoices() || []; } catch (e) { voices = []; }
  }

  loadVoices();
  if (synth && typeof synth.addEventListener === 'function') {
    synth.addEventListener('voiceschanged', loadVoices);
  }

  /* ---------- 목소리 고르기 ---------- */

  // 이름만 보고도 품질을 어느 정도 알 수 있습니다.
  //   Natural / Neural : 엣지의 최신 신경망 목소리 (가장 사람 같음)
  //   Online           : 인터넷으로 합성 — 대체로 품질이 좋음
  //   Google           : 크롬 기본 제공 — 윈도우 기본보다 훨씬 자연스러움
  // 반대로 이름에 아무 표시가 없는 로컬 목소리는 대개 딱딱한 편입니다.
  function score(v, lang) {
    var name = (v.name || '').toLowerCase();
    var vl = (v.lang || '').toLowerCase().replace('_', '-');
    var s = 0;

    if (name.indexOf('natural') >= 0) s += 100;
    if (name.indexOf('neural') >= 0) s += 90;
    if (name.indexOf('premium') >= 0 || name.indexOf('enhanced') >= 0) s += 70;
    if (name.indexOf('online') >= 0) s += 50;
    if (name.indexOf('google') >= 0) s += 45;

    if (vl === lang.toLowerCase()) s += 20;        // 지역까지 정확히 일치
    if (v.default) s += 3;
    if (v.localService) s += 2;                    // 동점일 때만 영향 (인터넷 없이도 됨)

    return s;
  }

  // 해당 언어에서 쓸 수 있는 목소리를 좋은 순서로 돌려줍니다.
  function voicesFor(lang) {
    if (!voices.length) loadVoices();
    lang = (lang || 'en-US').toLowerCase().replace('_', '-');
    var base = lang.split('-')[0];

    return voices
      .filter(function (v) {
        var vl = (v.lang || '').toLowerCase().replace('_', '-');
        return vl.split('-')[0] === base;
      })
      .sort(function (a, b) { return score(b, lang) - score(a, lang); });
  }

  // 실제로 말할 때 시도할 순서 (사용자가 고른 목소리가 있으면 맨 앞)
  function candidates(lang) {
    var ranked = voicesFor(lang);
    var savedURI = getPreferred(lang);
    if (!savedURI) return ranked;

    var chosen = null;
    var rest = [];
    ranked.forEach(function (v) {
      if (v.voiceURI === savedURI) chosen = v; else rest.push(v);
    });
    return chosen ? [chosen].concat(rest) : ranked;
  }

  /* ---------- 저장해 두는 설정 ---------- */

  function getPreferred(lang) {
    try { return localStorage.getItem('daniland.voice.' + lang) || ''; }
    catch (e) { return ''; }
  }

  function setPreferred(lang, voiceURI) {
    try {
      if (voiceURI) localStorage.setItem('daniland.voice.' + lang, voiceURI);
      else localStorage.removeItem('daniland.voice.' + lang);
    } catch (e) { /* 무시 */ }
  }

  function loadRate() {
    try {
      var v = parseFloat(localStorage.getItem('daniland.rate'));
      return (v >= 0.4 && v <= 1.2) ? v : 0.75;
    } catch (e) { return 0.75; }
  }

  function setRate(v) {
    rate = Math.min(1.2, Math.max(0.4, parseFloat(v) || 0.75));
    try { localStorage.setItem('daniland.rate', String(rate)); } catch (e) { /* 무시 */ }
  }

  /* ---------- 말하기 ---------- */

  // speak() 를 부를 때마다 하나씩 올라갑니다.
  // 이미 지나간 발화가 되살아나 다시 말하는 것을 막는 표식입니다.
  var speakSeq = 0;

  function speak(text, lang, options) {
    if (!synth) return;
    options = options || {};
    lang = lang || 'en-US';

    var list = candidates(lang);
    var forced = options.voice || null;   // 미리듣기에서 특정 목소리를 지정할 때
    if (forced) list = [forced];

    var seq = ++speakSeq;
    synth.cancel();   // 이전 소리가 남아 있으면 지웁니다.
    tryIndex(0);

    function tryIndex(i) {
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      if (list[i]) u.voice = list[i];
      u.rate = options.rate || rate;
      u.pitch = options.pitch || 1.05;
      u.volume = 1;

      var done = false;

      u.onend = function () {
        if (done) return;
        done = true;
        if (options.onend) options.onend();
      };

      // 인터넷이 끊겨 온라인 목소리가 실패하면 다음 목소리로 넘어갑니다.
      u.onerror = function (e) {
        if (done) return;
        done = true;

        // 새로 말하기 시작해서 끊긴 것은 목소리 탓이 아닙니다.
        // 여기서 다음 목소리로 넘어가면 이미 지나간 말을 다시 하게 됩니다.
        var why = e && e.error;
        var stale = (seq !== speakSeq);
        if (stale || why === 'canceled' || why === 'interrupted') {
          if (options.onend) options.onend();
          return;
        }

        if (!forced && i + 1 < list.length) tryIndex(i + 1);
        else if (options.onend) options.onend();
      };

      try { synth.resume(); } catch (e) { /* 무시 */ }
      synth.speak(u);
    }
  }

  window.TTS = {
    supported: !!synth,

    // 모바일/태블릿은 첫 소리가 사용자의 터치 안에서 시작돼야 합니다.
    unlock: function () {
      if (!synth) return;
      loadVoices();
      try {
        var u = new SpeechSynthesisUtterance(' ');
        u.volume = 0;
        synth.speak(u);
      } catch (e) { /* 무시 */ }
    },

    speak: speak,
    voicesFor: voicesFor,
    getPreferred: getPreferred,
    setPreferred: setPreferred,
    getRate: function () { return rate; },
    setRate: setRate,

    // 지금 실제로 쓰이게 될 목소리
    currentVoice: function (lang) {
      var list = candidates(lang);
      return list.length ? list[0] : null;
    },

    cancel: function () {
      if (synth) { try { synth.cancel(); } catch (e) { /* 무시 */ } }
    }
  };
})();
