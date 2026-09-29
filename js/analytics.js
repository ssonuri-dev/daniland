/* =========================================================================
 * 다니랜드 - 구글 애널리틱스 (GA4)
 *
 * 어느 페이지를 얼마나 여는지 보려고 붙였습니다. 아래 ID 한 줄만 고치면 됩니다.
 * ID 를 비우면 아무것도 하지 않습니다.
 *
 * 배포된 사이트(https)에서만 켜집니다 — file:// 이나 python 서버(localhost)로
 * 열 때는 구글 스크립트를 받지 않으므로 인터넷 없이도 그대로 돕니다.
 * 아이가 쓰는 곳이라 광고용 신호(Google signals·광고 개인화)는 끕니다.
 *
 * 각 HTML 의 <head> 맨 끝에서 부릅니다. 전역은 gtag·dataLayer 뿐이고
 * 다른 js 를 전혀 쓰지 않는 독립 파일이라 로드 순서와 상관없습니다.
 * ========================================================================= */

(function () {
  var ID = 'G-XQ56XGRE6Q';         // ★ 측정 ID (여기만 고치세요)

  if (!ID) return;
  if (location.protocol !== 'https:') return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };

  window.gtag('js', new Date());
  window.gtag('config', ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);
})();
