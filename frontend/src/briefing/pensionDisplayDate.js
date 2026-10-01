/* 화면 표시 기준일 = 오늘. 시연 자료(display-data)는 기준일 2026-09-29로 작성되어 있고 Agent 요청·부점 manifest·
 * 데이터 해시는 그 값을 그대로 쓴다. 이 모듈은 "화면에 그릴 때만" 모든 날짜를 (오늘 − 자료 기준일)만큼 평행이동한다.
 * 그래서 D-n 뱃지·경과일수·만기 창 같은 상대값은 그대로 맞고, 기준일 문구·만기일·거래일·자료 날짜는 전부 오늘 기준으로 보인다.
 * 실제 시계 기록(요청·응답·단계 시각: *_at / *At, 상담 timeline.at)은 이미 오늘이므로 옮기지 않는다.
 * 시연·검사에서 날짜를 고정하려면 window.__PENSION_DISPLAY_DATE = 'YYYY-MM-DD' (Node: globalThis)를 모듈보다 먼저 두면 된다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(globalThis);
  else root.PensionDisplayDate = factory(root);
})(typeof window === 'undefined' ? globalThis : window, function (root) {
  'use strict';
  var DEFAULT_BASE = '2026-09-29';
  var DAY_MS = 86400000, DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
  // 실제 처리 시각 키: 값이 ISO 시각이어도 자료 날짜가 아니므로 건너뛴다. (openedAt·verifiedAt·publishedAt 같은 자료 날짜는 옮긴다.)
  var SKIP_KEYS = { at: 1, started_at: 1, ended_at: 1, finished_at: 1, requested_at: 1, responded_at: 1, startedAt: 1, endedAt: 1, finishedAt: 1, requestedAt: 1, respondedAt: 1, sentAt: 1, front: 1 };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var toDays = function (y, m, d) { return Date.UTC(y, m - 1, d) / DAY_MS; };
  var fromDays = function (n) { var t = new Date(n * DAY_MS); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; };
  var valid = function (y, m, d) { return m >= 1 && m <= 12 && d >= 1 && d <= 31 && new Date(Date.UTC(y, m - 1, d)).getUTCDate() === d; };
  var iso = function (p) { return p.y + '-' + pad(p.m) + '-' + pad(p.d); };
  var parts = function (s) { return { y: +s.slice(0, 4), m: +s.slice(5, 7), d: +s.slice(8, 10) }; };
  function dayDiff(from, to) { var a = parts(from), b = parts(to); return toDays(b.y, b.m, b.d) - toDays(a.y, a.m, a.d); }
  function addDays(day, n) { var p = parts(day); return iso(fromDays(toDays(p.y, p.m, p.d) + n)); }

  // 자료 기준일: 반입 고객 스냅샷(briefingMeta.asOfDate)의 다수값. 스냅샷이 없으면(단독 검사) 기본값.
  var baseCache = null;
  function base() {
    if (baseCache) return baseCache;
    var fixtures = root.PensionBriefingFixtures, count = {}, best = null;
    if (fixtures && Array.isArray(fixtures.customers)) fixtures.customers.forEach(function (r) {
      var d = r && r.briefingMeta && r.briefingMeta.asOfDate;
      if (typeof d !== 'string' || !DAY_RE.test(d)) return;
      count[d] = (count[d] || 0) + 1; if (best == null || count[d] > count[best]) best = d;
    });
    baseCache = best || DEFAULT_BASE;
    return baseCache;
  }
  // 오늘(Asia/Seoul). 고정 날짜가 주입되어 있으면 그 값.
  function today() {
    var fixed = root.__PENSION_DISPLAY_DATE;
    if (typeof fixed === 'string' && DAY_RE.test(fixed)) return fixed;
    var now = new Date();
    try {
      var p = {};
      new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now).forEach(function (x) { p[x.type] = x.value; });
      if (p.year && p.month && p.day) return p.year + '-' + p.month + '-' + p.day;
    } catch (_) { /* Intl 미지원: 아래 UTC+9 계산 */ }
    var k = new Date(now.getTime() + 9 * 3600000);
    return iso({ y: k.getUTCFullYear(), m: k.getUTCMonth() + 1, d: k.getUTCDate() });
  }
  function offsetDays() { return dayDiff(base(), today()); }

  // 'YYYY-MM-DD' 하나를 옮긴다. 형식이 아니면 그대로.
  function shiftDay(day, offset) {
    if (typeof day !== 'string' || !DAY_RE.test(day)) return day;
    var n = offset == null ? offsetDays() : offset;
    return n ? addDays(day, n) : day;
  }
  // 문장 안의 날짜 표기를 전부 옮긴다: 2026년 9월 29일 · 2026-09-29(T… 시각은 유지) · 2026.09.29 · 2026/09/29 · 9월 29일.
  // D-n·경과일수·'2026.09' 같은 월 단위 표기는 상대값/월 표기라 손대지 않는다.
  var TEXT_RE = /(\d{4})년\s?(\d{1,2})월\s?(\d{1,2})일|(?<!\d)(\d{4})([-./])(\d{2})\5(\d{2})(?!\d)|(?<!\d)(\d{1,2})월\s?(\d{1,2})일/g;
  function shiftText(text, offset) {
    if (typeof text !== 'string') return text;
    var n = offset == null ? offsetDays() : offset;
    if (!n || !/\d/.test(text)) return text;
    var b = parts(base());
    return text.replace(TEXT_RE, function (m, y1, m1, d1, y2, sep, m2, d2, m3, d3) {
      var y, mo, d, kind;
      if (y1 != null) { y = +y1; mo = +m1; d = +d1; kind = 'ko'; }
      else if (y2 != null) { y = +y2; mo = +m2; d = +d2; kind = 'num'; }
      else { mo = +m3; d = +d3; kind = 'md'; y = mo >= b.m - 6 ? b.y : b.y + 1; }
      if (!valid(y, mo, d)) return m;
      var p = fromDays(toDays(y, mo, d) + n);
      if (kind === 'ko') return p.y + '년 ' + p.m + '월 ' + p.d + '일';
      if (kind === 'num') return p.y + sep + pad(p.m) + sep + pad(p.d);
      return p.m + '월 ' + p.d + '일';
    });
  }
  // 객체·배열을 깊은 복사하며 모든 문자열의 날짜를 옮긴다. 실제 시계 키(SKIP_KEYS)는 값째 그대로 복사한다.
  function shiftValue(value, offset) {
    var n = offset == null ? offsetDays() : offset;
    if (value === undefined) return undefined;
    if (typeof value === 'string') return shiftText(value, n);
    var out = JSON.parse(JSON.stringify(value));
    if (!n) return out;
    (function walk(v) {
      if (Array.isArray(v)) { for (var i = 0; i < v.length; i++) { if (typeof v[i] === 'string') v[i] = shiftText(v[i], n); else walk(v[i]); } }
      else if (v && typeof v === 'object') Object.keys(v).forEach(function (k) { if (SKIP_KEYS[k]) return; if (typeof v[k] === 'string') v[k] = shiftText(v[k], n); else walk(v[k]); });
    })(out);
    return out;
  }
  // 한국어 월·일 표기('9월 29일')와 '09.29' 요약은 호출자가 shiftDay 결과로 만든다.
  return { base: base, today: today, offsetDays: offsetDays, shiftDay: shiftDay, shiftText: shiftText, shiftValue: shiftValue, addDays: addDays, dayDiff: dayDiff, SKIP_KEYS: Object.keys(SKIP_KEYS) };
});
