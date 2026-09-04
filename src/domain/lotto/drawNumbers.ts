import type { ElementProfile, LottoResult, Element } from '../types';
import { ALL_ELEMENTS, numberToElement } from '../constants';
import { fnv1a_32, mulberry32 } from './prng';

export function makeSeed(profile: ElementProfile, variation = 0): number {
  const key =
    ALL_ELEMENTS.map((el) => `${el}:${profile.count[el]}`).join('|') +
    `|day:${profile.dayGan}` +
    `|v:${variation}`;
  return fnv1a_32(key);
}

function elementWeights(profile: ElementProfile): Record<Element, number> {
  const w = {} as Record<Element, number>;
  for (const el of ALL_ELEMENTS) {
    // 기본 1 + 강도*4 → 강한 오행 번호가 최대 5배 잘 뽑힘. base 1로 0 방지.
    w[el] = 1 + profile.strength[el] * 4;
  }
  return w;
}

/**
 * 가중 무복원 샘플링으로 1~45 중 6개 추출.
 * 항상 6개, 중복 없음, 오름차순 보장.
 * variation 파라미터로 재추첨 시 다른 결과 생성.
 */
export function drawNumbers(profile: ElementProfile, variation = 0): LottoResult {
  const seed = makeSeed(profile, variation);
  const rng = mulberry32(seed);
  const weights = elementWeights(profile);

  const candidates: number[] = [];
  for (let n = 1; n <= 45; n++) candidates.push(n);
  const candWeight = candidates.map((n) => weights[numberToElement(n)]);

  const picked: number[] = [];

  for (let k = 0; k < 6; k++) {
    const totalW = candWeight.reduce((s, x) => s + x, 0);
    let r = rng() * totalW;
    let idx = 0;
    for (; idx < candidates.length; idx++) {
      r -= candWeight[idx];
      if (r <= 0) break;
    }
    if (idx >= candidates.length) idx = candidates.length - 1;

    picked.push(candidates[idx]);
    candidates.splice(idx, 1);
    candWeight.splice(idx, 1);
  }

  picked.sort((a, b) => a - b);

  const byElement: Record<Element, number[]> = {
    wood: [], fire: [], earth: [], metal: [], water: [],
  };
  for (const n of picked) {
    byElement[numberToElement(n)].push(n);
  }

  return { numbers: picked, byElement, seed };
}
