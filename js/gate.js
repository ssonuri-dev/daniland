/* =========================================================================
 * 다니랜드 - 들어올 때 비밀번호
 *
 * ⚠️ 이것은 자물쇠가 아니라 문패입니다.
 * 사이트가 GitHub Pages(정적 파일)로 나가기 때문에 진짜 로그인은 만들 수 없고,
 * 소스 보기를 할 줄 아는 사람은 이 화면을 지나칠 수 있습니다.
 * "아무나 그냥 들어오는 곳은 아니에요" 를 보여 주는 용도로만 씁니다.
 *
 * 비밀번호는 바로 아래 PASS 한 줄만 고치면 바뀝니다 (숫자 몇 자리든 됩니다).
 * 바꾸면 이미 들어와 본 기기에서도 다시 물어봅니다.
 *
 * 각 HTML 의 <body> 맨 위에서 부를 것 — 그래야 내용이 비치기 전에 화면을 덮습니다.
 * 다른 js 를 전혀 쓰지 않는 독립 파일입니다.
 * ========================================================================= */

(function () {
  var PASS = '0504';               // ★ 비밀번호 (여기만 고치세요)
  var KEY = 'daniland.pass';       // 한 번 맞히면 이 기기에서는 다시 안 묻습니다

  var KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function remember() {
    try { localStorage.setItem(KEY, PASS); } catch (e) { /* 무시 */ }
  }

  // 이미 들어와 본 기기 — 비밀번호가 그대로면 묻지 않습니다.
  if (saved() === PASS) return;

  var typed = '';

  var gate = document.createElement('div');
  gate.className = 'gate';

  var dani = document.createElement('img');
  dani.src = 'dani.png';
  dani.alt = '다니';

  var title = document.createElement('h2');
  title.textContent = '다니랜드 🎈';

  var hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = '비밀번호를 눌러 주세요';

  var dots = document.createElement('div');
  dots.className = 'gate-dots';

  var pad = document.createElement('div');
  pad.className = 'gate-pad';

  KEYS.forEach(function (label) {
    if (!label) { pad.appendChild(document.createElement('span')); return; }

    var b = document.createElement('button');
    b.className = 'gate-key';
    b.textContent = label;
    b.addEventListener('click', function () {
      if (label === '⌫') { typed = typed.slice(0, -1); drawDots(); return; }
      press(label);
    });

    pad.appendChild(b);
  });

  gate.appendChild(dani);
  gate.appendChild(title);
  gate.appendChild(hint);
  gate.appendChild(dots);
  gate.appendChild(pad);
  document.body.appendChild(gate);

  drawDots();

  // PC 에서는 숫자키로도 누를 수 있게
  document.addEventListener('keydown', function (e) {
    if (!gate.parentNode) return;
    if (e.key >= '0' && e.key <= '9') press(e.key);
    else if (e.key === 'Backspace') { typed = typed.slice(0, -1); drawDots(); }
  });

  function press(digit) {
    if (typed.length >= PASS.length) return;
    typed += digit;
    drawDots();
    if (typed.length === PASS.length) setTimeout(check, 150);
  }

  function drawDots() {
    dots.innerHTML = '';

    for (var i = 0; i < PASS.length; i++) {
      var d = document.createElement('span');
      d.className = 'gate-dot' + (i < typed.length ? ' on' : '');
      dots.appendChild(d);
    }
  }

  function check() {
    if (typed === PASS) {
      remember();
      gate.classList.add('open');
      setTimeout(function () { gate.remove(); }, 320);
      return;
    }

    // 틀려도 혼내지 않습니다 — 한 번 흔들고 다시 받습니다.
    typed = '';
    drawDots();
    hint.textContent = '다시 한 번 눌러 볼까요?';

    gate.classList.remove('wrong');
    void gate.offsetWidth;
    gate.classList.add('wrong');
  }
})();
