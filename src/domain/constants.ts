import type { Element } from './types';

/** 천간 10개 (한자) */
export const HEAVENLY_STEMS = [
  '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸',
] as const;

/** 천간 한글 */
export const HEAVENLY_STEMS_KO = [
  '갑', '을', '병', '정', '무', '기', '경', '신', '임', '계',
] as const;

/** 지지 12개 (한자) */
export const EARTHLY_BRANCHES = [
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
] as const;

/** 지지 한글 */
export const EARTHLY_BRANCHES_KO = [
  '자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해',
] as const;

/** 천간 한자 → 오행 */
export const STEM_TO_ELEMENT: Record<string, Element> = {
  甲: 'wood', 乙: 'wood',
  丙: 'fire', 丁: 'fire',
  戊: 'earth', 己: 'earth',
  庚: 'metal', 辛: 'metal',
  壬: 'water', 癸: 'water',
};

/** 지지 한자 → 오행 (본기 기준) */
export const BRANCH_TO_ELEMENT: Record<string, Element> = {
  子: 'water',
  丑: 'earth',
  寅: 'wood',
  卯: 'wood',
  辰: 'earth',
  巳: 'fire',
  午: 'fire',
  未: 'earth',
  申: 'metal',
  酉: 'metal',
  戌: 'earth',
  亥: 'water',
};

/** 한자 → 한글 변환 헬퍼 */
export function stemToKo(gan: string): string {
  const i = HEAVENLY_STEMS.indexOf(gan as (typeof HEAVENLY_STEMS)[number]);
  return i >= 0 ? HEAVENLY_STEMS_KO[i] : gan;
}
export function branchToKo(zhi: string): string {
  const i = EARTHLY_BRANCHES.indexOf(zhi as (typeof EARTHLY_BRANCHES)[number]);
  return i >= 0 ? EARTHLY_BRANCHES_KO[i] : zhi;
}

/** 오행 한글 라벨 */
export const ELEMENT_LABEL: Record<Element, string> = {
  wood: '목(木)',
  fire: '화(火)',
  earth: '토(土)',
  metal: '금(金)',
  water: '수(水)',
};

/** 오행 색상 (UI/그룹핑용) */
export const ELEMENT_COLOR: Record<Element, string> = {
  wood: '#2e8b57',
  fire: '#e2483d',
  earth: '#d4a017',
  metal: '#9aa0a6',
  water: '#2b6cb0',
};

/**
 * 로또 번호(1~45) → 오행 매핑.
 * 끝자리(1의 자리) 기준으로 오행에 배정.
 */
export const LAST_DIGIT_TO_ELEMENT: Record<number, Element> = {
  1: 'wood', 2: 'wood',
  3: 'fire', 4: 'fire',
  5: 'earth', 6: 'earth',
  7: 'metal', 8: 'metal',
  9: 'water', 0: 'water',
};

/** 번호 → 오행 헬퍼 */
export function numberToElement(n: number): Element {
  return LAST_DIGIT_TO_ELEMENT[n % 10];
}

/** 일간(천간) 성향 사전 (10개) */
export const DAY_GAN_TRAITS: Record<string, string> = {
  甲: '큰 나무처럼 곧고 진취적이며 리더십이 있는 성향',
  乙: '유연한 풀과 넝쿨처럼 부드럽고 적응력이 뛰어난 성향',
  丙: '태양처럼 밝고 열정적이며 표현력이 강한 성향',
  丁: '촛불처럼 따뜻하고 섬세하며 배려심이 깊은 성향',
  戊: '큰 산처럼 듬직하고 포용력 있으며 신뢰를 주는 성향',
  己: '기름진 밭처럼 실속 있고 꼼꼼하며 현실적인 성향',
  庚: '단단한 쇠처럼 결단력 있고 의리를 중시하는 성향',
  辛: '보석처럼 예리하고 감각적이며 자존감이 높은 성향',
  壬: '큰 물처럼 지혜롭고 포부가 크며 유연한 성향',
  癸: '이슬비처럼 섬세하고 통찰력 있으며 상상력이 풍부한 성향',
};

/** 오행이 강할 때의 해석 사전 */
export const ELEMENT_STRONG: Record<Element, string> = {
  wood: '성장과 추진력이 강해 새로운 일을 벌이고 밀어붙이는 힘이 넘칩니다.',
  fire: '열정과 표현력이 강해 사람을 끌어당기고 분위기를 밝히는 힘이 있습니다.',
  earth: '안정감과 신뢰가 강해 주변을 든든하게 지탱하는 중심축이 됩니다.',
  metal: '결단력과 원칙이 강해 맺고 끊음이 분명하고 추진이 야무집니다.',
  water: '지혜와 융통성이 강해 상황을 읽고 유연하게 흐르는 힘이 있습니다.',
};

/** 오행이 약할 때의 해석 사전 */
export const ELEMENT_WEAK: Record<Element, string> = {
  wood: '추진력과 시작하는 기운이 다소 부족해 결단을 미루기 쉽습니다.',
  fire: '표현과 열정이 다소 약해 속마음을 드러내는 데 시간이 필요합니다.',
  earth: '중심을 잡는 안정감이 다소 약해 마음이 흔들리기 쉽습니다.',
  metal: '맺고 끊는 결단이 다소 약해 우유부단해지기 쉽습니다.',
  water: '융통성과 여유가 다소 부족해 경직되기 쉽습니다.',
};

/** 면책 문구 */
export const DISCLAIMER =
  '본 결과는 재미를 위한 콘텐츠이며, 어떠한 당첨도 보장하지 않습니다. 로또는 확률 게임이니 즐거운 마음으로만 참고하세요.';

/** 모든 오행 배열 (순회용) */
export const ALL_ELEMENTS: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];
