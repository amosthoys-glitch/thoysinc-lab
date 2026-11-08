---
title: 'AD 홈랩 ③ 막혔던 일곱 지점 — 문서대로 하면 안 나오는 것들'
description: 'BOM 없는 한글 .ps1, 같은 OU의 동명이인, DNS 부정 캐시, 창 뒤에 숨은 자격 증명 팝업, 실행 정책, 가입과 이름 변경의 충돌, 그리고 RDP로는 안 되는 첫 로그인.'
pubDate: 'Nov 03 2026'
lang: 'ko'
translation: 'en/adlab-03-pitfalls'
tags: ['active-directory', 'homelab', 'powershell', 'troubleshooting', 'dns']
---

> 환경: Windows PowerShell 5.1 · Windows Server 2025 · Windows 11 Enterprise · Hyper-V 향상된 세션
>
> 연재 「노트북 한 대로 AD 홈랩」 3/8 · 작업일 2026-08-20

[2회](/blog/adlab-02-build/)의 구축 절차는 문서를 보면 누구나 따라 할 수 있습니다. 이번 회의 일곱 가지는 직접 손을 대야만 만나는 것들입니다. 대부분 실무에서도 그대로 반복됩니다.

## 1. `The string is missing the terminator`

**원인.** 한글 주석이 들어간 `.ps1`을 BOM 없는 UTF-8로 저장했습니다. Windows PowerShell 5.1은 BOM이 없으면 스크립트를 시스템 기본 코드페이지(한국어 윈도는 CP949)로 읽어 한글이 깨지고, 그 결과 엉뚱한 구문 오류가 납니다. 스크립트 다섯 개가 한꺼번에 실패했습니다.

**해결.** UTF-8 **with BOM**으로 다시 저장. 이후 모든 스크립트는 실행 전에 파서로 검사했습니다. 실행하지 않고 구문 오류만 잡아냅니다.

```powershell
$errs = $null
[System.Management.Automation.Language.Parser]::ParseFile($path, [ref]$null, [ref]$errs) | Out-Null
$errs
```

PowerShell 7 이상은 BOM 없는 UTF-8을 제대로 읽어서 이 문제가 없습니다.

## 2. `A name that is already in use`

**원인.** 사용자 100명을 만들 때 `-Name`(CN)에 "이름 성"만 넣었습니다. 이름 30개, 성 20개를 100명에게 뿌리다 보니 같은 OU에 동명이인이 생겼습니다.

**해결.** CN이 겹칠 때만 번호를 덧붙이고, 한 명의 실패가 전체를 멈추지 않도록 `try/catch`로 감쌌습니다.

**배운 것.** 식별자마다 유일해야 하는 범위가 다릅니다.

| 식별자 | 예 | 유일 범위 |
|---|---|---|
| CN | James Lee | 같은 OU 안 |
| sAMAccountName | THOYSLAB\jlee012 | 도메인 전체 |
| UPN | jlee012@thoyslab.local | 포리스트 전체 |

## 3. SRV 레코드를 못 찾음

**원인.** 스크립트가 DNS 서버를 바꾼 직후 곧바로 SRV 레코드를 조회했습니다. 설정이 반영되기 전에 나간 질의가 실패했고, 그 **실패가 캐시에 남았습니다.** DNS는 성공뿐 아니라 실패도 저장합니다(부정 캐시).

**해결.** `Clear-DnsClientCache` 후 재시도. 그리고 "DC에 닿는가(TCP 389)"와 "레코드가 오는가(SRV 조회)"를 별도 검사로 나눠 각각 3초씩 10번 재시도하게 했습니다. 원인이 전혀 다르고 해결 방법도 다르기 때문입니다.

## 4. `Credential` 인자가 null

**원인.** `Get-Credential`이 띄운 팝업이 VM 콘솔 창 **뒤로 숨어** 입력 없이 취소됐습니다.

**해결.** 팝업을 두 번 재시도하고, 그래도 비어 있으면 콘솔 입력 `Read-Host -AsSecureString`으로 받도록 바꿨습니다. 창이 뜨지 않아 원격·콘솔 환경에서 더 안전합니다.

## 5. `running scripts is disabled on this system`

**원인.** 서버에서 잘 돌던 스크립트가 클라이언트에서 막혔습니다. Windows Server의 기본 실행 정책은 `RemoteSigned`, 클라이언트는 `Restricted`입니다.

**해결.** CL1의 실행 정책을 `RemoteSigned`로.

**메모.** 실행 정책은 보안 통제가 아니라 **실수 방지 장치**입니다. `-ExecutionPolicy Bypass`로 얼마든지 우회됩니다. 실제로 실행을 막아야 한다면 AppLocker나 WDAC를 씁니다.

## 6. `The directory service is busy`

**원인.** `Add-Computer`에 `-NewName`을 같이 줘서 도메인 가입과 이름 변경을 한 번에 시켰습니다. AD가 가입을 처리하는 중에 이름 변경 요청이 겹쳐 뒤쪽만 실패했습니다. 가입 자체는 성공한 상태였습니다.

**해결.** 가입과 이름 변경을 나누고, 사이에 대기 시간을 둔 뒤 재시도. 같은 객체에 대한 쓰기가 겹치면 AD는 뒤의 요청을 거부합니다. 기다렸다 다시 하는 것이 정석입니다.

## 7. 첫 로그인이 "암호가 틀렸습니다"

**원인.** 계정에 "첫 로그온 시 암호 변경"이 걸려 있었습니다. Hyper-V **향상된 세션 모드는 내부적으로 RDP**이고, RDP는 네트워크 수준 인증(NLA)으로 화면을 띄우기 전에 자격 증명을 먼저 확인합니다. 암호 변경이 필요한 계정은 그 단계에서 거부되는데, 사용자에게는 그냥 "암호가 틀렸다"로 보입니다. 실제 콘솔이라면 암호 변경 창이 떴을 것입니다.

**해결.** 향상된 세션을 끄고 기본 콘솔로 로그인해 암호를 바꿨습니다. 그 뒤로는 향상된 세션으로도 정상 로그인.

**배운 것.** "신규 입사자가 첫 로그인을 원격으로 못 한다"는 헬프데스크 단골 문의의 원인이 정확히 이것입니다.

## 정리

| 증상 | 진짜 원인 | 층 |
|---|---|---|
| 구문 오류 | 파일 인코딩 | 파일 |
| 이름 중복 | 식별자의 유일 범위 | AD |
| SRV 없음 | 부정 캐시 | DNS |
| 자격 증명 null | 창 뒤에 숨은 팝업 | UI |
| 실행 거부 | 서버·클라이언트 기본값 차이 | 정책 |
| 서비스 사용 중 | 같은 객체에 겹친 쓰기 | AD |
| 암호 틀림 | RDP와 암호 변경 플래그 | 인증 |

일곱 개 중 오류 메시지가 원인을 그대로 말해 준 것은 하나도 없었습니다. 다음 회부터는 이 랩을 실제로 쓸 수 있게 만듭니다. 이름만 파일서버였던 FS1에 공유를 세우고, 설치 미디어 없이 두 번째 DC를 만듭니다.

---

### 연재 「노트북 한 대로 AD 홈랩」

0. [홈랩 AD 도메인 이름: .local 을 고르면 나중에 어디서 막히나](/blog/ad-domain-naming/) (프롤로그)
1. [설계 — 노트북 한 대에 도메인 하나](/blog/adlab-01-design/)
2. [구축 — DC 승격부터 도메인 계정 로그인까지](/blog/adlab-02-build/)
3. [막혔던 일곱 지점](/blog/adlab-03-pitfalls/)
4. [파일서버와 ISO 없이 만든 두 번째 DC](/blog/adlab-04-fileserver-dc2/)
5. [FSMO 이전과 DNS가 따라오는 시간](/blog/adlab-05-fsmo/)
6. [OU는 있었는데 걸린 게 없었다 — 그룹 정책](/blog/adlab-06-group-policy/)
7. [꺼봐야 이중화인지 안다 — DHCP 페일오버](/blog/adlab-07-dhcp-failover/)
8. [랩을 통째로 다른 PC로 옮기기](/blog/adlab-08-migration/)
