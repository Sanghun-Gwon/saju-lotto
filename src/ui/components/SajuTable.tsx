import type { SajuChart, Pillar } from '../../domain/types'
import styles from './SajuTable.module.css'

interface Props {
  chart: SajuChart
}

interface ColumnDef {
  label: string
  pillar: Pillar | null
}

export default function SajuTable({ chart }: Props) {
  const columns: ColumnDef[] = [
    { label: '연주', pillar: chart.year },
    { label: '월주', pillar: chart.month },
    { label: '일주', pillar: chart.day },
    { label: '시주', pillar: chart.hour },
  ]

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.label} className={styles.th}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {columns.map(col => (
              <td key={col.label} className={styles.td}>
                {col.pillar ? (
                  <div className={styles.pillar}>
                    <span className={styles.gan}>
                      {col.pillar.gan}
                      <small className={styles.ko}>{col.pillar.ganKo}</small>
                    </span>
                    <span className={styles.zhi}>
                      {col.pillar.zhi}
                      <small className={styles.ko}>{col.pillar.zhiKo}</small>
                    </span>
                  </div>
                ) : (
                  <div className={styles.unknown}>미상</div>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
