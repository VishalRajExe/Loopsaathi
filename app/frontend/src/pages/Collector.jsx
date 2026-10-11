import { useEffect, useRef, useState } from 'react'
import { Check, ChevronRight, PackageCheck, RefreshCw, Truck } from 'lucide-react'
import { api } from '../api/client.js'
import { useToast } from '../App.jsx'
import { Button, Choice, DemoBadge, EmptyState, ErrorState, PageHeading, PickupCard, Sheet, Skeleton, WeightStepper } from '../components/UI.jsx'
import { pickupId, streamName } from '../data/options.js'
import { parseWeight } from '../lib/weights.js'

const filters = [
  { id: 'ALL', label: 'All' }, { id: 'DRY', label: 'Dry' },
  { id: 'WET', label: 'Wet' }, { id: 'E_WASTE', label: 'E-waste' },
]

export default function Collector() {
  const toast = useToast()
  const [filter, setFilter] = useState('ALL')
  const [pickups, setPickups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [workingId, setWorkingId] = useState('')
  const actionLock = useRef(false)
  const [acceptError, setAcceptError] = useState(null)
  const [sheet, setSheet] = useState(null)
  const [actualWeight, setActualWeight] = useState('')
  const [chosenPartner, setChosenPartner] = useState('')
  const [partners, setPartners] = useState([])
  const [partnerLoading, setPartnerLoading] = useState(false)
  const [sheetError, setSheetError] = useState('')
  const [partnerRetry, setPartnerRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    api.pickups({}, controller.signal).then((data) => {
      setPickups(Array.isArray(data) ? data : Array.isArray(data?.pickups) ? data.pickups : [])
      setError('')
    }).catch((err) => { if (err.name !== 'AbortError') setError(err.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [reload])

  useEffect(() => {
    if (sheet?.kind !== 'deliver') return undefined
    const controller = new AbortController()
    setPartnerLoading(true)
    setSheetError('')
    setPartners([])
    api.partners(sheet.pickup.stream, controller.signal).then((data) => {
      setPartners(Array.isArray(data) ? data : Array.isArray(data?.partners) ? data.partners : [])
    }).catch((err) => { if (err.name !== 'AbortError') setSheetError(err.message) })
      .finally(() => { if (!controller.signal.aborted) setPartnerLoading(false) })
    return () => controller.abort()
  }, [sheet?.kind, sheet?.pickup?.stream, partnerRetry])

  function openSheet(kind, pickup) {
    if (actionLock.current) return
    setSheet({ kind, pickup })
    setSheetError('')
    setChosenPartner('')
    setActualWeight('')
  }

  function closeSheet() {
    if (!actionLock.current) setSheet(null)
  }

  async function perform(id, label, call, kind = 'sheet') {
    if (actionLock.current) return
    actionLock.current = true
    setWorkingId(id)
    if (kind === 'accept') setAcceptError(null)
    else setSheetError('')
    try {
      await call()
      setSheet(null)
      setAcceptError(null)
      setReload((value) => value + 1)
      toast(`${id}: ${label}.`)
    } catch (err) {
      if (kind === 'accept') setAcceptError({ id, message: err.message })
      else setSheetError(err.message)
      toast(err.message, 'error')
      if (err.status === 409) setReload((value) => value + 1)
    } finally { actionLock.current = false; setWorkingId('') }
  }

  function collect(event) {
    event.preventDefault()
    const value = parseWeight(actualWeight)
    if (value === null) { setSheetError('Enter the measured kg, greater than 0 and at most 100 with no more than 3 decimals.'); return }
    perform(pickupId(sheet.pickup), 'weight confirmed', () => api.collectPickup(pickupId(sheet.pickup), value))
  }

  function deliver(event) {
    event.preventDefault()
    const partner = partners.find((entry) => String(entry.id ?? entry.destinationId) === chosenPartner)
    if (!partner) { setSheetError('Select a destination for this stream.'); return }
    perform(pickupId(sheet.pickup), 'destination recorded', () => api.deliverPickup(pickupId(sheet.pickup), partner.id ?? partner.destinationId))
  }

  const visible = pickups.filter((pickup) => filter === 'ALL' || pickup.stream === filter)
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
  return <div><PageHeading eyebrow="Collector / Demo role" title="Pickup queue" subtitle="Accept. Weigh. Record the destination." aside={<Button variant="quiet" onClick={() => setReload((value) => value + 1)} disabled={loading}><RefreshCw size={17} /> Refresh</Button>} />
    <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter pickups by stream">{filters.map(({ id, label }) => <Choice key={id} selected={filter === id} onClick={() => setFilter(id)}>{label}</Choice>)}</div>
    {loading ? <div className="grid gap-3 sm:grid-cols-2"><Skeleton lines={4} /><Skeleton lines={4} /></div> : error ? <ErrorState message={error} retry={() => setReload((value) => value + 1)} /> : visible.length === 0 ? <EmptyState title="Nothing in this stream" detail="New requests will appear here when submitted." kind="truck" action={<Button variant="secondary" onClick={() => setFilter('ALL')}>See all pickups</Button>} /> : <div className="grid items-start gap-4 sm:grid-cols-2">{visible.map((pickup) => {
      const id = pickupId(pickup)
      let action
      if (pickup.status === 'REQUESTED') action = <><Button className="min-h-14 w-full" disabled={Boolean(workingId)} busy={workingId === id} onClick={() => perform(id, 'accepted', () => api.acceptPickup(id), 'accept')}><Truck size={19} /> Accept pickup <ChevronRight size={19} /></Button>{acceptError?.id === id && <div role="alert" className="mt-3 rounded-xl bg-special-soft p-3 text-sm text-special"><p>Couldn’t accept: {acceptError.message}</p><Button variant="quiet" className="mt-2 min-h-11" disabled={Boolean(workingId)} onClick={() => perform(id, 'accepted', () => api.acceptPickup(id), 'accept')}>Retry accept</Button></div>}</>
      else if (pickup.status === 'ACCEPTED') action = <Button className="min-h-14 w-full" disabled={Boolean(workingId)} onClick={() => openSheet('collect', pickup)}><PackageCheck size={19} /> Mark collected <ChevronRight size={19} /></Button>
      else if (pickup.status === 'COLLECTED') action = <Button className="min-h-14 w-full" disabled={Boolean(workingId)} onClick={() => openSheet('deliver', pickup)}><Check size={19} /> Record destination <ChevronRight size={19} /></Button>
      else action = <div className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-brand-soft font-bold text-brand-dark"><Check size={19} /> Done · delivered</div>
      return <PickupCard key={id} pickup={pickup} action={action} showTimeline />
    })}</div>}
    {sheet?.kind === 'collect' && <Sheet title="Confirm collected weight" onClose={closeSheet}><p className="mb-5 text-sm text-muted">{sheet.pickup.wasteType} · {pickupId(sheet.pickup)} · {sheet.pickup.estimatedWeightKg} kg estimated</p><form onSubmit={collect} noValidate className="space-y-5"><WeightStepper id="confirmed-weight" label="Actual measured weight" value={actualWeight} onChange={setActualWeight} /><p className="text-sm text-muted">Type the measured weight. Only confirmed kg appears in collected impact.</p>{sheetError && <p role="alert" className="rounded-xl bg-special-soft p-3 text-sm text-special">{sheetError}</p>}<Button type="submit" disabled={Boolean(workingId)} busy={workingId === pickupId(sheet.pickup)} className="min-h-14 w-full">Confirm collected kg</Button></form></Sheet>}
    {sheet?.kind === 'deliver' && <Sheet title="Record destination" onClose={closeSheet}><p className="mb-4 text-sm text-muted">{streamName(sheet.pickup.stream)} · {pickupId(sheet.pickup)} · {sheet.pickup.confirmedWeightKg} kg confirmed</p><form onSubmit={deliver} className="space-y-4"><fieldset><legend className="field-label">Destination accepting this stream</legend>{partnerLoading ? <Skeleton lines={3} /> : sheetError && partners.length === 0 ? <ErrorState compact message={sheetError} retry={() => setPartnerRetry((value) => value + 1)} /> : partners.length === 0 ? <EmptyState title="No compatible destination" detail={`No demo destination accepts ${streamName(sheet.pickup.stream)}. This pickup remains collected; delivery cannot be recorded until a compatible destination exists.`} action={<Button variant="secondary" onClick={() => setPartnerRetry((value) => value + 1)}>Retry destinations</Button>} /> : <div className="space-y-2">{partners.map((partner) => {
      const id = String(partner.id ?? partner.destinationId)
      return <label key={id} className={`flex min-h-20 cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${chosenPartner === id ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-brand'}`}><input type="radio" name="destination" value={id} checked={chosenPartner === id} disabled={Boolean(workingId)} onChange={() => setChosenPartner(id)} className="mt-1 h-5 w-5 accent-brand" /><span className="min-w-0 flex-1"><span className="block font-bold text-ink">{partner.name}</span><span className="mt-1 flex flex-wrap gap-2"><span className="badge bg-sanitary-soft text-sanitary">{partner.verificationStatus || 'UNVERIFIED'}</span>{partner.isDemo && <DemoBadge />}</span></span></label>
    })}</div>}</fieldset>{sheetError && partners.length > 0 && <p role="alert" className="rounded-xl bg-special-soft p-3 text-sm text-special">{sheetError}</p>}<Button type="submit" disabled={!chosenPartner || partnerLoading || Boolean(workingId)} busy={workingId === pickupId(sheet.pickup)} className="min-h-14 w-full">Confirm delivery</Button></form></Sheet>}
  </div>
}
