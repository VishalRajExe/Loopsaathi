import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BatteryWarning, Cpu } from 'lucide-react'
import { api } from '../api/client.js'
import { Artwork } from '../components/Artwork.jsx'
import DestinationCard from '../components/DestinationCard.jsx'
import { Button, Choice, DemoBadge, EmptyState, ErrorState, PageHeading, Skeleton } from '../components/UI.jsx'
import { eWasteItems } from '../data/options.js'

export default function EWaste() {
  const [item, setItem] = useState(eWasteItems[0])
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const battery = item === 'Battery'
  useEffect(() => {
    const controller = new AbortController()
    if (battery) {
      setPartners([])
      setError('')
      setLoading(false)
      return () => controller.abort()
    }
    setLoading(true)
    api.partners('E_WASTE', controller.signal).then((data) => {
      setPartners(Array.isArray(data) ? data : Array.isArray(data?.partners) ? data.partners : [])
      setError('')
    }).catch((err) => { if (err.name !== 'AbortError') setError(err.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [retry, battery])
  const query = new URLSearchParams({ item, stream: battery ? 'SPECIAL_CARE' : 'E_WASTE' })
  const requestTo = `/request?${query}`
  return <div><PageHeading eyebrow="Dedicated route" title="E-waste" subtitle="Electronics need a separate collection route." />
    <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]"><div className="space-y-5"><section className="panel flex items-center gap-3 overflow-hidden bg-gradient-to-br from-ewaste-soft to-white p-6 sm:p-8"><div className="min-w-0 flex-1"><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ewaste"><Cpu size={17} /> Keep it separate</span><h2 className="mt-2 font-display text-2xl font-extrabold text-ink">Small device, clear route.</h2><p className="mt-2 text-sm text-muted">Keep batteries and electronics out of ordinary dry waste.</p></div><Artwork kind="phone" className="h-32 w-32 shrink-0 sm:h-40 sm:w-40" /></section>
      <section className="panel p-5 sm:p-7"><h2 className="font-display text-lg font-bold">What are you handing over?</h2><div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Choose e-waste item">{eWasteItems.map((name) => <Choice key={name} selected={name === item} onClick={() => setItem(name)}>{name}</Choice>)}</div>{battery && <p className="mt-4 flex gap-2 rounded-xl bg-special-soft p-3 text-sm font-medium text-special"><BatteryWarning size={20} className="shrink-0" /> Batteries require special-care handling. The e-waste demo point does not accept this stream.</p>}<Link to={requestTo} className="btn mt-6 w-full bg-brand text-white hover:bg-brand-dark">Request {battery ? 'special-care' : 'e-waste'} pickup <ArrowRight size={19} /></Link><p className="mt-3 text-center text-xs text-muted">You’ll review the estimate, locality and time before creating it.</p></section></div>
      <section className="panel self-start p-5 sm:p-7"><h2 className="font-display text-lg font-bold">{battery ? 'Special-care destination' : 'Demo drop point'}</h2><p className="mt-1 text-sm text-muted">Only destinations accepting this stream may record a delivery.</p>{battery ? <div className="mt-4"><EmptyState title="No demo destination" detail="No recorded destination accepts special-care batteries. You can request collection, but delivery cannot be recorded in this demo." kind="bin" action={<Link to={requestTo} className="btn border border-brand bg-white text-brand">Request special-care pickup</Link>} /></div> : loading ? <Skeleton className="mt-4" lines={3} /> : error ? <div className="mt-4"><ErrorState compact message={error} retry={() => setRetry((value) => value + 1)} /></div> : partners.length ? <div className="mt-4 space-y-3">{partners.map((partner) => <DestinationCard key={partner.id ?? partner.destinationId} partner={partner} requestTo={requestTo} />)}</div> : <div className="mt-4"><EmptyState title="No drop point listed" detail="There is no demo destination accepting e-waste right now." kind="phone" action={<Button variant="secondary" onClick={() => setRetry((value) => value + 1)}>Retry destinations</Button>} /></div>}</section></div>
  </div>
}
