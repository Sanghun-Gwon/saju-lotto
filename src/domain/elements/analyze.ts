import type { SajuChart, ElementProfile, Element } from '../types';
import { STEM_TO_ELEMENT, ALL_ELEMENTS } from '../constants';

function zeroCount(): Record<Element, number> {
  return { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
}

/**
 * SajuChart → ElementProfile.
 *
 * ssaju가 fiveElements를 이미 계산해주지만, SajuChart만 가지고도
 * 도메인 로직이 독립적으로 동작할 수 있도록 천간+지지 직접 집계 방식 유지.
 * (ssaju fiveElements를 우선 활용하려면 getRawSsajuResult()와 함께 사용)
 *
 * 시주 null이면 3주(년/월/일)만 집계.
 */
export function analyzeElements(
  chart: SajuChart,
  /** ssaju에서 받은 오행 집계가 있으면 우선 사용 (더 정확) */
  ssajuCount?: Record<Element, number>,
): ElementProfile {
  const count: Record<Element, number> = ssajuCount
    ? { ...ssajuCount }
    : buildCountFromChart(chart);

  const total = ALL_ELEMENTS.reduce((sum, el) => sum + count[el], 0);
  const strength = zeroCount();
  for (const el of ALL_ELEMENTS) {
    strength[el] = total > 0 ? count[el] / total : 0;
  }

  let strongest: Element = ALL_ELEMENTS[0];
  let weakest: Element = ALL_ELEMENTS[0];
  for (const el of ALL_ELEMENTS) {
    if (count[el] > count[strongest]) strongest = el;
    if (count[el] < count[weakest]) weakest = el;
  }

  const dayGan = chart.day.gan;
  const dayGanKo = chart.day.ganKo;
  const dayElement = STEM_TO_ELEMENT[dayGan] ?? 'earth';

  return { count, strength, strongest, weakest, dayGan, dayGanKo, dayElement };
}

/** 차트에서 직접 오행 집계 (ssaju 데이터 없을 때 fallback) */
function buildCountFromChart(chart: SajuChart): Record<Element, number> {
  const count = zeroCount();
  const pillars = [chart.year, chart.month, chart.day];
  if (chart.hour) pillars.push(chart.hour);

  for (const p of pillars) {
    const ganEl = STEM_TO_ELEMENT[p.gan];
    const zhiEl = STEM_TO_ELEMENT[p.zhi] ?? elementFromBranch(p.zhi);
    if (ganEl) count[ganEl] += 1;
    if (zhiEl) count[zhiEl] += 1;
  }
  return count;
}

/** 지지 → 오행 (본기 기준, constants의 BRANCH_TO_ELEMENT 재활용 피하려고 인라인) */
function elementFromBranch(zhi: string): Element | undefined {
  const map: Record<string, Element> = {
    子: 'water', 丑: 'earth', 寅: 'wood', 卯: 'wood',
    辰: 'earth', 巳: 'fire', 午: 'fire', 未: 'earth',
    申: 'metal', 酉: 'metal', 戌: 'earth', 亥: 'water',
  };
  return map[zhi];
}
