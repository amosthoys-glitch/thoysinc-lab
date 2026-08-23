// Google AdSense 설정.
//
// 비워 두면 광고 코드가 **전혀 나가지 않습니다** — 스크립트도, 슬롯도, ads.txt 도.
// 승인 절차상 심사 전에 사이트에 코드가 올라가 있어야 하므로, 가입해서 게시자 ID를
// 받는 즉시 아래 한 줄만 채우면 됩니다.
//
//   1. https://adsense.google.com 에서 가입 (사이트: blog.thoysinc.com)
//   2. 게시자 ID(ca-pub- 으로 시작하는 값)를 복사해 CLIENT_ID 에 붙여넣기
//   3. push 하면 자동 배포됨 → 애드센스에서 심사 요청
//   4. 승인 후 '디스플레이 광고' 를 만들어 슬롯 ID 를 SLOT_ARTICLE_END 에 넣기
//
// 보험 블로그(www.thoysinc.com)에는 붙이지 않습니다. 그쪽 광고 슬롯은 경쟁
// 보험사가 사 가기 때문에, 상담으로 올 독자를 몇 센트에 넘기는 셈이 됩니다.
export const CLIENT_ID = '';

/** 광고 슬롯 ID. 승인 후 애드센스에서 광고 단위를 만들면 나옵니다. */
export const SLOT_ARTICLE_END = '';

export const adsEnabled = CLIENT_ID.trim().length > 0;
