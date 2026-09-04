// 도메인 타입 정의 (React/DOM 무관 순수 타입)

/** 오행 (Five Elements) */
export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

/** 사용자 생년월일시 입력 */
export interface BirthInput {
  /** 양력 or 음력 */
  calendar: 'solar' | 'lunar';
  year: number;
  month: number; // 1~12
  day: number; // 1~31
  /** 시(0~23). 모르면 null → 시주(hour pillar) 계산 제외 */
  hour: number | null;
  /** 음력일 때만 의미. 윤달 여부 */
  isLeapMonth?: boolean;
}

/** 사주의 한 기둥 (간지 = 천간 + 지지) */
export interface Pillar {
  /** 천간 한자 (예: '甲') */
  gan: string;
  /** 지지 한자 (예: '子') */
  zhi: string;
  /** 천간 한글 (예: '갑') */
  ganKo: string;
  /** 지지 한글 (예: '자') */
  zhiKo: string;
}

/** 사주 원국 (4주 또는 시주 미상 시 3주) */
export interface SajuChart {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  /** 시 모름이면 null */
  hour: Pillar | null;
  /** 계산 근거 메타 */
  meta: {
    /** 실제 계산에 사용된 양력 기준 값 */
    solar: { year: number; month: number; day: number };
    /** 시주 포함 여부 */
    hasHour: boolean;
  };
}

/** 오행별 집계/강도 프로파일 */
export interface ElementProfile {
  /** 오행별 원시 개수 (천간+지지 합산) */
  count: Record<Element, number>;
  /** 오행별 정규화 강도 0~1 (합이 대략 1) */
  strength: Record<Element, number>;
  /** 가장 강한 오행 */
  strongest: Element;
  /** 가장 약한 오행 */
  weakest: Element;
  /** 일간 (Day Master) 천간 한자 */
  dayGan: string;
  /** 일간 한글 */
  dayGanKo: string;
  /** 일간의 오행 */
  dayElement: Element;
}

/** 로또 추첨 결과 */
export interface LottoResult {
  /** 오름차순 정렬된 중복 없는 6개 (1~45) */
  numbers: number[];
  /** 오행별로 그룹핑된 번호 */
  byElement: Record<Element, number[]>;
  /** 재현/디버깅용 시드 */
  seed: number;
}

/** 사주 풀이 텍스트 */
export interface ReadingText {
  /** 요약 한 줄 */
  summary: string;
  /** 성향 문단 */
  personality: string;
  /** 오행 균형 문단 */
  balance: string;
  /** 행운 조언 문단 */
  luck: string;
  /** 면책 문구 */
  disclaimer: string;
}

/** 앱 최종 결과 (조합) */
export interface AppResult {
  chart: SajuChart;
  profile: ElementProfile;
  lotto: LottoResult;
  reading: ReadingText;
}
