import { describe, it, expect } from 'vitest';
import type { SajuChart, Pillar } from '../types';
import { analyzeElements } from './analyze';

function P(gan: string, zhi: string): Pillar {
  return { gan, zhi, ganKo: '', zhiKo: '' };
}

// 甲=wood, 子=water / 丙=fire, 午=fire / 甲=wood, 寅=wood / 庚=metal, 申=metal
const chart4: SajuChart = {
  year: P('甲', '子'),   // wood, water
  month: P('丙', '午'),  // fire, fire
  day: P('甲', '寅'),    // wood, wood
  hour: P('庚', '申'),   // metal, metal
  meta: { solar: { year: 1990, month: 6, day: 15 }, hasHour: true },
};

const chart3: SajuChart = {
  year: P('甲', '子'),
  month: P('丙', '午'),
  day: P('甲', '寅'),
  hour: null,
  meta: { solar: { year: 1990, month: 6, day: 15 }, hasHour: false },
};

describe('analyzeElements', () => {
  it('4주: 오행 집계가 정확하다', () => {
    const prof = analyzeElements(chart4);
    expect(prof.count.wood).toBe(3);   // 甲, 甲, 寅
    expect(prof.count.fire).toBe(2);   // 丙, 午
    expect(prof.count.metal).toBe(2);  // 庚, 申
    expect(prof.count.water).toBe(1);  // 子
    expect(prof.count.earth).toBe(0);
  });

  it('4주: count 총합은 8 (4기둥 × 2)', () => {
    const total = Object.values(analyzeElements(chart4).count).reduce((s, x) => s + x, 0);
    expect(total).toBe(8);
  });

  it('strength 합은 1에 근접한다', () => {
    const sum = Object.values(analyzeElements(chart4).strength).reduce((s, x) => s + x, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it('strongest는 wood, weakest는 earth', () => {
    const prof = analyzeElements(chart4);
    expect(prof.strongest).toBe('wood');
    expect(prof.weakest).toBe('earth');
  });

  it('일간 정보가 정확하다', () => {
    const prof = analyzeElements(chart4);
    expect(prof.dayGan).toBe('甲');
    expect(prof.dayElement).toBe('wood');
  });

  it('3주(시주 null): count 총합은 6, metal은 0', () => {
    const prof = analyzeElements(chart3);
    const total = Object.values(prof.count).reduce((s, x) => s + x, 0);
    expect(total).toBe(6);
    expect(prof.count.metal).toBe(0);
  });
});
