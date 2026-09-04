import type { BirthInput, SajuChart } from '../types';
import { toSajuChart } from './lunarAdapter';

export function validateBirthInput(input: BirthInput): void {
  const { year, month, day, hour } = input;

  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new Error('연도는 1900~2100 사이여야 합니다.');
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('월은 1~12 사이여야 합니다.');
  }
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    throw new Error('일은 1~31 사이여야 합니다.');
  }
  if (hour !== null && (!Number.isInteger(hour) || hour < 0 || hour > 23)) {
    throw new Error('시는 0~23 사이이거나 미상(null)이어야 합니다.');
  }

  if (input.calendar === 'solar') {
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
      throw new Error('존재하지 않는 날짜입니다.');
    }
  }
}

/** 검증 후 ssaju로 사주 계산 */
export async function calcSaju(input: BirthInput): Promise<SajuChart> {
  validateBirthInput(input);
  return toSajuChart(input);
}
