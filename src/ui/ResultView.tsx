import type { AppResult } from '../domain/types'
import SajuTable from './components/SajuTable'
import ElementBar from './components/ElementBar'
import NumberBall from './components/NumberBall'
import styles from './ResultView.module.css'

interface Props {
  result: AppResult
  onRedraw: () => void
  onReset: () => void
}

export default function ResultView({ result, onRedraw, onReset }: Props) {
  const { chart, profile, lotto, reading } = result

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <h2 className={styles.title}>사주 로또 결과</h2>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>사주 원국</h3>
          <SajuTable chart={chart} />
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>오행 강도</h3>
          <ElementBar profile={profile} />
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>행운의 번호</h3>
          <div className={styles.balls}>
            {lotto.numbers.map(n => (
              <NumberBall key={n} number={n} />
            ))}
          </div>
          <p className={styles.seedNote}>
            같은 사주는 항상 같은 번호 순서로 시작됩니다 (변형 #{Math.floor(lotto.seed % 1000)})
          </p>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>사주 풀이</h3>
          <div className={styles.reading}>
            <p className={styles.readingItem}><span className={styles.readingIcon}>✦</span>{reading.summary}</p>
            <p className={styles.readingItem}><span className={styles.readingIcon}>◈</span>{reading.personality}</p>
            <p className={styles.readingItem}><span className={styles.readingIcon}>◉</span>{reading.balance}</p>
            <p className={styles.readingItem}><span className={styles.readingIcon}>★</span>{reading.luck}</p>
          </div>
          <p className={styles.disclaimer}>{reading.disclaimer}</p>
        </section>

        <div className={styles.actions}>
          <button className={styles.redraw} onClick={onRedraw}>다시 뽑기</button>
          <button className={styles.reset} onClick={onReset}>처음으로</button>
        </div>
      </div>
    </div>
  )
}
