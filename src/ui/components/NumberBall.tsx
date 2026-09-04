import styles from './NumberBall.module.css'

interface Props {
  number: number
}

function getBallColor(n: number): string {
  if (n >= 1 && n <= 10) return '#f59e0b'
  if (n >= 11 && n <= 20) return '#3b82f6'
  if (n >= 21 && n <= 30) return '#ef4444'
  if (n >= 31 && n <= 40) return '#6b7280'
  return '#22c55e'
}

function getTextColor(n: number): string {
  if ((n >= 1 && n <= 10) || n >= 41) return '#1a1a1a'
  return '#fff'
}

export default function NumberBall({ number }: Props) {
  return (
    <div
      className={styles.ball}
      style={{ background: getBallColor(number), color: getTextColor(number) }}
      aria-label={`${number}번`}
    >
      {number}
    </div>
  )
}
