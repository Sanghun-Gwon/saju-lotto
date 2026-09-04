import { useState } from 'react'
import type { BirthInput } from '../domain/types'
import styles from './InputForm.module.css'

interface Props {
  onSubmit: (input: BirthInput) => void
  onBack: () => void
  initialValues?: BirthInput
}

export default function InputForm({ onSubmit, onBack, initialValues }: Props) {
  const [calendar, setCalendar] = useState<'solar' | 'lunar'>(initialValues?.calendar ?? 'solar')
  const [isLeapMonth, setIsLeapMonth] = useState(initialValues?.isLeapMonth ?? false)
  const [year, setYear] = useState(initialValues?.year?.toString() ?? '')
  const [month, setMonth] = useState(initialValues?.month?.toString() ?? '')
  const [day, setDay] = useState(initialValues?.day?.toString() ?? '')
  const [unknownHour, setUnknownHour] = useState(initialValues ? initialValues.hour === null : true)
  const [hour, setHour] = useState(initialValues?.hour?.toString() ?? '0')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const errs: Record<string, string> = {}
    const y = parseInt(year)
    const m = parseInt(month)
    const d = parseInt(day)

    if (!year || isNaN(y) || y < 1900 || y > 2100) errs.year = '연도는 1900~2100 사이여야 합니다'
    if (!month || isNaN(m) || m < 1 || m > 12) errs.month = '월을 선택해주세요'
    if (!day || isNaN(d) || d < 1 || d > 31) errs.day = '일을 선택해주세요'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const input: BirthInput = {
      calendar,
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      hour: unknownHour ? null : parseInt(hour),
      ...(calendar === 'lunar' ? { isLeapMonth } : {}),
    }
    onSubmit(input)
  }

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1)
  const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1)
  const hourOptions = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <button className={styles.back} onClick={onBack} type="button">← 뒤로</button>
        <h2 className={styles.title}>생년월일 입력</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label}>달력 종류</label>
            <div className={styles.radioGroup}>
              <label className={styles.radio}>
                <input type="radio" name="calendar" value="solar" checked={calendar === 'solar'} onChange={() => setCalendar('solar')} />
                양력
              </label>
              <label className={styles.radio}>
                <input type="radio" name="calendar" value="lunar" checked={calendar === 'lunar'} onChange={() => setCalendar('lunar')} />
                음력
              </label>
            </div>
            {calendar === 'lunar' && (
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={isLeapMonth} onChange={e => setIsLeapMonth(e.target.checked)} />
                윤달
              </label>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="year">연도</label>
            <input
              id="year"
              type="number"
              className={`${styles.input} ${errors.year ? styles.inputError : ''}`}
              placeholder="예: 1990"
              min={1900}
              max={2100}
              value={year}
              onChange={e => setYear(e.target.value)}
            />
            {errors.year && <span className={styles.errorMsg}>{errors.year}</span>}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="month">월</label>
              <select
                id="month"
                className={`${styles.select} ${errors.month ? styles.inputError : ''}`}
                value={month}
                onChange={e => setMonth(e.target.value)}
              >
                <option value="">월</option>
                {monthOptions.map(m => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
              {errors.month && <span className={styles.errorMsg}>{errors.month}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="day">일</label>
              <select
                id="day"
                className={`${styles.select} ${errors.day ? styles.inputError : ''}`}
                value={day}
                onChange={e => setDay(e.target.value)}
              >
                <option value="">일</option>
                {dayOptions.map(d => (
                  <option key={d} value={d}>{d}일</option>
                ))}
              </select>
              {errors.day && <span className={styles.errorMsg}>{errors.day}</span>}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>태어난 시</label>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={unknownHour} onChange={e => setUnknownHour(e.target.checked)} />
              시(時)를 모릅니다
            </label>
            {!unknownHour && (
              <select className={styles.select} value={hour} onChange={e => setHour(e.target.value)}>
                {hourOptions.map(h => (
                  <option key={h} value={h}>{h}시</option>
                ))}
              </select>
            )}
          </div>

          <button type="submit" className={styles.submit}>번호 뽑기 🎰</button>
        </form>
      </div>
    </div>
  )
}
