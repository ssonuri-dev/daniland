/* =========================================================================
 * 다니랜드 - 목소리 고르기 패널 (어른용)
 * 여러 페이지에서 함께 씁니다.
 *
 *   VoicePicker.open({ lang: 'en-US', sample: function () { return 'apple'; } });
 * ========================================================================= */

(function () {
  var overlay = null;
  var listEl, hintEl, rateInput, rateVal;
  var opts = { lang: 'en-US', sample: function () { return 'hello'; } };

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="panel">' +
        '<h3>🎤 목소리 고르기</h3>' +
        '<p class="hint">눌러서 들어보고, 아이가 알아듣기 좋은 목소리를 골라 주세요.</p>' +
        '<div class="rate-row">' +
          '<span>느리게</span>' +
          '<input type="range" min="0.4" max="1.1" step="0.05">' +
          '<span>빠르게</span>' +
        '</div>' +
        '<div class="rate-val">말하기 속도 <b>0.75</b></div>' +
        '<div class="voice-list"></div>' +
        '<p class="hint vp-hint"></p>' +
        '<button class="big-btn">다 골랐어요</button>' +
      '</div>';

    document.body.appendChild(overlay);

    listEl = overlay.querySelector('.voice-list');
    hintEl = overlay.querySelector('.vp-hint');
    rateInput = overlay.querySelector('input[type=range]');
    rateVal = overlay.querySelector('.rate-val b');

    rateInput.addEventListener('input', function () {
      TTS.setRate(this.value);
      rateVal.textContent = Number(this.value).toFixed(2);
    });

    rateInput.addEventListener('change', function () {
      TTS.speak(opts.sample(), opts.lang);
    });

    overlay.querySelector('.big-btn').addEventListener('click', function () {
      TTS.cancel();
      overlay.hidden = true;
    });
  }

  function buildList() {
    var lang = opts.lang;
    var list = TTS.voicesFor(lang);
    var current = TTS.getPreferred(lang);

    if (!current) {
      var cur = TTS.currentVoice(lang);
      current = cur ? cur.voiceURI : '';
    }

    listEl.innerHTML = '';

    if (!list.length) {
      hintEl.textContent = '이 브라우저에 ' + lang + ' 목소리가 없어요. 크롬이나 엣지에서 열어 보세요.';
      return;
    }

    list.forEach(function (v, i) {
      var row = document.createElement('button');
      row.className = 'voice-row' + (v.voiceURI === current ? ' on' : '');

      var nm = document.createElement('span');
      nm.className = 'nm';
      nm.textContent = prettyName(v);

      var tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = (i === 0) ? '추천' : '▶';

      row.appendChild(nm);
      row.appendChild(tag);

      row.addEventListener('click', function () {
        TTS.setPreferred(lang, v.voiceURI);
        Array.prototype.forEach.call(listEl.children, function (x) {
          x.classList.toggle('on', x === row);
        });
        TTS.speak(opts.sample(), lang, { voice: v });
      });

      listEl.appendChild(row);
    });

    // 자연스러운 목소리가 하나도 없으면 안내해 줍니다.
    var hasGood = list.some(function (v) {
      return /natural|neural|online|google|premium|enhanced/i.test(v.name || '');
    });

    hintEl.textContent = hasGood
      ? '‘추천’이 대체로 가장 자연스러워요. 인터넷 연결이 필요한 목소리도 있어요.'
      : '더 자연스러운 목소리를 쓰려면 이 파일을 엣지(Edge)나 크롬에서 열어 보세요. ' +
        '윈도우 설정 → 시간 및 언어 → 음성 에서 목소리를 추가할 수도 있어요.';
  }

  function prettyName(v) {
    var name = (v.name || '').replace(/\s*-\s*(English|Korean)[^-]*$/i, '');
    return name.split(' - ')[0].trim() || v.name;
  }

  window.VoicePicker = {
    open: function (options) {
      if (!window.TTS || !TTS.supported) return;
      opts.lang = (options && options.lang) || 'en-US';
      if (options && options.sample) opts.sample = options.sample;

      TTS.unlock();
      if (window.SFX) SFX.unlock();

      if (!overlay) build();

      rateInput.value = TTS.getRate();
      rateVal.textContent = TTS.getRate().toFixed(2);
      buildList();
      overlay.hidden = false;
    },

    isOpen: function () { return !!overlay && !overlay.hidden; }
  };
})();
