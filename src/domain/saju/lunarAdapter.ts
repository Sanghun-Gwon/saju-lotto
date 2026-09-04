import type { BirthInput, SajuChart, Pillar } from '../types';

/**
 * ssaju 어댑터 (https://github.com/golbin/ssaju, MIT 라이선스)
 *
 * ssaju는 한국천문연구원(KASI) 데이터 기반으로 사주팔자를 계산한다.
 * calculateSaju()가 연/월/일/시주 간지를 직접 반환하므로
 * 별도 오행 집계 없이 pillarDetails에서 바로 꺼낼 수 있다.
 *
 * 반환 타입이 d.ts로 제공되지 않아 필요한 구조만 로컬 인터페이스로 정의한다.
 */

interface SsajuPillarDetail {
  stem: string;       // 천간 한자 (예: '甲')
  branch: string;     // 지지 한자 (예: '子')
  stemKo: string;     // 천간 한글 (예: '갑')
  branchKo: string;   // 지지 한글 (예: '자')
  element: {
    stem: string;     // 천간 오행 한글 (예: '목')
    branch: string;   // 지지 오행 한글 (예: '수')
  };
}

interface SsajuResult {
  pillarDetails: {
    year: SsajuPillarDetail;
    month: SsajuPillarDetail;
    day: SsajuPillarDetail;
    hour: SsajuPillarDetail | null;
  };
  fiveElements: Record<string, number>; // { '목': 2, '화': 1, ... }
  dayStem: string;
  dayBranch: string;
}

// ssaju는 ESM/CJS 혼용 패키지일 수 있으므로 동적 import로 처리
type SsajuModule = {
  calculateSaju: (input: {
    year: number;
    month: number;
    day: number;
    hour?: number;
    minute?: number;
    gender?: '남' | '여';
    calendar?: 'solar' | 'lunar';
    leap?: boolean;
  }) => SsajuResult;
};

let _ssaju: SsajuModule | null = null;

async function getSsaju(): Promise<SsajuModule> {
  if (!_ssaju) {
    _ssaju = (await import('ssaju')) as SsajuModule;
  }
  return _ssaju;
}

function makePillar(detail: SsajuPillarDetail): Pillar {
  return {
    gan: detail.stem,
    zhi: detail.branch,
    ganKo: detail.stemKo,
    zhiKo: detail.branchKo,
  };
}

/**
 * BirthInput → SajuChart.
 * ssaju의 calculateSaju()를 호출해 4주 간지를 얻는다.
 * - 시 모름(hour=null): hour를 전달하지 않음 → ssaju 기본값(12) 사용, hour pillar는 null로 남김
 * - 음력/윤달: calendar, leap 파라미터로 ssaju에 전달
 */
export async function toSajuChart(input: BirthInput): Promise<SajuChart> {
  const { calculateSaju } = await getSsaju();

  const result = calculateSaju({
    year: input.year,
    month: input.month,
    day: input.day,
    ...(input.hour !== null ? { hour: input.hour } : {}),
    calendar: input.calendar,
    leap: input.isLeapMonth ?? false,
  });

  const pd = result.pillarDetails;

  return {
    year: makePillar(pd.year),
    month: makePillar(pd.month),
    day: makePillar(pd.day),
    hour: input.hour !== null && pd.hour ? makePillar(pd.hour) : null,
    meta: {
      solar: { year: input.year, month: input.month, day: input.day },
      hasHour: input.hour !== null,
    },
  };
}

/** ssaju의 fiveElements(한글 키) → 우리 Element 타입(영문 키)으로 변환 */
export function ssajuElementsToCount(
  fiveElements: Record<string, number>,
): Record<string, number> {
  return {
    wood: fiveElements['목'] ?? 0,
    fire: fiveElements['화'] ?? 0,
    earth: fiveElements['토'] ?? 0,
    metal: fiveElements['금'] ?? 0,
    water: fiveElements['수'] ?? 0,
  };
}

/** ssaju 원시 결과를 노출 — analyze.ts에서 fiveElements 재활용 */
export async function getRawSsajuResult(input: BirthInput): Promise<SsajuResult> {
  const { calculateSaju } = await getSsaju();
  return calculateSaju({
    year: input.year,
    month: input.month,
    day: input.day,
    ...(input.hour !== null ? { hour: input.hour } : {}),
    calendar: input.calendar,
    leap: input.isLeapMonth ?? false,
  });
}
