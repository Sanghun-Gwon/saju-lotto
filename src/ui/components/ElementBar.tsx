import type { ElementProfile } from '../../domain/types'
import { ALL_ELEMENTS, ELEMENT_COLOR, ELEMENT_LABEL } from '../../domain/constants'
import styles from './ElementBar.module.css'

interface Props {
  profile: ElementProfile
}

export default function ElementBar({ profile }: Props) {
  const maxStrength = Math.max(...ALL_ELEMENTS.map(el => profile.strength[el]), 1)

  return (
    <div className={styles.container}>
      {ALL_ELEMENTS.map(el => {
        const pct = Math.round((profile.strength[el] / maxStrength) * 100)
        const isStrongest = el === profile.strongest

        return (
          <div key={el} className={styles.row}>
            <div className={styles.labelWrap}>
              <span
                className={`${styles.label} ${isStrongest ? styles.strongest : ''}`}
                style={{ color: ELEMENT_COLOR[el] }}
              >
                {ELEMENT_LABEL[el]}
              </span>
              {isStrongest && <span className={styles.star}>★</span>}
            </div>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${pct}%`, background: ELEMENT_COLOR[el] }}
              />
            </div>
            <span className={styles.count}>{profile.count[el]}</span>
          </div>
        )
      })}
    </div>
  )
}
