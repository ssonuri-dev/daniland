/* =========================================================================
 * 다니랜드 - 카메라로 손 찾기
 *
 * 앞 카메라 영상에서 '손이 지금 어디 있나' 하나만 찾아 돌려줍니다.
 * 풍선 터뜨리기(손 모드)와 부수기가 같이 씁니다.
 *
 * 어떻게 찾나 — 라이브러리를 쓰지 않습니다 (이 저장소는 외부 의존성이 없고
 * file:// 로도 돌아야 합니다). 영상을 80x60 으로 줄여 그리고 직전 프레임과
 * 밝기를 견줘, 달라진 점이 제일 많이 몰린 자리를 손으로 봅니다.
 *
 *   ⚠️ 움직임으로 찾는 것이라 손을 멈추면 못 찾습니다. 그래서 놓쳐도 마지막
 *   자리를 그대로 들고 있고(live 만 false), 부르는 쪽이 알아서 씁니다.
 *   손을 가만히 두고 기다리는 놀이(떨어지는 것 받기)는 이 방식으로 만들지 마세요.
 *
 *   뒤에서 누가 지나가도 움직임이라 잡힙니다. 온 화면에서 제일 센 칸 하나를
 *   고르고 그 둘레(GRAB)만 더하는 것이 그 대비입니다 - 제일 큰 덩어리 하나만 남습니다.
 *
 * 쓰는 법
 *   Hand.supported()            이 기기에서 카메라를 쓸 수 있나
 *   Hand.start(videoEl)         켜기 (약속을 돌려줍니다 - 권한 거절이면 실패)
 *   Hand.read()                 { x, y, power, live } - x·y 는 0~1
 *   Hand.follow(커서, 판, onHit) 커서를 손 자리에 놓고 닿은 곳을 알려 주기
 *   Hand.stop()                 끄기 (화면을 나갈 때 꼭 불러 주세요)
 *
 * x 는 거울처럼 뒤집혀 있습니다 - 아이가 오른쪽으로 손을 옮기면 x 가 커집니다.
 * ========================================================================= */

(function () {
  // 처리용 크기 - 손 하나를 찾는 데는 이만해도 충분하고, 작을수록 태블릿이 편합니다.
  var W = 80;
  var H = 60;

  var CELL = 5;                    // 칸 하나가 5x5 픽셀
  var GW = W / CELL;               // 16칸
  var GH = H / CELL;               // 12칸

  var DIFF = 24;                   // 이만큼 밝기가 달라지면 '움직였다'
  var GRAB = 2;                    // 제일 센 칸에서 몇 칸까지 한 덩어리로 볼까
  var MIN = 35;                    // 손으로 치기엔 너무 적은 움직임
  var FULL = 300;                  // 이 정도면 power 1 (세게 휘두른 것)
  var FLASH = 0.4;                 // 온 화면의 이만큼이 변하면 불빛이 바뀐 것 - 버립니다

  var TOUCH = 0.12;                // follow() 가 이보다 약한 움직임은 스친 것으로 봅니다

  var SMOOTH = 0.4;                // 자리 따라가는 빠르기 (1 이면 안 부드럽게)
  var GAIN = 1.25;                 // 가운데에서 밀어내기 - 팔을 조금만 뻗어도 구석까지 갑니다

  var video = null;
  var stream = null;
  var canvas = null;
  var ctx = null;

  var prev = null;                 // 직전 프레임의 밝기
  var energy = new Int32Array(GW * GH);

  var pt = { x: 0.5, y: 0.5, power: 0, live: false };
  var raf = 0;
  var followRaf = 0;
  var on = false;

  function supported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  function start(videoEl) {
    if (!supported()) return Promise.reject(new Error('no-camera'));
    if (on) return Promise.resolve();

    video = videoEl;

    // 낮은 해상도로 충분합니다 - 어차피 80x60 으로 줄여서 봅니다.
    var want = {
      audio: false,
      video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } }
    };

    return navigator.mediaDevices.getUserMedia(want).then(function (s) {
      stream = s;
      video.srcObject = s;
      video.muted = true;
      video.playsInline = true;

      return video.play().then(ready, ready);
    });
  }

  // 첫 프레임이 들어와야 크기를 알 수 있습니다.
  function ready() {
    canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    ctx = canvas.getContext('2d', { willReadFrequently: true });

    // 거울로 뒤집어 그립니다 - 아이가 보는 것과 손이 같은 쪽으로 움직이게.
    ctx.translate(W, 0);
    ctx.scale(-1, 1);

    prev = null;
    pt = { x: 0.5, y: 0.5, power: 0, live: false };
    on = true;

    raf = requestAnimationFrame(tick);
  }

  function stop() {
    on = false;
    stopFollow();
    cancelAnimationFrame(raf);
    raf = 0;

    if (stream) {
      stream.getTracks().forEach(function (t) { t.stop(); });
      stream = null;
    }

    if (video) {
      video.srcObject = null;
      video = null;
    }

    prev = null;
  }

  function read() { return pt; }

  /* ---------- 커서 따라가기 ----------
   * 손 자리에 커서를 놓고, 손이 닿은 자리를 화면 좌표로 알려 줍니다.
   * 부르는 쪽마다 똑같이 짜 두면 한쪽만 고쳐져 어긋나므로 여기 한 번만 둡니다.
   *
   *   cursor  손 자리에 놓을 요소 (.hand-cursor - transform 으로 옮깁니다)
   *   field   놀이판 (이 안에서의 자리로 셉니다)
   *   onHit   function (x, y, power) - x·y 는 화면 좌표(getBoundingClientRect 와 같은 기준)
   * -------------------------------------------------------------------- */

  function follow(cursor, field, onHit) {
    stopFollow();

    function tick() {
      followRaf = requestAnimationFrame(tick);

      var hand = read();
      var x = hand.x * field.clientWidth;
      var y = hand.y * field.clientHeight;
      var half = cursor.offsetWidth / 2;

      // 손을 놓쳐도 커서를 지우지 않고 마지막 자리에 흐리게 둡니다
      // (사라지면 아이가 어디를 봐야 할지 몰라 당황합니다).
      cursor.style.transform = 'translate(' + (x - half) + 'px,' + (y - half) + 'px)';
      cursor.classList.toggle('lost', !hand.live);

      if (!hand.live || hand.power < TOUCH) return;

      var box = field.getBoundingClientRect();
      onHit(box.left + x, box.top + y, hand.power);
    }

    followRaf = requestAnimationFrame(tick);
  }

  function stopFollow() {
    cancelAnimationFrame(followRaf);
    followRaf = 0;
  }

  /* ---------- 한 프레임 ---------- */

  function tick() {
    if (!on) return;
    raf = requestAnimationFrame(tick);

    // 아직 영상이 안 들어왔으면 건너뜁니다.
    if (!video || video.readyState < 2) return;

    ctx.drawImage(video, 0, 0, W, H);

    var img;
    try {
      img = ctx.getImageData(0, 0, W, H).data;
    } catch (e) {
      return;  // file:// 에서 막히는 기기가 있습니다 - 조용히 넘어갑니다
    }

    var now = gray(img);

    if (!prev) { prev = now; return; }

    var moved = diff(now, prev);
    prev = now;

    // 불이 켜지거나 카메라가 밝기를 다시 맞추면 온 화면이 변합니다 - 손이 아닙니다.
    if (moved > W * H * FLASH) { pt.live = false; pt.power = 0; return; }
    if (moved < MIN) { pt.live = false; pt.power = 0; return; }

    locate();
  }

  // 밝기만 뽑습니다 (색은 안 씁니다).
  function gray(img) {
    var out = new Uint8Array(W * H);

    for (var i = 0, p = 0; i < out.length; i++, p += 4) {
      out[i] = (img[p] * 77 + img[p + 1] * 150 + img[p + 2] * 29) >> 8;
    }

    return out;
  }

  // 달라진 점을 칸마다 세어 두고, 모두 몇 개였는지 돌려줍니다.
  function diff(now, old) {
    var total = 0;
    var i;

    for (i = 0; i < energy.length; i++) energy[i] = 0;

    for (var y = 0; y < H; y++) {
      var row = (y / CELL | 0) * GW;

      for (var x = 0; x < W; x++) {
        i = y * W + x;
        var d = now[i] - old[i];
        if (d < 0) d = -d;

        if (d > DIFF) {
          energy[row + (x / CELL | 0)] += 1;
          total += 1;
        }
      }
    }

    return total;
  }

  // 제일 센 칸 둘레만 더해 가운데를 냅니다 - 움직이는 것이 둘이면 큰 쪽만 남습니다.
  function locate() {
    var best = 0;
    var bx = 0;
    var by = 0;
    var gx, gy;

    for (gy = 0; gy < GH; gy++) {
      for (gx = 0; gx < GW; gx++) {
        var e = energy[gy * GW + gx];
        if (e > best) { best = e; bx = gx; by = gy; }
      }
    }

    var sum = 0;
    var sx = 0;
    var sy = 0;

    for (gy = Math.max(0, by - GRAB); gy <= Math.min(GH - 1, by + GRAB); gy++) {
      for (gx = Math.max(0, bx - GRAB); gx <= Math.min(GW - 1, bx + GRAB); gx++) {
        var w = energy[gy * GW + gx];
        if (!w) continue;

        sum += w;
        sx += w * (gx + 0.5);
        sy += w * (gy + 0.5);
      }
    }

    if (sum < MIN) { pt.live = false; pt.power = 0; return; }

    var nx = spread(sx / sum / GW);
    var ny = spread(sy / sum / GH);

    // 처음 잡을 때는 부드럽게 할 것이 없어 그 자리로 바로 갑니다.
    var k = pt.live ? SMOOTH : 1;

    pt.x += (nx - pt.x) * k;
    pt.y += (ny - pt.y) * k;
    pt.power = Math.min(1, sum / FULL);
    pt.live = true;
  }

  // 가운데에서 바깥으로 조금 밀어 줍니다 (팔이 짧아 구석까지 안 닿는 것을 메웁니다).
  function spread(v) {
    var out = 0.5 + (v - 0.5) * GAIN;
    return out < 0 ? 0 : (out > 1 ? 1 : out);
  }

  window.Hand = {
    supported: supported,
    start: start,
    stop: stop,
    read: read,
    follow: follow
  };
})();
