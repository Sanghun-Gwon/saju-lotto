import { useState } from 'react'
import { calcSaju } from './domain/saju/calcSaju'
import { analyzeElements } from './domain/elements/analyze'
import { drawNumbers } from './domain/lotto/drawNumbers'
import { generateReading } from './domain/fortune/generateReading'
import type { BirthInput, AppResult } from './domain/types'
import LandingView from './ui/LandingView'
import InputForm from './ui/InputForm'
import ResultView from './ui/ResultView'

type View = 'landing' | 'input' | 'result'

export default function App() {
  const [view, setView] = useState<View>('landing')
  const [result, setResult] = useState<AppResult | null>(null)
  const [variation, setVariation] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastInput, setLastInput] = useState<BirthInput | null>(null)

  async function handleSubmit(input: BirthInput) {
    setLoading(true)
    setError(null)
    setLastInput(input)
    setVariation(0)
    try {
      const chart = await calcSaju(input)
      const profile = analyzeElements(chart)
      const lotto = drawNumbers(profile, 0)
      const reading = generateReading(profile, lotto)
      setResult({ chart, profile, lotto, reading })
      setView('result')
    } catch (e) {
      setError(e instanceof Error ? e.message : '사주 계산 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function handleRedraw() {
    if (!result) return
    const nextVariation = variation + 1
    setVariation(nextVariation)
    const lotto = drawNumbers(result.profile, nextVariation)
    const reading = generateReading(result.profile, lotto)
    setResult({ ...result, lotto, reading })
  }

  function handleReset() {
    setView('landing')
    setResult(null)
    setError(null)
    setLastInput(null)
    setVariation(0)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#6b7280', fontSize: '14px' }}>사주를 계산하는 중...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', margin: '16px auto', maxWidth: '480px', borderRadius: '8px', fontSize: '14px' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 'bold' }}>✕</button>
        </div>
      )}
      {view === 'landing' && <LandingView onStart={() => setView('input')} />}
      {view === 'input' && (
        <InputForm
          onSubmit={handleSubmit}
          onBack={() => setView('landing')}
          initialValues={lastInput ?? undefined}
        />
      )}
      {view === 'result' && result && (
        <ResultView
          result={result}
          onRedraw={handleRedraw}
          onReset={handleReset}
        />
      )}
    </>
  )
}
