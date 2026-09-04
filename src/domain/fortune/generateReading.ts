import type { ElementProfile, LottoResult, ReadingText } from '../types';
import {
  DAY_GAN_TRAITS,
  ELEMENT_STRONG,
  ELEMENT_WEAK,
  ELEMENT_LABEL,
  DISCLAIMER,
} from '../constants';
import { fnv1a_32, mulberry32 } from '../lotto/prng';

function pick<T>(rng: () => number, arr: readonly T[]): T {
  const i = Math.floor(rng() * arr.length);
  return arr[Math.min(i, arr.length - 1)];
}

/** ElementProfile + LottoResult → ReadingText. 결정적 조합형 템플릿. */
export function generateReading(
  profile: ElementProfile,
  lotto?: LottoResult,
): ReadingText {
  const seedKey =
    `${profile.dayGan}|${profile.strongest}|${profile.weakest}` +
    (lotto ? `|${lotto.seed}` : '');
  const rng = mulberry32(fnv1a_32(seedKey));

  const trait = DAY_GAN_TRAITS[profile.dayGan] ?? '고유한 개성을 지닌 성향';
  const strongLabel = ELEMENT_LABEL[profile.strongest];
  const weakLabel = ELEMENT_LABEL[profile.weakest];

  const summaryTemplates = [
    `${profile.dayGanKo}(${profile.dayGan}) 일간, ${strongLabel} 기운이 돋보이는 사주입니다.`,
    `당신의 중심은 ${profile.dayGanKo}(${profile.dayGan}) 일간, ${strongLabel} 기운이 강합니다.`,
    `${strongLabel} 기운이 이끄는 ${profile.dayGanKo}(${profile.dayGan}) 일간의 사주입니다.`,
  ] as const;

  const personalityIntro = ['타고난 성향을 보면,', '기질을 살펴보면,', '본바탕을 들여다보면,'] as const;
  const personality = `${pick(rng, personalityIntro)} ${trait}입니다. ${ELEMENT_STRONG[profile.strongest]}`;

  const balanceIntro = ['오행의 균형을 보면,', '기운의 흐름을 보면,', '다섯 기운을 살피면,'] as const;
  const balance = `${pick(rng, balanceIntro)} ${strongLabel}이 강한 반면 ${weakLabel}이 상대적으로 약합니다. ${ELEMENT_WEAK[profile.weakest]}`;

  const luckIntro = ['행운을 부르려면,', '기운을 채우려면,', '균형을 위해서는,'] as const;
  const luckTail = lotto
    ? ` 이번에 뽑힌 번호에는 부족한 ${weakLabel} 기운을 보완하는 흐름이 담겨 있습니다.`
    : '';
  const luck = `${pick(rng, luckIntro)} 부족한 ${weakLabel} 기운을 채워주는 색과 방향을 가까이하면 좋습니다.${luckTail}`;

  return {
    summary: pick(rng, summaryTemplates),
    personality,
    balance,
    luck,
    disclaimer: DISCLAIMER,
  };
}
