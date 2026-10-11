import { useEffect, useRef } from 'react'
import { AlertCircle, Check, Minus, Plus, RefreshCw, X } from 'lucide-react'
import { Artwork } from './Artwork.jsx'
import { dateTime, pickupId, stages, streamName, slotName, weight } from '../data/options.js'
import { parseWeight, stepWeight } from '../lib/weights.js'

const streamClasses = {
  WET: 'bg-wet-soft text-wet', DRY: 'bg-dry-soft text-dry',
  SANITARY: 'bg-sanitary-soft text-sanitary', SPECIAL_CARE: 'bg-special-soft text-special',
  E_WASTE: 'bg-ewaste-soft text-ewaste',
}
const statusClasses = {
  REQUESTED: 'bg-status-soft text-status', ACCEPTED: 'bg-dry-soft text-dry',
  COLLECTED: 'bg-sanitary-soft text-sanitary', DELIVERED: 'bg-wet-soft text-wet',
}

export function StreamBadge({ stream }) {
  return <span className={`badge ${streamClasses[stream] || 'bg-status-soft text-status'}`}>{streamName(stream)}</span>
}

export function StatusBadge({ status }) {
  return <span className={`badge ${statusClasses[status] || 'bg-status-soft text-status'}`}>{(status || 'REQUESTED').toLowerCase()}</span>
}

export function DemoBadge() {
  return <span className="inline-flex items-center rounded-full border border-dashed border-demo-line bg-demo-soft px-2.5 py-1 text-xs font-bold text-demo">Demo data</span>
}

export function Button({ children, variant = 'primary', className = '', busy = false, type = 'button', disabled, ...props }) {
  const variants = {
    primary: 'bg-brand text-white hover:bg-brand-dark',
    secondary: 'border border-brand bg-white text-brand hover:bg-brand-soft',
    quiet: 'border border-line bg-surface text-ink hover:bg-bg',
  }
  return <button type={type} disabled={disabled || busy} className={`btn ${variants[variant]} ${className}`} {...props}>
    {busy && <span className="spinner" aria-hidden="true" />}{children}
  </button>
}

// Source: githubrepos/TrashTag-main/src/components/ui/Chip.jsx — selected vs idle chip behavior, adapted for larger tap targets.
export function Choice({ selected, children, className = '', ...props }) {
  return <button type="button" aria-pressed={selected} className={`choice disabled:cursor-not-allowed disabled:opacity-50 ${selected ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line bg-white text-ink hover:border-brand'} ${className}`} {...props}>{children}</button>
}

export function PageHeading({ eyebrow, title, subtitle, aside }) {
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="font-display text-[28px] font-bold tracking-[-0.04em] leading-tight text-ink sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
    </div>
    {aside}
  </div>
}

export function ErrorState({ message, retry, compact = false }) {
  return <div role="alert" className={`${compact ? 'p-4' : 'p-6'} rounded-2xl border border-special/20 bg-special-soft text-special`}>
    <div className="flex items-start gap-3"><AlertCircle size={20} className="mt-0.5 shrink-0" /><div className="min-w-0 flex-1"><p className="font-semibold">Couldn’t load this right now.</p><p className="mt-1 text-sm">{message}</p>{retry && <Button variant="quiet" className="mt-3" onClick={retry}><RefreshCw size={17} /> Retry</Button>}</div></div>
  </div>
}

// Source: githubrepos/TrashTag-main/src/components/ui/EmptyState.jsx — icon/short-copy/action structure adapted to custom SVG art.
export function EmptyState({ title, detail, action, kind = 'bin' }) {
  return <div className="panel flex flex-col items-center px-5 py-8 text-center"><Artwork kind={kind} className="h-28 w-28" /><h2 className="font-display text-lg font-bold">{title}</h2><p className="mt-1 max-w-sm text-sm text-muted">{detail}</p>{action && <div className="mt-5">{action}</div>}</div>
}

export function Skeleton({ lines = 3, className = '' }) {
  return <div className={`panel space-y-4 p-6 ${className}`} aria-label="Loading content" role="status">{Array.from({ length: lines }, (_, index) => <div key={index} className={`skeleton h-5 rounded-lg ${index === lines - 1 ? 'w-1/2' : 'w-full'}`} />)}<span className="sr-only">Loading…</span></div>
}

// Source: githubrepos/TrashTag-main/src/components/ui/Sheet.jsx — scrim, Escape and bottom-aligned dialog; focus restoration added.
export function Sheet({ title, children, onClose }) {
  const closeRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  useEffect(() => {
    const previous = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') onCloseRef.current()
      if (event.key !== 'Tab') return
      const controls = Array.from(closeRef.current?.closest('[role="dialog"]')?.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]') || [])
      if (!controls.length) return
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus() }
      else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [])
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-lg overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-raised sm:max-h-[85dvh] sm:rounded-3xl sm:p-7 max-h-[90dvh]">
      <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-line sm:hidden" aria-hidden="true" />
      <div className="mb-5 flex items-center justify-between gap-3"><h2 className="font-display text-xl font-bold">{title}</h2><button type="button" ref={closeRef} onClick={onClose} aria-label="Close sheet" className="icon-button"><X size={20} /></button></div>
      {children}
    </section>
  </div>
}

export function WeightStepper({ value, onChange, label = 'Estimated weight', id = 'weight' }) {
  const amount = parseWeight(value)
  return <div><label htmlFor={id} className="field-label">{label} <span className="text-muted font-normal">(kg)</span></label>
    <div className="flex h-14 items-center overflow-hidden rounded-xl border border-line bg-white focus-within:ring-2 focus-within:ring-brand">
      <button type="button" aria-label={`Decrease ${label.toLowerCase()} by 0.5 kg`} disabled={amount === null || amount <= 0.001} onClick={() => onChange(stepWeight(value, -1))} className="flex h-full w-14 shrink-0 items-center justify-center border-r border-line text-ink hover:bg-bg disabled:opacity-40"><Minus size={19} /></button>
      <input id={id} type="number" inputMode="decimal" step="any" min="0.001" max="100" required value={value} onChange={(event) => onChange(event.target.value)} placeholder="Enter kg" aria-describedby={`${id}-hint`} className="h-full min-w-0 flex-1 bg-transparent px-2 text-center font-display text-xl font-bold tabular-nums outline-none" />
      <button type="button" aria-label={`Increase ${label.toLowerCase()} by 0.5 kg`} disabled={(amount === null && value !== '') || (amount !== null && amount >= 100)} onClick={() => onChange(stepWeight(value, 1))} className="flex h-full w-14 shrink-0 items-center justify-center border-l border-line text-ink hover:bg-bg disabled:opacity-40"><Plus size={19} /></button>
    </div>
    <p id={`${id}-hint`} className="mt-1 text-xs text-muted">More than 0, up to 100 kg; at most 3 decimal places. Stepper changes 0.5 kg.</p>
  </div>
}

export function Timeline({ status = 'REQUESTED', log = [] }) {
  const current = Math.max(0, stages.indexOf(status))
  return <ol className="grid grid-cols-4 gap-1" aria-label="Pickup status timeline">{stages.map((stage, index) => {
    const entry = log.find((item) => item.status === stage)
    return <li key={stage} className="min-w-0 text-center"><div className="mb-2 flex items-center"><span className={`mx-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${index <= current ? 'border-brand bg-brand text-white' : 'border-line bg-white text-muted'}`}>{index < current ? <Check size={14} strokeWidth={3} /> : <span className="text-[10px] font-bold">{index + 1}</span>}</span></div><span className={`block text-[10px] font-semibold sm:text-xs ${index <= current ? 'text-ink' : 'text-muted'}`}>{stage.charAt(0) + stage.slice(1).toLowerCase()}</span>{entry?.at && <time className="mt-0.5 block text-[10px] text-muted" dateTime={entry.at} title={dateTime(entry.at)}>{new Date(entry.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</time>}</li>
  })}</ol>
}

// Source: githubrepos/TrashTag-main/src/components/TrashCard.jsx — status badge, job metadata and a role-dependent action slot, with map/payment/chat removed.
export function PickupCard({ pickup, action, showTimeline = false }) {
  const id = pickupId(pickup)
  return <article className="panel p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="text-xs font-medium tracking-wide text-muted">{id}</p><h3 className="mt-1 font-display text-lg font-bold capitalize text-ink">{pickup.wasteType || 'Waste pickup'}</h3></div><StreamBadge stream={pickup.stream} /></div>
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted"><span>{pickup.locality || 'Locality not set'}</span><span aria-hidden="true">·</span><span>{slotName(pickup.preferredSlot)}</span><span aria-hidden="true">·</span><span>{weight(pickup.estimatedWeightKg)} estimated</span></div>
    {pickup.confirmedWeightKg != null && <p className="mt-2 text-sm font-semibold text-ink">{weight(pickup.confirmedWeightKg)} confirmed</p>}
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><StatusBadge status={pickup.status} />{pickup.isDemo && <DemoBadge />}</div>
    {showTimeline && <div className="mt-5 border-t border-line pt-4"><Timeline status={pickup.status} log={pickup.statusLog || []} /></div>}
    {action && <div className="mt-4">{action}</div>}
  </article>
}
