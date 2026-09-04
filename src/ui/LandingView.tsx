import styles from './LandingView.module.css'

interface Props {
  onStart: () => void
}

export default function LandingView({ onStart }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <div className={styles.badge}>재미용 · 당첨 보장 없음</div>
        <h1 className={styles.title}>사주 로또</h1>
        <p className={styles.subtitle}>내 사주의 오행으로 뽑는 행운의 번호</p>
        <div className={styles.symbols} aria-hidden="true">
          <span>🪵</span><span>🔥</span><span>🌍</span><span>⚙️</span><span>💧</span>
        </div>
        <button className={styles.cta} onClick={onStart}>
          내 사주로 번호 뽑기
        </button>
        <p className={styles.privacy}>
          입력값은 브라우저에서만 계산되며<br />
          어디에도 전송·저장되지 않습니다
        </p>
      </div>
    </div>
  )
}
