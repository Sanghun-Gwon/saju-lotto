# 사주풀이 로또번호 추첨기 — 기술 설계서

> 작성: 개발 리드(테크 리드) / 대상: 다음 '개발' 단계 착수용
> 제품 성격: 엔터테인먼트. 당첨을 보장하지 않으며, 재미와 학습(토이) 목적.

---

## 0. 요약 (TL;DR)

- **완전 클라이언트 사이드 SPA**로 구현한다. 백엔드/DB 없음. 생년월일 데이터는 브라우저를 벗어나지 않는다.
- 스택은 **React + Vite + TypeScript**. 정적 빌드 산출물(`dist/`)을 그대로 정적 호스팅에 올린다.
- 만세력(간지) 계산은 **`lunar-javascript` 라이브러리 채택**을 1순위로 하되, 라이선스/번들 이슈 대비용 **자체 간이 알고리즘(연/월/일/시주 60갑자 계산)**을 fallback 겸 검증용으로 설계한다. 정확도 목표는 "엔터테인먼트 수준으로 충분히 신뢰 가능"(연·일주 정확, 월주는 절기 기준, 시주는 진태양시 보정 생략).
- 번호 추첨은 **하이브리드**: 사주 오행 집계로 만든 **시드 → 결정적(deterministic) PRNG → 오행 가중 샘플링**. 같은 입력 = 같은 결과(재현성), 그러나 분포는 오행에 따라 편향.
- 풀이 텍스트는 **조합형 템플릿**(오행 강약 + 일간 십성 조각을 조합).

---

## 1. 기술 스택 선정 & 근거

### 1.1 선정

| 항목 | 선택 | 비고 |
|---|---|---|
| 언어 | **TypeScript** | 도메인(간지/오행) 타입이 많아 타입 안전성 이득이 큼 |
| 프레임워크 | **React 18** | 결과 화면의 상태/조건부 렌더가 많고 컴포넌트 재사용 유리 |
| 빌드 도구 | **Vite** | 정적 빌드가 기본, 설정 최소, 개발 서버 빠름 |
| 스타일 | **CSS Modules** (또는 순수 CSS) | 토이 규모, Tailwind까지는 불필요. 단순 유지 |
| 만세력 계산 | **lunar-javascript** (+ 자체 fallback) | 3절 참고 |
| 상태관리 | **React 로컬 상태(useState/useReducer)** | 전역 스토어 불필요. 화면이 3개뿐 |
| 라우팅 | **단일 페이지 + 뷰 상태 전환** (라우터 생략 가능) | GitHub Pages의 해시 라우팅 이슈 회피. 필요 시 `HashRouter`만 |

### 1.2 근거

- **왜 서버가 없어도 되는가**: 만세력 계산, 오행 집계, 번호 추첨, 풀이 생성은 전부 순수 함수 연산이다. 외부 API·DB가 근본적으로 필요 없다. → 하드 제약(서버/DB 없음)과 완벽히 부합.
- **왜 바닐라 JS가 아니라 React인가**: 입력폼 검증, "시 모름" 분기, 결과 카드/애니메이션, 다시 뽑기 등 상태 전이가 있어 바닐라로 하면 DOM 수동 조작이 늘어난다. 토이지만 학습·유지보수 관점에서 React가 깔끔. 단, 과설계 방지를 위해 **전역 상태관리 라이브러리(Redux 등)는 도입하지 않는다**.
- **왜 Vite인가**: `vite build` 결과가 순수 정적 파일(HTML/JS/CSS)이라 GitHub Pages/Vercel/Netlify에 무설정 배포 가능. `base` 옵션만 맞추면 됨.
- **개인정보 관점**: 모든 연산이 클라이언트에서 끝나므로 네트워크 전송이 원천적으로 없다. 이 "구조적 보장"이 정책 문구보다 강한 개인정보 보호가 된다.

---

## 2. 아키텍처 개요

### 2.1 레이어 구조

단일 클라이언트 앱을 **UI 레이어 / 도메인(순수 로직) 레이어**로 나눈다. 도메인 레이어는 React에 의존하지 않는 순수 TS 모듈로 만들어 테스트가 쉽도록 한다.

```
┌─────────────────────────────────────────────────────────┐
│                     UI Layer (React)                      │
│  LandingView → InputForm → ResultView                     │
│   (사용자 입력 수집 / 결과 렌더 / 다시뽑기 / 공유)         │
└───────────────┬─────────────────────────────────────────┘
                │ BirthInput (생년월일시 + 옵션)
                ▼
┌─────────────────────────────────────────────────────────┐
│              Domain Layer (순수 TS, React 무관)            │
│                                                           │
│  ① saju/       입력 → 사주(연월일시 4주 간지)             │
│     calcSaju(BirthInput) → SajuChart                      │
│        └ lunar-javascript OR fallback 알고리즘            │
│                                                           │
│  ② elements/   사주 → 오행 집계 + 십성 분석               │
│     analyze(SajuChart) → ElementProfile                   │
│                                                           │
│  ③ lotto/      오행프로필 → 시드 → 번호 6개               │
│     drawNumbers(ElementProfile) → LottoResult            │
│        └ makeSeed → mulberry32 PRNG → 가중샘플링          │
│                                                           │
│  ④ fortune/    오행프로필 → 풀이 텍스트                   │
│     generateReading(ElementProfile) → ReadingText         │
└─────────────────────────────────────────────────────────┘

데이터 흐름 (한 방향):
BirthInput ─▶ SajuChart ─▶ ElementProfile ─┬─▶ LottoResult
                                            └─▶ ReadingText
                                                    │
                                     ResultView 로 렌더 ◀┘
```

### 2.2 원칙

- **단방향 데이터 흐름**: 입력 → 계산 파이프라인 → 렌더. 중간 상태를 저장하지 않는다.
- **도메인 순수성**: `saju/`, `elements/`, `lotto/`, `fortune/` 는 `window`/DOM/네트워크 접근 없음 → 단위 테스트 대상.
- **저장 없음**: `localStorage`/쿠키/네트워크 미사용(기본). "결과 공유" 기능은 데이터를 URL 쿼리에 담는 방식으로만(선택, 4.5 참고).

---

## 3. 만세력 / 간지 계산 방식

### 3.1 정확도 수준 결정 (개발 리드 판단)

**결정: "실용 정확" 등급 — 연주·월주·일주는 정통 명리 기준으로 정확, 시주는 표준시(진태양시 보정 생략) 기준.**

근거:
- 이 제품은 **엔터테인먼트**이며 당첨/운세를 보장하지 않는다. 학술적 정밀도(경도별 진태양시, 균시차, 서머타임 이력, 야자시/조자시 논쟁)까지 구현하면 토이 규모 대비 비용이 과하다.
- 다만 **일주(日柱)는 사주의 핵심 축**이고 60갑자 순환으로 결정적으로 계산 가능하므로 정확히 맞춘다. 월주는 **절기(節氣) 기준**(입춘~다음 입춘을 한 해, 각 월의 시작을 절기로)으로 계산해야 명리적으로 맞다 — 라이브러리가 이를 처리해 준다.
- 시주는 2시간 단위 지지(자~해) + 일간 기반 시간 천간(오서법/五鼠遁)으로 계산. **진태양시 보정은 생략**하고 그 사실을 UI와 문서에 명시(경계 시간대는 결과가 달라질 수 있음 안내).

### 3.2 라이브러리 후보 조사

| 후보 | 설명 | 판단 |
|---|---|---|
| **lunar-javascript** (`lunar-javascript` npm) | 중국 만세력 계산 라이브러리. 양력↔음력 변환, 24절기, 60갑자(연/월/일/시), 절기 기준 월주까지 지원. 순수 JS, 브라우저 동작, 의존성 없음. | **1순위 채택.** 필요한 기능(절기 기준 월주, 시주, 음양력 변환)을 전부 커버. |
| `chinese-lunar` / `solarlunar` 계열 | 음↔양력 변환 위주. 절기·간지 지원이 얕거나 월주 절기 처리 불명확. | 보조. 간지 전부를 커버하지 못해 부적합. |
| 자체 구현 | 60갑자 일주는 기준일로부터의 경과일 mod 60으로 계산 가능. 절기는 천문 근사식 필요(구현 부담). | **fallback + 검증용**으로 최소 구현. |

> 라이선스 확인은 미결정 항목(11절)에 등록. lunar-javascript는 관대한 라이선스로 알려져 있으나 개발 착수 시 `package.json`/LICENSE 재확인 후 확정.

### 3.3 채택안: lunar-javascript 래핑

도메인 코드가 라이브러리에 직접 의존하지 않도록 **어댑터(`saju/lunarAdapter.ts`)로 감싼다.** 나중에 라이브러리 교체/자체구현 전환이 쉬움.

```ts
// saju/calcSaju.ts (의사코드)
import { Solar } from 'lunar-javascript';

function calcSaju(input: BirthInput): SajuChart {
  // 1) 입력이 음력이면 양력으로 정규화 (라이브러리의 Lunar→Solar)
  const solar = input.calendar === 'lunar'
    ? Lunar.fromYmd(y, m, d).getSolar()
    : Solar.fromYmd(input.year, input.month, input.day);

  // 2) 시(hour) 반영: '시 모름'이면 정오(12시)로 계산하되 시주는 미확정 처리
  const hour = input.hourKnown ? input.hour : 12;
  const solarTime = Solar.fromYmdHms(y, m, d, hour, min ?? 0, 0);
  const eightChar = solarTime.getLunar().getEightChar(); // 사주 8자

  return {
    year:  { gan: eightChar.getYearGan(),  zhi: eightChar.getYearZhi()  },
    month: { gan: eightChar.getMonthGan(), zhi: eightChar.getMonthZhi() }, // 절기 기준
    day:   { gan: eightChar.getDayGan(),   zhi: eightChar.getDayZhi()   },
    hour:  input.hourKnown
             ? { gan: eightChar.getTimeGan(), zhi: eightChar.getTimeZhi() }
             : null, // 시 모름 → 시주 제외
    calendarResolved: { y, m, d, hour },
  };
}
```

### 3.4 자체 간이 알고리즘 (fallback / 검증)

라이브러리 없이도 최소한 동작하도록 일주·연주·시주는 자체 계산 가능하게 준비한다(월주 절기는 근사).

- **일주(일간·일지)**: 기준일(예: 1900-01-31 = 갑진일 등 검증된 기준)으로부터의 경과 일수 `n` → 일간 = 천간[(n+offset) % 10], 일지 = 지지[(n+offset) % 12]. (기준일과 offset은 알려진 만세력과 대조해 확정)
- **연주**: 입춘 이전이면 전년으로 취급. 연간 = 천간[(year-4) % 10], 연지 = 지지[(year-4) % 12]. (간이 버전은 입춘 경계를 2/4 고정 근사)
- **시주**: 지지 = 시각 → 2시간 구간 매핑(23–01 자, 01–03 축 …). 시간 천간은 **오서법(五鼠遁)**: 일간에 따라 자시 천간이 결정되고 순차 진행.
- **월주**: 정확히 하려면 절기가 필요 → 자체 구현은 "월지 = 절기 근사표, 월간 = 오호둔(五虎遁)"으로 근사. **정확도 이슈로 라이브러리 우선.**

> 전략: **런타임은 라이브러리 결과를 사용**하고, 자체 알고리즘은 테스트에서 라이브러리 결과와 교차 검증하는 용도 + 라이브러리 장애 시 degrade용.

### 3.5 음/양력 · 시 모름 처리

- **입력에 달력 종류 선택**(양력/음력) + 음력이면 **윤달 체크박스**.
- **시 모름 옵션**: 체크 시 시주(時柱)를 계산에서 제외. 오행 집계는 3주(연·월·일) 기준으로 수행하고, UI에 "시를 모르면 시주 오행이 빠져 결과 정밀도가 낮아집니다"를 안내. 추첨은 그대로 진행(가중치만 달라짐).

---

## 4. 번호 추첨 알고리즘 (확정)

### 4.1 방식 결정: 하이브리드 (B안 골격 + A안 가중치)

- **B안(시드 결정적)**을 뼈대로: 사주에서 시드를 만들고 결정적 PRNG로 뽑아 **재현성** 확보(같은 사주 → 항상 같은 6개). "매번 달라지면 사주 기반이라는 느낌이 약함" + "공유했을 때 같은 결과가 나와야 함" 때문.
- **A안(오행 가중치)**를 얹어: 45개 번호를 오행에 매핑하고, 사주의 오행 강약에 따라 **번호별 뽑힐 확률에 가중**을 준다. → "내 사주 오행이 반영됐다"는 서사 제공.

### 4.2 번호 ↔ 오행 매핑

45개 번호를 5행에 배분한다. 단순·설명가능하게 **끝자리 기반** 매핑을 채택:

- 끝자리 1,2 → 木, 3,4 → 火, 5,6 → 土, 7,8 → 金, 9,0 → 水
  (예: 1,2,11,12,21,22,31,32,41,42 = 木)

> 균형: 각 오행에 8~9개 번호가 배정됨(45/5). 대안(번호 구간 분할)도 가능하나 끝자리 방식이 설명 텍스트에 넣기 쉬움.

### 4.3 시드 생성

사주 8자(간지)를 숫자 문자열로 직렬화 → 해시 → 32bit 시드.

```
makeSeed(saju):
  key = concat(년간지, 월간지, 일간지, 시간지 or "NA")
        + "|" + 오행카운트문자열   # 결정성 보강
  seed = fnv1a_32(key)            # 간단한 결정적 해시
  return seed
```

### 4.4 결정적 PRNG + 가중 샘플링 (의사코드)

```
// mulberry32: 시드 하나로 재현 가능한 난수열
function mulberry32(seed):
  return function():
    seed = (seed + 0x6D2B79F5) mod 2^32
    t = seed
    t = (t xor (t >> 15)) * (t or 1)
    t = t xor (t + (t xor (t >> 7)) * (t or 61))
    return ((t xor (t >> 14)) >>> 0) / 2^32   // [0,1)

function drawNumbers(profile):            // profile: 오행별 강도(정규화)
  rng = mulberry32(makeSeed(profile.saju))

  // 1) 45개 번호에 가중치 부여
  weights = array size 45
  for n in 1..45:
    el = elementOf(n)                     // 木火土金水 중 하나 (끝자리 규칙)
    base = 1.0
    // 사주에 강한 오행일수록 가중 ↑ (강도 0~1 → 가중 1.0~2.0 예시)
    weights[n] = base * (1 + profile.strength[el])

  // 2) 가중 무복원 추출로 6개 뽑기
  picked = empty set
  while size(picked) < 6:
    total = sum(weights[n] for n not in picked)
    r = rng() * total
    acc = 0
    for n in 1..45 where n not in picked:
      acc += weights[n]
      if r <= acc:
        picked.add(n)
        break

  return sort(picked)                     // 오름차순 6개, 1~45, 중복 없음
```

**보장**: 무복원(picked에서 제외) + 45개 중 추출이므로 **1~45 범위, 중복 없는 정확히 6개**가 항상 나온다. 모든 가중치가 양수이므로 무한루프 없음.

### 4.5 재현성 & 공유

- 같은 `BirthInput` → 같은 `SajuChart` → 같은 시드 → 같은 6개.
- (선택) 공유는 입력값을 URL 쿼리(`?y=&m=&d=&h=&cal=`)로 인코딩. 생년월일이 URL에 노출되므로 **기본 비활성, 사용자가 "공유 링크 만들기"를 눌렀을 때만** 생성하고 경고 문구 표시. (미결정 항목에 등록)

---

## 5. 풀이 텍스트 생성 방식

### 5.1 방식: 조합형 템플릿

LLM/외부 호출 없음(서버리스 제약). **정적 문구 조각을 오행 프로필로 조합**한다.

구성 요소:
1. **오행 강약 요약**: 가장 강한 오행 / 가장 약한(부족한) 오행을 문장 조각으로.
2. **일간(日干) 성향**: 일간 10개(갑을병정…) 각각에 성향 한 줄 사전.
3. **번호 서사**: 뽑힌 번호가 어느 오행에서 많이 나왔는지 연결("당신에게 강한 火 기운이 담긴 3, 13, 23을 골랐습니다").
4. **면책 문구**: "본 결과는 재미를 위한 것이며 당첨을 보장하지 않습니다."

### 5.2 데이터 사전 예시

```ts
const DAY_GAN_TRAITS: Record<string, string> = {
  '甲': '큰 나무처럼 곧고 리더십이 있는 기질',
  '乙': '유연한 풀처럼 부드럽고 적응력이 좋은 기질',
  // ... 10개
};
const ELEMENT_STRONG: Record<Element, string> = {
  木: '성장과 추진력이 두드러지는 시기',
  火: '열정과 표현력이 강한 흐름',
  // ...
};
const ELEMENT_WEAK: Record<Element, string> = { /* 부족할 때 조언 */ };
```

### 5.3 조합 로직 (의사코드)

```
generateReading(profile):
  s1 = `당신의 일간은 ${dayGan}(으)로, ${DAY_GAN_TRAITS[dayGan]}입니다.`
  s2 = `오행 중 ${strongest}이(가) 강해 ${ELEMENT_STRONG[strongest]}이며,`
       + ` ${weakest}은(는) 다소 부족합니다. ${ELEMENT_WEAK[weakest]}`
  s3 = `이번 번호에는 특히 ${dominantElOfPicks} 기운의 수가 담겼습니다.`
  s4 = DISCLAIMER
  return [s1, s2, s3, s4].join(' ')
```

- 결과가 매번 같아 단조로울 수 있으니, **동일 카테고리 내 문구를 2~3개 준비**하고 시드(rng)로 하나 선택 → 결정적이지만 사주별로 변주.

---

## 6. 데이터 모델 (클라이언트 내부, 저장 안 함)

```ts
// 오행
type Element = '木' | '火' | '土' | '金' | '水';

// 입력
interface BirthInput {
  year: number;
  month: number;      // 1-12
  day: number;        // 1-31
  calendar: 'solar' | 'lunar';
  isLeapMonth?: boolean;   // 음력 윤달 여부
  hourKnown: boolean;
  hour?: number;      // 0-23 (hourKnown일 때만)
  minute?: number;    // 선택, 기본 0
}

// 간지 한 기둥
interface Pillar { gan: string; zhi: string; }  // 예: 갑(甲), 자(子)

// 사주 (4주)
interface SajuChart {
  year: Pillar;
  month: Pillar;
  day: Pillar;        // 일간 = day.gan 이 '나'
  hour: Pillar | null; // '시 모름'이면 null
  calendarResolved: { y: number; m: number; d: number; hour: number };
}

// 오행/십성 분석 결과
interface ElementProfile {
  saju: SajuChart;
  count: Record<Element, number>;      // 원시 집계 (천간+지지 매핑)
  strength: Record<Element, number>;   // 0~1 정규화 강도
  strongest: Element;
  weakest: Element;
  dayGan: string;                      // 일간
}

// 추첨 결과
interface LottoResult {
  numbers: number[];                   // 정렬된 6개 (1~45, 중복 없음)
  seed: number;
  byElement: Record<Element, number[]>;// 번호를 오행별로 그룹핑 (풀이용)
}

// 풀이
interface ReadingText { paragraphs: string[]; disclaimer: string; }

// 최종 렌더 모델
interface AppResult {
  saju: SajuChart;
  profile: ElementProfile;
  lotto: LottoResult;
  reading: ReadingText;
}
```

> **저장 없음 원칙**: 위 구조는 모두 메모리(React state)에만 존재. 새로고침하면 사라짐. `localStorage` 미사용.

### 6.1 천간/지지 → 오행 매핑 (집계 기준)

- 천간: 甲乙=木, 丙丁=火, 戊己=土, 庚辛=金, 壬癸=水
- 지지(간이): 寅卯=木, 巳午=火, 辰戌丑未=土, 申酉=金, 亥子=水
  (지장간까지 반영하면 정밀해지나 토이 규모상 **본기(本氣) 기준 집계**로 시작. 정밀화는 후속 옵션)

---

## 7. 프로젝트 폴더 구조 (제안)

`temp/` 하위에 프로젝트를 둔다.

```
temp/saju-lotto/
├─ index.html
├─ package.json
├─ vite.config.ts          # base 경로 설정(배포 대상별)
├─ tsconfig.json
├─ public/                 # 정적 에셋(파비콘 등)
├─ src/
│  ├─ main.tsx             # React 진입점
│  ├─ App.tsx              # 뷰 전환(Landing/Input/Result) 컨테이너
│  ├─ styles/
│  │  └─ *.module.css
│  ├─ domain/              # ★ 순수 로직 (React 무관, 테스트 대상)
│  │  ├─ types.ts          # 6절 타입 정의
│  │  ├─ constants.ts      # 천간/지지/오행 매핑, 문구 사전
│  │  ├─ saju/
│  │  │  ├─ calcSaju.ts
│  │  │  ├─ lunarAdapter.ts     # lunar-javascript 래핑
│  │  │  └─ fallbackSaju.ts     # 자체 간이 계산(검증/degrade)
│  │  ├─ elements/
│  │  │  └─ analyze.ts
│  │  ├─ lotto/
│  │  │  ├─ prng.ts             # mulberry32, fnv1a
│  │  │  └─ drawNumbers.ts
│  │  └─ fortune/
│  │     └─ generateReading.ts
│  └─ ui/
│     ├─ LandingView.tsx
│     ├─ InputForm.tsx
│     ├─ ResultView.tsx
│     └─ components/
│        ├─ NumberBall.tsx      # 로또 공 하나
│        ├─ SajuTable.tsx       # 4주 표
│        └─ ElementBar.tsx      # 오행 막대 그래프
└─ tests/
   └─ domain/*.test.ts          # 핵심 로직 단위 테스트
```

---

## 8. 화면 / 컴포넌트 설계

3개 뷰를 `App`의 상태(`'landing' | 'input' | 'result'`)로 전환.

### 8.1 LandingView
- 서비스명 + 한 줄 소개 + "재미용, 당첨 보장 아님" 배지.
- CTA 버튼: "내 사주로 번호 뽑기" → input 뷰.

### 8.2 InputForm
- 필드: 연/월/일(드롭다운 또는 date input), 달력 선택(양력·음력 라디오), 음력 시 윤달 체크박스, 시(0–23 선택) + **"시 모름" 체크박스**(체크 시 시 입력 비활성).
- 유효성: 존재하지 않는 날짜 방지, 미래 날짜 경고(허용은 하되 안내).
- 개인정보 안내 문구: "입력값은 이 브라우저에서만 계산되며 어디에도 전송·저장되지 않습니다."
- 제출 → 도메인 파이프라인 실행 → result 뷰.

### 8.3 ResultView
- **SajuTable**: 연/월/일/시 4주 간지 표(시 모름이면 시주 칸에 "미상").
- **ElementBar**: 오행 5개 강도 막대.
- **번호 6개**: `NumberBall` 6개(오름차순), 각 공에 오행 색상 힌트(선택).
- **풀이 텍스트**: 조합형 문단.
- 버튼: "다시 보기(입력 수정)", (선택)"공유 링크", "면책 안내".
- 재현성 안내: "같은 생년월일시는 항상 같은 번호가 나옵니다."

### 8.4 공통
- 모바일 우선 반응형(로또는 모바일 사용 비중 높음).
- 로딩 상태는 사실상 불필요(연산 즉시). 라이브러리 지연 로드 시에만 스피너.

---

## 9. 배포 전략

### 9.1 선택: **GitHub Pages를 기본**, Vercel/Netlify는 대안

이유: 토이/개인용이며 정적 산출물만 있으면 됨. GitHub 저장소 하나로 CI(actions) 자동 배포 가능하고 무료.

### 9.2 빌드 산출물 흐름

```
소스(src) ──vite build──▶ dist/ (index.html + assets/*.js,*.css)
                              │
                     정적 호스팅에 그대로 업로드
                              │
             ┌────────────────┼─────────────────┐
        GitHub Pages       Vercel(Static)     Netlify
     (gh-pages 브랜치     (프레임워크        (publish dir
      또는 Actions)        preset: Vite)      = dist)
```

### 9.3 주의점
- **`base` 경로**: GitHub Pages의 프로젝트 페이지는 `/<repo>/` 하위 경로에 배포됨 → `vite.config.ts`에서 `base: '/saju-lotto/'` 설정 필요. (Vercel/Netlify는 루트라 `base: '/'`.) 배포 대상 결정 후 확정.
- **라우터**: 단일 페이지 상태 전환으로 처리하므로 SPA 새로고침 404 문제 없음(라우터 도입 시에만 HashRouter로 회피).
- **CI(선택)**: push 시 `npm ci && npm run build` → `gh-pages` 배포하는 GitHub Actions 워크플로 1개. 토이라 수동 배포도 무방.

---

## 10. 개발 단계 작업 분해 (Task Breakdown)

우선순위: P0(필수/차단요소) > P1(핵심 기능) > P2(부가). 의존성은 "→ 선행".

### P0 — 프로젝트 기반
- [ ] (P0) Vite + React + TS 프로젝트 생성 (`temp/saju-lotto/`)
- [ ] (P0) `domain/types.ts`, `constants.ts`(천간/지지/오행 매핑) 정의 — 이후 모든 작업의 기반
- [ ] (P0) lunar-javascript 설치 및 **라이선스/번들 크기 확인** → 채택 확정 (미결정 해소)

### P1 — 도메인 로직 (순수, 테스트 우선)
- [ ] (P1) `saju/lunarAdapter.ts` + `calcSaju.ts` : BirthInput → SajuChart  *(→ types, 라이브러리)*
- [ ] (P1) 알려진 만세력 샘플 5~10건으로 `calcSaju` **정확도 검증 테스트** *(→ calcSaju)*
- [ ] (P1) `elements/analyze.ts` : 오행 집계 + 강도 정규화 + 일간 추출  *(→ calcSaju)*
- [ ] (P1) `lotto/prng.ts` (mulberry32, fnv1a) + `drawNumbers.ts` : 가중 샘플링  *(→ analyze)*
- [ ] (P1) drawNumbers 테스트: 항상 6개/1–45/중복없음/재현성  *(→ drawNumbers)*
- [ ] (P1) `fortune/generateReading.ts` + 문구 사전  *(→ analyze)*

### P1 — UI
- [ ] (P1) `App.tsx` 뷰 전환 골격 + 도메인 파이프라인 연결
- [ ] (P1) `InputForm.tsx` : 날짜/양음력/시 모름/윤달 + 유효성 + 개인정보 문구  *(→ types)*
- [ ] (P1) `ResultView.tsx` : SajuTable + ElementBar + NumberBall×6 + 풀이  *(→ 도메인 전체)*
- [ ] (P1) 면책/개인정보 문구 노출(랜딩·입력·결과)

### P2 — 마감/배포/부가
- [ ] (P2) 모바일 반응형 스타일 정리
- [ ] (P2) `fallbackSaju.ts` 자체 계산 + 라이브러리와 교차검증 테스트
- [ ] (P2) 배포 설정(`base` 경로) + GitHub Pages 수동/Actions 배포
- [ ] (P2) "다시 보기" / (선택)"공유 링크"(경고 포함)
- [ ] (P2) 오행 색상 힌트, 애니메이션 등 폴리싱

---

## 11. 리스크 / 미결정 사항

| # | 항목 | 리스크/내용 | 대응 |
|---|---|---|---|
| 1 | lunar-javascript 라이선스/유지보수 | 라이선스가 상용/배포에 부적합하거나 미유지 시 문제 | 착수 시 LICENSE 확인. 부적합하면 자체 fallback으로 전환(월주 정확도 하락 감수) |
| 2 | 번들 크기 | 만세력 테이블 포함 시 JS 용량 증가 가능 | 지연 로드(dynamic import) 또는 트리셰이킹 확인 |
| 3 | 시주 정확도 | 진태양시/야자시 미보정으로 경계 시간대 결과 상이 | UI에 명시. 정밀 보정은 범위 밖(엔터 목적) |
| 4 | 월주 절기 계산 | 자체 fallback은 절기 근사라 경계일 오차 | 런타임은 라이브러리 사용으로 회피 |
| 5 | 오행 집계 정밀도 | 본기만 집계(지장간 미반영)로 명리 관점 단순 | 의도된 단순화. 후속 옵션으로 지장간 가중 가능 |
| 6 | 공유 링크의 개인정보 | 생년월일이 URL에 노출 | 기본 비활성 + 사용자 명시 동의 시에만 생성, 경고 표시 |
| 7 | 결과의 결정성 vs 기대 | "매번 같은 번호"에 사용자가 실망할 수 있음 | 재현성은 의도된 사양임을 UI로 설명. (원하면 "랜덤 재추첨" 별도 버튼 제공 검토) |
| 8 | 미래/윤달 등 예외 입력 | 잘못된 날짜/윤달 없는 달 선택 등 | InputForm 유효성 + 라이브러리 예외 처리 |

---

### 부록: 핵심 설계 결정 요약
- 서버리스 제약 → **순수 클라이언트 파이프라인**(계산 4단계 전부 브라우저).
- 정확도 → **라이브러리(lunar-javascript) 기반 실용 정확** + 자체 검증.
- 추첨 → **결정적 시드 + 오행 가중 샘플링**(재현성 + 서사).
- 풀이 → **조합형 템플릿**(외부 호출 없음).
- 배포 → **Vite 정적 빌드 → GitHub Pages**.
