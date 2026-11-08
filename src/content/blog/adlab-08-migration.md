---
title: 'AD 홈랩 ⑧ 랩을 통째로 다른 PC로 옮기기 — 명령은 성공했는데 결과는 실패한 것들'
description: 'DC·파일서버·클라이언트 VM 3대(84.3GB)를 다른 노트북으로 내보내고 가져온 기록. 호환성 문제는 0건이었지만 vTPM 봉인, 실행 정책, 오진 하나, 그리고 USB의 ISO를 물고 있던 VM까지 네 곳에서 막혔습니다.'
pubDate: 'Nov 08 2026'
lang: 'ko'
translation: 'en/adlab-08-migration'
tags: ['active-directory', 'homelab', 'hyper-v', 'migration', 'vtpm']
---

> 환경: Hyper-V on Windows 11 (빌드 26200) → Hyper-V on Windows 11 (빌드 26200) · VM 구성 버전 12.0
>
> 연재 「노트북 한 대로 AD 홈랩」 8/8 · 작업일 2026-08-21 · 약 2시간

순서를 조금 거슬러 올라갑니다. [2회](/blog/adlab-02-build/)까지 마친 다음 날, 랩을 더 큰 노트북으로 옮겼습니다. [4회](/blog/adlab-04-fileserver-dc2/) 이후는 전부 새 기기에서 한 작업입니다.

## 왜 옮겼나 — 용량

처음 노트북은 내장 디스크가 256GB였습니다. VHDX 압축(`Optimize-VHD`)으로 짜내 봤지만 6.85GB만 돌아왔습니다. VHDX 크기가 게스트 실사용량과 거의 같아 더 짤 것이 없었고, 랩은 실제로 80GB 넘게 필요했습니다.

|  | 보내는 쪽 | 받는 쪽 |
|---|---|---|
| CPU | Core Ultra 5 235U | Core i7-1195G7 · 4C/8T |
| 메모리 | 32GB | 32GB |
| C: 여유 | 29GB | 832.9GB |
| Windows | 11 · 26200 | 11 · 26200 |

**두 기기가 같은 Windows 빌드**라 VM 구성 버전 12.0을 그대로 가져올 수 있었습니다. 이전에서 가장 흔한 실패 원인이 애초에 없었던 셈입니다. 새 기기의 집 공유기 대역(192.168.0.x)도 랩 대역(192.168.100.0/24)과 겹치지 않았습니다.

## 옮기기 전에 한 것

- **CL1의 vTPM 해제** (`Disable-VMTPM`). vTPM의 키 보호기는 호스트에 묶여 있어, 그대로 옮기면 CL1이 부팅을 거부합니다. CL1의 디스크는 암호화돼 있었지만 보호가 꺼져 있고 키 보호기가 없어 TPM에 묶이지 않은 상태였습니다
- **전체 내보내기** — VM 3대 84.3GB를 외장 USB 디스크로, 15분
- **`Compare-VM`으로 사전 판정** — 3대 모두 호환성 문제 0건
- **옮긴 뒤 원본 VM은 계속 꺼 둘 것.** 같은 DC가 두 곳에서 동시에 돌면 USN 롤백으로 도메인이 망가집니다

## 받는 쪽에서

1. Hyper-V 켜기 → 내 계정을 Hyper-V Administrators에 → 가상 스위치·NAT 재구성
2. 가져오기 — CL1 5.3분, DC1 6.8분, FS1 4.4분, 합계 16.5분
3. **DC1부터** 순서대로 시작 — DC1은 40초 만에 LDAP 응답
4. 시계 확인 — 호스트 대비 3~6초. Kerberos 허용 오차 5분 안이라 재동기화 불필요
5. 상태 점검 — 핵심 서비스 6종, SYSVOL·NETLOGON 공유, FSMO 5종 모두 정상
6. 도메인 로그인 — CL1에서 도메인 계정으로 로그인, Kerberos 티켓 발급 확인

## 막혔던 네 곳

예상했던 실패(권한 부족, 대역 충돌, USB 드라이브 문자 변경)는 전부 미리 해소돼 있었습니다. 실제로 막힌 곳은 예상하지 못한 넷이었고, 그중 셋은 **명령은 성공했는데 결과는 실패한** 유형이었습니다.

### 1. CL1이 안 켜짐 — `authentication tag (0xC000A002)`

가져오기 스크립트가 마지막에 "새 호스트에 맞게" vTPM을 다시 켜도록 짜여 있었습니다. 새 키 보호기를 만들고 vTPM을 켜는 두 명령 모두 **성공**을 출력했습니다. 그러나 새 키 보호기로는 원래 호스트에서 봉인된 vTPM 상태를 열 수 없어 VM 워커 프로세스가 뜨지 못했습니다.

`Disable-VMTPM -VMName CL1` 후 바로 정상 기동. Windows 11은 설치 요구 사항으로 TPM을 보지만, 설치 뒤에는 TPM 없이도 부팅합니다. 스크립트는 vTPM을 다시 켜는 대신 꺼 주도록 고쳤습니다.

### 2. `running scripts is disabled on this system`

새 기기는 실행 정책이 기본값 Restricted였습니다. 하나 더, OneDrive에서 받은 `.ps1`에는 **출처 표식(Zone.Identifier)** 이 붙어 RemoteSigned에서도 막힙니다. 일회성으로는 `powershell -ExecutionPolicy Bypass -File <경로>`, 영구적으로는 관리자 창에서 정책을 바꾸고 `Unblock-File`까지 해야 합니다.

### 3. FS1이 445에 응답 없음 — 오진

FS1이 ping·135·139·445 전부 무응답이고 WinRM(5985)만 열려 있었습니다. 방화벽 프로필이 Public으로 잡혔다고 넘겨짚고 FS1을 재부팅했는데 그대로였습니다.

실제로는 처음부터 **문제가 아니었습니다.** FS1의 프로필은 DomainAuthenticated였고, 파일 공유 인바운드 규칙이 꺼져 있는 것은 **공유가 없는 Windows Server의 기본값**입니다(이때는 아직 공유를 만들기 전이었습니다). DC1만 445가 열려 있던 건 승격 때 SYSVOL·NETLOGON 공유가 생기며 자동으로 열렸기 때문입니다.

`Get-NetConnectionProfile` 한 번이면 3초에 끝날 일이었습니다. 증상에서 원인을 추측하기 전에, **원인을 직접 조회할 수 있는지부터** 봐야 합니다.

### 4. VM 3대가 USB의 ISO를 물고 있었다 — 지연 발현

증상은 없었습니다. 가져오기, 기동, 검증 모두 통과했습니다. USB를 빼도 되는지 확인하다 발견했습니다. 세 VM의 가상 DVD 드라이브가 USB에 있던 설치 ISO 경로를 그대로 물고 있었습니다. 그 상태로 USB를 빼면 다음에 VM을 켤 때 경로를 못 찾아 기동을 거부합니다.

설치는 이미 끝났으니 미디어를 뺐습니다. 그런데 여기서도 함정이 있었습니다.

```powershell
# 조용히 실패한다 — 오류도 없고 경로도 그대로
Get-VMDvdDrive -VMName DC1 | Set-VMDvdDrive -Path $null

# 컨트롤러 번호와 위치를 명시해야 실제로 빠진다
foreach ($v in 'DC1','FS1','CL1') {
    $d = Get-VMDvdDrive -VMName $v
    Set-VMDvdDrive -VMName $v -ControllerNumber $d.ControllerNumber `
        -ControllerLocation $d.ControllerLocation -Path $null
}
```

**교훈.** 이전 직후 검증만으로는 부족합니다. USB, 네트워크 공유, 마운트한 미디어처럼 **잠깐 존재하는 자원에 대한 참조**는 그 자원이 사라지는 순간에야 드러납니다. 외부 매체를 떼기 전에 DVD 드라이브, 디스크, 구성, 체크포인트 경로를 전부 조회해야 합니다.

## 정리 — 사본 정리까지가 이전

가져온 직후 사본이 네 벌이었습니다. 새 호스트의 실제 VM(운영본), USB의 이번 내보내기(유일한 외부 백업), USB의 첫날 백업, 그리고 원래 노트북의 원본. 첫날 백업은 이번 내보내기의 부분집합이라 지웠는데, 지우기 전에 `Get-VHD`로 세 곳 모두 **차등 디스크 체인이 없는지(Parent 없음)** 확인했습니다. 체인이 있었다면 하나를 지우는 순간 나머지가 함께 깨졌을 것입니다. 원래 노트북의 VM은 나중에 삭제해 84GB를 돌려받았습니다.

## 연재를 마치며

여덟 회를 돌아보면 반복된 교훈은 하나입니다. **출력이 아니라 결과를 확인할 것.** "성공"을 출력하고 절반만 된 명령(5회), "적용됨"으로 나오고 아무 일도 안 한 정책(6회), Normal이지만 꺼 보기 전엔 몰랐던 이중화(7회), 성공했지만 VM을 못 켜게 만든 vTPM(이번 회). 구축 절차는 문서에 다 있습니다. 문서에 없는 것은 이런 순간들이었습니다.

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
