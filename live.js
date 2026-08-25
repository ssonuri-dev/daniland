// 실제 배포된 주소를 브라우저로 열어, 404·콘솔 오류·화면 렌더를 확인합니다.
const url = process.argv[2], act = process.argv[3] || '';
(async () => {
  const t = await (await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let id = 0; const p = new Map(); const errors = [], failed = [];
  const send = (m, params = {}) => new Promise(r => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params })); });
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); return; }
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(m.params.entry.text);
    if (m.method === 'Network.responseReceived' && m.params.response.status >= 400)
      failed.push(m.params.response.status + ' ' + m.params.response.url);
  };
  await new Promise(r => ws.onopen = r);
  await send('Page.enable'); await send('Log.enable'); await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 800, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  await new Promise(r => setTimeout(r, 2500));
  const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true })).result.result.value;
  if (act) { await ev(act); await new Promise(r => setTimeout(r, 1500)); }
  const info = await ev(`JSON.stringify({제목:document.title, 카드수:document.querySelectorAll('.card,.choice').length,
    본문글자:(document.body.innerText||'').replace(/\s+/g,' ').trim().slice(0,70)})`);
  console.log(url);
  console.log('   ' + info);
  console.log('   실패한 요청: ' + (failed.length ? failed.join(', ') : '없음') + ' / 콘솔 오류: ' + (errors.length ? errors.join(' | ') : '없음'));
  await fetch('http://127.0.0.1:9222/json/close/' + t.id); ws.close();
})();
