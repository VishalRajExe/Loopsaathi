import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ClipboardList, PackageCheck, RefreshCw } from 'lucide-react'
import { api } from '../api/client.js'
import { Button, DemoBadge, EmptyState, ErrorState, PageHeading, Skeleton, StatusBadge } from '../components/UI.jsx'
import { dateTime, pickupId, weight } from '../data/options.js'

const destinations = [
  { key: 'COMPOSTING', label: 'Composting', bar: 'bg-wet', tint: 'bg-wet-soft' },
  { key: 'BIOGAS', label: 'Biogas', bar: 'bg-sanitary', tint: 'bg-sanitary-soft' },
  { key: 'RECYCLER', label: 'Dry recycler', bar: 'bg-dry', tint: 'bg-dry-soft' },
  { key: 'E_WASTE', label: 'E-waste point', bar: 'bg-ewaste', tint: 'bg-ewaste-soft' },
]

function useCountUp(value) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setDisplay(value); return undefined }
    const start = performance.now()
    let handle
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / 480)
      setDisplay(value * (1 - (1 - progress) ** 3))
      if (progress < 1) handle = requestAnimationFrame(tick)
    }
    handle = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(handle)
  }, [value])
  return display
}

function Metric({ number, unit = '', label, detail, icon: Icon, tone }) {
  const animated = useCountUp(Number(number) || 0)
  return <div className="panel p-5 sm:p-6"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wide text-muted">{label}</span><span className={`rounded-xl p-2.5 ${tone}`}><Icon size={20} /></span></div><strong className="mt-4 block font-display text-3xl font-extrabold tabular-nums tracking-tight text-ink sm:text-4xl">{animated.toLocaleString('en-IN', { maximumFractionDigits: unit ? 1 : 0 })}<span className="ml-1 text-base font-semibold text-muted">{unit}</span></strong><p className="mt-1 text-sm text-muted">{detail}</p></div>
}

export default function Impact() {
  const [summary, setSummary] = useState(null)
  const [pickups, setPickups] = useState([])
  const [error, setError] = useState('')
  const [recentError, setRecentError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    Promise.allSettled([api.impact(controller.signal), api.pickups({}, controller.signal)]).then(([impact, recent]) => {
      if (controller.signal.aborted) return
      if (impact.status === 'fulfilled') { setSummary(impact.value); setError('') }
      else setError(impact.reason.message)
      if (recent.status === 'fulfilled') { setPickups(Array.isArray(recent.value) ? recent.value : Array.isArray(recent.value?.pickups) ? recent.value.pickups : []); setRecentError('') }
      else setRecentError(recent.reason.message)
      setLoading(false)
    })
    return () => controller.abort()
  }, [reload])
  const byStatus = summary?.byStatus || {}
  const delivered = summary?.deliveredKgByType || {}
  const collectedCount = (byStatus.COLLECTED || 0) + (byStatus.DELIVERED || 0)
  const deliveredKg = destinations.reduce((sum, { key }) => sum + Number(delivered[key] || 0), 0)
  const max = Math.max(...destinations.map(({ key }) => Number(delivered[key] || 0)), 1)
  const completion = Math.max(0, Math.min(1, Number(summary?.completionRate || 0)))
  const recent = [...pickups].sort((left, right) => new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0)).slice(0, 5)
  return <div><PageHeading eyebrow="Recorded outcomes" title="Impact dashboard" subtitle="Estimates and confirmed weights stay separate." aside={<Button variant="quiet" onClick={() => setReload((value) => value + 1)} disabled={loading}><RefreshCw size={17} /> Refresh</Button>} />
    {loading && !summary ? <div className="grid gap-4 sm:grid-cols-3"><Skeleton lines={4} /><Skeleton lines={4} /><Skeleton lines={4} /></div> : error ? <ErrorState message={error} retry={() => setReload((value) => value + 1)} /> : <>
      {summary?.containsDemoData && <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-demo-line bg-demo-soft p-3 text-sm text-demo"><DemoBadge /><span>Figures include seeded demo records, not real-world collection claims.</span></div>}
      <section aria-label="Pickup progress" className="grid gap-3 sm:grid-cols-3"><Metric label="Requested" number={summary?.totalRequests || 0} detail={`${weight(summary?.requestedKgEstimated)} estimated across all requests`} icon={ClipboardList} tone="bg-status-soft text-status" /><Metric label="Collected" number={collectedCount} detail={`${weight(summary?.collectedKgConfirmed)} confirmed (includes delivered)`} icon={PackageCheck} tone="bg-sanitary-soft text-sanitary" /><Metric label="Delivered" number={byStatus.DELIVERED || 0} detail={`${weight(deliveredKg)} confirmed at destinations`} icon={CheckCircle2} tone="bg-brand-soft text-brand" /></section>
      <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"><section className="panel flex flex-col items-center p-6 text-center"><h2 className="w-full text-left font-display text-lg font-bold">Journey completed</h2><div className="relative mt-5 h-44 w-44"><svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" role="img" aria-label={`${Math.round(completion * 100)} percent of requests delivered`}><circle cx="60" cy="60" r="48" fill="none" stroke="#E5E7E0" strokeWidth="10" /><circle cx="60" cy="60" r="48" fill="none" stroke="#1F6B4A" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 48 * completion} ${2 * Math.PI * 48}`} /></svg><span className="absolute inset-0 flex flex-col items-center justify-center"><strong className="font-display text-4xl font-extrabold tabular-nums">{Math.round(completion * 100)}%</strong><span className="text-sm text-muted">delivered</span></span></div><p className="mt-4 text-sm text-muted">{byStatus.DELIVERED || 0} of {summary?.totalRequests || 0} requests delivered</p><div className="mt-5 w-full border-t border-line pt-4 text-left text-sm"><span className="font-bold text-ink">{summary?.eWastePickups || 0}</span><span className="ml-2 text-muted">E-waste requests</span></div></section>
        <section className="panel p-6"><h2 className="font-display text-lg font-bold">Delivered by destination</h2><p className="mt-1 text-sm text-muted">Confirmed kg, grouped by destination type.</p><div className="mt-6 space-y-5">{destinations.map(({ key, label, bar, tint }) => <div key={key}><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="font-semibold text-ink">{label}</span><span className="font-display font-bold tabular-nums">{weight(delivered[key])}</span></div><div className={`h-3 overflow-hidden rounded-full ${tint}`} role="img" aria-label={`${label}: ${weight(delivered[key])}`}><div className={`h-full rounded-full transition-[width] duration-300 ${bar}`} style={{ width: `${Math.max(0, Number(delivered[key] || 0)) / max * 100}%` }} /></div></div>)}</div>{deliveredKg === 0 && <p className="mt-4 text-sm text-muted">No delivered weight recorded yet.</p>}</section></div>
      <section className="mt-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-xl font-bold">Recent activity</h2><Link to="/request?view=mine" className="flex min-h-11 items-center gap-1 text-sm font-bold text-brand">See requests <ArrowRight size={17} /></Link></div>{recentError ? <ErrorState compact message={recentError} retry={() => setReload((value) => value + 1)} /> : recent.length ? <div className="panel divide-y divide-line overflow-hidden">{recent.map((pickup) => <div key={pickupId(pickup)} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6"><div><p className="font-semibold capitalize">{pickup.wasteType || 'Waste pickup'}</p><p className="text-xs text-muted">{pickupId(pickup)} · {dateTime(pickup.updatedAt || pickup.createdAt)}</p></div><div className="flex items-center gap-2"><StatusBadge status={pickup.status} />{pickup.isDemo && <DemoBadge />}</div></div>)}</div> : <EmptyState title="No activity yet" detail="A new pickup will appear here once requested." action={<Link to="/request" className="btn bg-brand text-white">Request pickup</Link>} />}</section>
    </>}
  </div>
}
