import { describe, it, expect } from 'vitest';
import type { ElementProfile, Element } from '../types';
import { drawNumbers, makeSeed } from './drawNumbers';

function makeProfile(
  count: Record<Element, number>,
  dayGan = '甲',
): ElementProfile {
  const total = Object.values(count).reduce((s, x) => s + x, 0);
  const strength = {
    wood: total ? count.wood / total : 0,
    fire: total ? count.fire / total : 0,
    earth: total ? count.earth / total : 0,
    metal: total ? count.metal / total : 0,
    water: total ? count.water / total : 0,
  };
  const entries = Object.entries(count) as [Element, number][];
  const strongest = entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  const weakest = entries.reduce((a, b) => (b[1] < a[1] ? b : a))[0];
  return { count, strength, strongest, weakest, dayGan, dayGanKo: '갑', dayElement: 'wood' };
}

const sample = makeProfile({ wood: 3, fire: 2, earth: 1, metal: 1, water: 1 });

describe('drawNumbers', () => {
  it('항상 6개를 반환한다', () => {
    expect(drawNumbers(sample).numbers).toHaveLength(6);
  });

  it('모든 번호가 1~45 범위 안에 있다', () => {
    for (const n of drawNumbers(sample).numbers) {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(45);
    }
  });

  it('중복이 없다', () => {
    const res = drawNumbers(sample);
    expect(new Set(res.numbers).size).toBe(6);
  });

  it('오름차순으로 정렬되어 있다', () => {
    const res = drawNumbers(sample);
    expect(res.numbers).toEqual([...res.numbers].sort((a, b) => a - b));
  });

  it('같은 입력이면 항상 같은 결과 (재현성)', () => {
    const a = drawNumbers(sample);
    const b = drawNumbers(sample);
    expect(a.numbers).toEqual(b.numbers);
    expect(a.seed).toBe(b.seed);
  });

  it('variation이 다르면 시드가 달라진다', () => {
    expect(makeSeed(sample, 0)).not.toBe(makeSeed(sample, 1));
  });

  it('byElement의 번호 총합이 numbers와 일치한다', () => {
    const res = drawNumbers(sample);
    const flat = Object.values(res.byElement).flat().sort((a, b) => a - b);
    expect(flat).toEqual(res.numbers);
  });

  it('극단적 프로파일에서도 항상 유효한 6개를 만든다', () => {
    const profiles = [
      makeProfile({ wood: 0, fire: 0, earth: 8, metal: 0, water: 0 }),
      makeProfile({ wood: 2, fire: 2, earth: 2, metal: 1, water: 1 }),
      makeProfile({ wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }), // 총합 0 방어
    ];
    for (const p of profiles) {
      const res = drawNumbers(p);
      expect(res.numbers).toHaveLength(6);
      expect(new Set(res.numbers).size).toBe(6);
    }
  });
});
