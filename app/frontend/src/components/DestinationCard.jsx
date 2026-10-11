import { ArrowRight, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DemoBadge } from './UI.jsx'

// Source: githubrepos/EcoFind-main/src/app/e-facilities/Efacility.tsx (lines 330–370) — facility list cards with a name/trust header, details and booking action; location/map/verification claims omitted.
export default function DestinationCard({ partner, requestTo }) {
  return <article className="rounded-2xl border border-line bg-white p-4 shadow-card">
    <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="rounded-xl bg-ewaste-soft p-3 text-ewaste"><Building2 size={23} /></span><h3 className="font-display font-bold text-ink">{partner.name}</h3></div><span className="badge bg-sanitary-soft text-sanitary">{partner.verificationStatus || 'UNVERIFIED'}</span></div>
    <div className="mt-3 border-t border-line pt-3"><p className="text-sm text-muted">{partner.destinationType === 'E_WASTE' ? 'E-waste collection destination' : 'Recorded destination'}</p><p className="mt-1 text-sm text-muted">Accepts: {(partner.acceptedStreams || []).map((stream) => stream === 'E_WASTE' ? 'E-waste' : stream.toLowerCase()).join(', ') || 'See API record'}</p>{partner.isDemo && <div className="mt-3"><DemoBadge /></div>}</div>
    <Link to={requestTo} className="mt-3 flex min-h-11 items-center gap-2 border-t border-line pt-3 text-sm font-bold text-brand">Request pickup <ArrowRight size={17} /></Link>
  </article>
}
