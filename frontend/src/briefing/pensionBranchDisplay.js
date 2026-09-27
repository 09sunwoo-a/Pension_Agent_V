/* 표시용 부점 관리 범위 — 한 곳에서 정의해 처리 이력 등에서 같은 문구를 쓴다.
 * 이 값은 화면 문구(메인 상단 '여의도종합금융센터', 'IRP 고객 1,392명')와 같으며, Agent 계약·실제 검색 데이터
 * (현재 57명, manifest row_ids)·result.count를 덮어쓰지 않는다. 출처는 display_config 로 구분한다. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PensionBranchDisplay = factory();
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  var DISPLAY = { origin: 'display_config', branchName: '여의도종합금융센터', managedCustomerCount: 1392 };
  function scopeLabel() { return DISPLAY.branchName + ' 관리 고객 ' + DISPLAY.managedCustomerCount.toLocaleString('ko-KR') + '명'; }
  function context() { return { origin: DISPLAY.origin, branchName: DISPLAY.branchName, managedCustomerCount: DISPLAY.managedCustomerCount, scopeLabel: scopeLabel() }; }
  return { DISPLAY: DISPLAY, scopeLabel: scopeLabel, context: context };
});
