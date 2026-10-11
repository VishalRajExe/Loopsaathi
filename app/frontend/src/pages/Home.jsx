import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, Cpu, ScanLine, Truck } from 'lucide-react'
import { api } from '../api/client.js'
import { Artwork } from '../components/Artwork.jsx'
import { DemoBadge, ErrorState } from '../components/UI.jsx'
import { weight } from '../data/options.js'

const actions = [
  { to: '/guide', title: 'Waste guide', detail: 'Identify an item', icon: ScanLine, art: 'scan', color: 'bg-brand-soft' },
  { to: '/request', title: 'Request pickup', detail: 'Choose a time', icon: Truck, art: 'truck', color: 'bg-brand-soft' },
  { to: '/ewaste', title: 'E-waste', detail: 'Take the dedicated route', icon: Cpu, art: 'phone', color: 'bg-ewaste-soft' },
  { to: '/impact', title: 'Impact', detail: 'See recorded outcomes', icon: BarChart3, art: 'impact', color: 'bg-dry-soft' },
]

export default function Home() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    api.impact(controller.signal).then((value) => { setSummary(value); setError('') }).catch((err) => {
      if (err.name !== 'AbortError') setError(err.message)
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [retry])
  return <div className="space-y-8">
    <section className="relative overflow-hidden rounded-[28px] border border-brand/10 bg-gradient-to-br from-brand-soft via-[#F1F8F2] to-bg px-6 py-8 sm:px-10 sm:py-12">
      <div className="relative z-10 max-w-xl"><p className="eyebrow">LoopSaathi · local demo</p><h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-[-0.05em] text-ink sm:text-5xl">Every item deserves<br />the right next step.</h1><p className="mt-4 text-muted">Identify it. Request pickup. See where it goes.</p><Link to="/guide" className="btn mt-6 bg-brand text-white hover:bg-brand-dark">Start with an item <ArrowRight size={18} /></Link></div>
      <Artwork kind="loop" className="absolute -bottom-8 -right-10 h-52 w-52 opacity-60 sm:bottom-0 sm:right-5 sm:h-60 sm:w-60" />
    </section>
    <section aria-labelledby="actions-title"><div className="mb-4 flex items-center justify-between"><h2 id="actions-title" className="font-display text-xl font-bold">What would you like to do?</h2><span className="text-sm text-muted">4 ways forward</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{actions.map(({ to, title, detail, icon: Icon, art, color }) => <Link to={to} key={to} className="panel group relative flex min-h-[195px] flex-col justify-between overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:z-10"><div className="relative z-10 flex items-center gap-2 text-brand"><Icon size={20} strokeWidth={2.2} /><span className="text-xs font-bold uppercase tracking-[0.12em]">Take action</span></div><Artwork kind={art} className={`absolute -right-8 -top-4 h-40 w-40 rounded-full ${color} opacity-75 transition-transform duration-200 group-hover:scale-105`} /><div className="relative z-10"><h3 className="font-display text-lg font-extrabold text-ink">{title}</h3><p className="mt-0.5 text-sm text-muted">{detail}</p></div><ArrowRight size={19} className="absolute bottom-5 right-5 text-brand" /></Link>)}</div></section>
    <section aria-label="Recorded impact" className="panel flex flex-wrap items-center gap-4 p-5 sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-lg font-bold">From request to result</h2>{summary?.containsDemoData && <DemoBadge />}</div><p className="text-sm text-muted">Figures reflect stored local records.</p></div>{loading ? <div className="skeleton h-10 w-48 rounded-lg" role="status" aria-label="Loading impact" /> : error ? <ErrorState compact message={error} retry={() => setRetry((value) => value + 1)} /> : <div className="flex gap-6 text-sm"><div><strong className="block font-display text-xl text-ink tabular-nums">{summary?.totalRequests ?? 0}</strong><span className="text-muted">requests</span></div><div><strong className="block font-display text-xl text-ink tabular-nums">{weight(summary?.collectedKgConfirmed)}</strong><span className="text-muted">confirmed</span></div><Link to="/impact" className="self-center text-brand" aria-label="See impact details"><ArrowRight size={22} /></Link></div>}</section>
  </div>
}
