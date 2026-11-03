---
title: 'AD 홈랩 ⑤ FSMO 이전과, DNS가 따라오는 시간'
description: '다섯 역할을 DC2로 옮겼다 되돌린 기록. 역할 이전은 한 줄로 끝났지만 클라이언트가 그걸 알아채기까지 캐시·레코드 공백·AD 복제·영역 폴링의 네 겹 지연이 있었습니다. 이전과 탈취의 차이까지.'
pubDate: 'Nov 05 2026'
lang: 'ko'
tags: ['active-directory', 'homelab', 'fsmo', 'dns', 'replication']
---

> 환경: Windows Server 2025 · 단일 도메인 · DC 2대(DC1·DC2, 둘 다 GC)
>
> 연재 「노트북 한 대로 AD 홈랩」 5/8 · 작업일 2026-08-22

[4회](/blog/adlab-04-fileserver-dc2/)에서 DC가 두 대가 되자 처음으로 할 수 있는 연습이 생겼습니다. FSMO 역할을 다른 DC로 옮기는 것입니다. 이전 자체는 한 줄이었습니다. 문제는 그 뒤였습니다.

## 다섯 역할

AD는 대부분 다중 마스터입니다. 어느 DC에서 사용자를 만들어도 나머지로 복제됩니다. 그런데 **둘이 동시에 하면 안 되는 작업 다섯 가지**는 한 대가 전담합니다. 그게 FSMO입니다.

| 역할 | 범위 | 없으면 당장 무엇이 안 되나 |
|---|---|---|
| 스키마 마스터 | 포리스트 | 스키마 변경 (예: Exchange 설치) |
| 도메인 명명 마스터 | 포리스트 | 도메인 추가·제거 |
| PDC 에뮬레이터 | 도메인 | 암호 변경 즉시 반영, 계정 잠금, 시간 기준, GPO 편집 기본 대상 |
| RID 마스터 | 도메인 | RID 풀이 바닥나면 새 계정 생성 불가 |
| 인프라 마스터 | 도메인 | 도메인 간 그룹 멤버 참조가 낡은 채로 남음 |

다섯 중 **PDC 에뮬레이터만 성격이 다릅니다.** 나머지 넷은 없어도 며칠은 티가 나지 않습니다. 스키마를 매일 바꾸지 않으니까요. PDC는 암호 변경과 계정 잠금이 실시간으로 지나가는 길목이라 장애가 곧장 사용자에게 보입니다. "FSMO 중 뭐가 제일 중요하냐"의 답이 여기 있습니다.

## 이전 실행

실무에서 흔한 배치대로, 포리스트 역할 둘(스키마·명명)을 DC2로 옮기고, 이어서 PDC 에뮬레이터도 옮겼습니다.

```powershell
Move-ADDirectoryServerOperationMasterRole -Identity DC2 `
    -OperationMasterRole SchemaMaster, DomainNamingMaster, PDCEmulator
```

**양쪽 DC에 각각 물어봤습니다.** FSMO 소유권도 복제되는 정보라 한쪽만 보면 낡은 값을 볼 수 있습니다. `-Server`로 DC1과 DC2에 따로 물어 두 답이 일치하는 것까지 확인했습니다.

## 네 겹의 지연

PDC를 DC2로 옮긴 직후, CL1과 FS1은 여전히 **DC1을 PDC로** 답했습니다. AD에서는 이미 DC2인데 클라이언트만 다른 말을 하고 있었습니다. 하나씩 벗겨 보니 지연이 네 겹이었습니다.

### 1겹 · 클라이언트 캐시

클라이언트는 한 번 찾은 DC를 캐시해 둡니다. 매번 새로 찾으면 로그온이 느려지기 때문입니다. `/force`로 캐시를 무시하고 다시 찾게 했습니다.

### 2겹 · 레코드 공백 — `Status = 1355 ERROR_NO_SUCH_DOMAIN`

다시 찾게 했더니 이번엔 도메인이 없다고 나왔습니다. `_ldap._tcp.pdc._msdcs.thoyslab.local` 레코드가 **아예 없었습니다.** DC1은 더 이상 PDC가 아니라 자기 등록을 뺐고, DC2는 아직 올리지 않은 공백 구간이었습니다. 새 PDC에서 `nltest /dsregdns`로 다시 등록시켰습니다. 놔둬도 Netlogon이 60분 안에 스스로 등록하지만, 그 사이 PDC를 DNS로 찾는 모든 동작이 실패합니다.

### 3겹 · AD 복제

`nltest /dsregdns`는 성공을 출력했는데, DC1에서 조회하면 여전히 없었습니다. 레코드가 **DC2 사본에만** 생겨 있었습니다. `_msdcs` 영역은 AD 통합(포리스트 범위)이라 레코드가 AD 객체로 저장되고, AD 복제를 타야 다른 DC에 닿습니다. `repadmin /syncall /AdeP`로 복제를 당겼습니다.

### 4겹 · 영역 폴링

복제가 끝나 AD에는 새 레코드가 있는데, 그 DC의 **DNS 서비스는 옛 답**을 줬습니다. DNS 서버는 AD 통합 영역을 주기적으로(기본 약 3분) 다시 읽어 메모리에 올립니다. `dnscmd /zoneupdatefromds`로 즉시 다시 읽게 하자 값이 바뀌었습니다. "AD에는 있는데 DNS가 모른다"는 상태가 실제로 존재합니다.

## 완전한 절차

```powershell
# 1. 역할 이전
Move-ADDirectoryServerOperationMasterRole -Identity DC2 -OperationMasterRole PDCEmulator
# 2. 새 보유 DC 에서 DNS 재등록
nltest /dsregdns
# 3. AD 복제 강제 (레코드가 AD 객체이므로)
repadmin /syncall /AdeP
# 4. 상대 DC 의 DNS 서비스가 아직 옛 값이면 즉시 재적재
dnscmd /zoneupdatefromds _msdcs.thoyslab.local
# 5. 클라이언트 캐시 무시하고 확인
nltest /dsgetdc:thoyslab.local /pdc /force
```

2~4단계는 기다리면 저절로 해결됩니다. Netlogon 60분, DNS 폴링 3분, 클라이언트 캐시 15분. 이 절차의 값어치는 시간을 줄이는 데보다 **"역할은 옮겼는데 왜 안 되지" 구간이 존재한다는 것을 아는 데** 있습니다. 모르면 정상 동작을 장애로 오인해 엉뚱한 곳을 고치게 됩니다.

검증은 이렇게 끝났습니다. CL1과 FS1 모두 `nltest /pdc /force` → `\\DC2.thoyslab.local`, 보안 채널 정상. 그다음 세 역할을 같은 절차로 DC1에 되돌려 기준 상태로 복귀했습니다.

## 이전(Transfer)과 탈취(Seize)

|  | 이전 | 탈취 |
|---|---|---|
| 전제 | 양쪽 DC가 모두 살아 있음 | 기존 보유 DC가 영구히 죽음 |
| 과정 | 두 DC가 합의하고 인계 | 일방적으로 가져옴 |
| 사후 | 없음 | 원본을 `ntdsutil` 메타데이터 정리로 AD에서 제거 |
| 위험 | 없음 | 원본을 다시 켜면 같은 역할의 DC가 둘 — 도메인이 깨짐 |

이번에는 탈취를 하지 않았습니다. 되돌릴 수 없고, 하고 나면 DC2를 버려야 하기 때문입니다. 연습하려면 체크포인트를 먼저 찍고, 끝나면 되돌리는 것이 안전합니다.

```powershell
Checkpoint-VM -Name DC1, DC2 -SnapshotName 'FSMO 탈취 실습 전'
# ... 실습 ...
Restore-VMSnapshot -VMName DC1 -Name 'FSMO 탈취 실습 전' -Confirm:$false
Restore-VMSnapshot -VMName DC2 -Name 'FSMO 탈취 실습 전' -Confirm:$false
```

이번에도 같은 함정을 만났습니다. **명령은 성공을 출력했는데 결과는 절반만 이루어져 있었습니다.** 출력이 아니라 결과 상태를 직접 조회하는 습관이 없었다면 네 겹 중 어디서 멈췄는지조차 몰랐을 것입니다. 다음 회는 1회부터 만들어 두고 아무것도 걸지 않았던 OU에 드디어 그룹 정책을 겁니다.

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
