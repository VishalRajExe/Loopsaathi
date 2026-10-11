import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, Clipboard, ClipboardList, Plus, Truck } from 'lucide-react'
import { api } from '../api/client.js'
import { useToast } from '../App.jsx'
import { Artwork } from '../components/Artwork.jsx'
import { Button, Choice, EmptyState, ErrorState, PageHeading, PickupCard, Sheet, Skeleton, Timeline, WeightStepper } from '../components/UI.jsx'
import { localities, pickupId, slots, streams } from '../data/options.js'
import { parseWeight } from '../lib/weights.js'

export default function RequestPickup() {
  const [params, setParams] = useSearchParams()
  const toast = useToast()
  const view = params.get('view') === 'mine' ? 'mine' : 'new'
  const initialStream = streams.some(({ id }) => id === params.get('stream')) ? params.get('stream') : 'DRY'
  const [wasteType, setWasteType] = useState(() => params.get('item') || '')
  const [stream, setStream] = useState(initialStream)
  const [estimatedWeightKg, setEstimatedWeightKg] = useState('')
  const [locality, setLocality] = useState('')
  const [preferredSlot, setPreferredSlot] = useState('MORNING')
  const [fieldError, setFieldError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(null)
  const [requests, setRequests] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setListLoading(true)
    api.pickups({}, controller.signal).then((data) => {
      setRequests(Array.isArray(data) ? data : Array.isArray(data?.pickups) ? data.pickups : [])
      setListError('')
    }).catch((error) => { if (error.name !== 'AbortError') setListError(error.message) })
      .finally(() => { if (!controller.signal.aborted) setListLoading(false) })
    return () => controller.abort()
  }, [reload])

  function switchView(next) {
    const nextParams = new URLSearchParams(params)
    if (next === 'mine') nextParams.set('view', 'mine')
    else nextParams.delete('view')
    setParams(nextParams)
  }

  // Source: githubrepos/TrashTag-main/src/components/PostForm.jsx — form state, validation, and success flow adapted for a REST pickup without photos, maps, or prices.
  async function submit(event) {
    event.preventDefault()
    const amount = parseWeight(estimatedWeightKg)
    if (!wasteType.trim()) { setFieldError('Name the waste item.'); document.getElementById('pickup-item')?.focus(); return }
    if (!stream) { setFieldError('Choose a stream.'); return }
    if (amount === null) { setFieldError('Enter estimated kg greater than 0 and at most 100, with no more than 3 decimals.'); document.getElementById('estimated-weight')?.focus(); return }
    if (!locality) { setFieldError('Choose a locality.'); document.getElementById('pickup-locality')?.focus(); return }
    setSaving(true)
    setFieldError('')
    try {
      const created = await api.createPickup({ wasteType: wasteType.trim(), stream, estimatedWeightKg: amount, locality, preferredSlot })
      setSuccess(created)
      setReload((value) => value + 1)
      toast('Pickup requested. The estimate will be confirmed at collection.')
    } catch (error) {
      setFieldError(error.message)
      toast('Could not create pickup. Check the form and retry.', 'error')
    } finally { setSaving(false) }
  }

  async function copyId() {
    try { await navigator.clipboard.writeText(pickupId(success)); toast('Pickup ID copied.') }
    catch { toast('Copy failed. Select the ID to copy it.', 'error') }
  }

  return <div><PageHeading eyebrow="Step 02 / Request" title="Request pickup" subtitle="Share a few details. No account needed." />
    <div className="mb-6 grid grid-cols-2 rounded-xl border border-line bg-white p-1 sm:max-w-sm" role="group" aria-label="Request view"><button type="button" onClick={() => switchView('new')} aria-pressed={view === 'new'} className={`min-h-11 rounded-lg text-sm font-semibold ${view === 'new' ? 'bg-brand text-white' : 'text-muted hover:bg-bg'}`}><Plus size={17} className="mr-1 inline" /> New request</button><button type="button" onClick={() => switchView('mine')} aria-pressed={view === 'mine'} className={`min-h-11 rounded-lg text-sm font-semibold ${view === 'mine' ? 'bg-brand text-white' : 'text-muted hover:bg-bg'}`}><ClipboardList size={17} className="mr-1 inline" /> My requests</button></div>
    {view === 'new' ? <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><form onSubmit={submit} noValidate className="panel space-y-6 p-5 sm:p-7"><div><label htmlFor="pickup-item" className="field-label">Waste item</label><input id="pickup-item" type="text" value={wasteType} maxLength={100} onChange={(event) => setWasteType(event.target.value)} placeholder="e.g. plastic bottle" className="input" required /><p className="mt-1 text-xs text-muted">Name one kind of item for this pickup.</p></div>
      <fieldset><legend className="field-label">Waste stream</legend><div className="flex flex-wrap gap-2">{streams.map(({ id, label, icon: Icon }) => <Choice key={id} selected={stream === id} onClick={() => setStream(id)}><Icon size={17} />{label}</Choice>)}</div>{stream === 'E_WASTE' && <p className="mt-2 text-sm text-ewaste">A dedicated e-waste destination will be required.</p>}{(stream === 'SANITARY' || stream === 'SPECIAL_CARE') && <p className="mt-2 rounded-xl bg-sanitary-soft p-3 text-sm text-sanitary">No demo destination currently accepts this stream. Pickup and collection can be recorded, but delivery cannot yet be marked complete.</p>}</fieldset>
      <WeightStepper id="estimated-weight" value={estimatedWeightKg} onChange={setEstimatedWeightKg} />
      <div className="grid gap-6 sm:grid-cols-2"><div><label htmlFor="pickup-locality" className="field-label">Locality</label><select id="pickup-locality" value={locality} onChange={(event) => setLocality(event.target.value)} className="input" required><option value="">Choose locality</option>{localities.map((place) => <option key={place} value={place}>{place}</option>)}</select><p className="mt-1 text-xs text-muted">Demo campus localities only.</p></div><fieldset><legend className="field-label">Preferred slot</legend><div className="flex flex-wrap gap-2">{slots.map(({ id, label }) => <Choice key={id} selected={preferredSlot === id} onClick={() => setPreferredSlot(id)} className="sm:px-3">{label}</Choice>)}</div></fieldset></div>
      {fieldError && <p className="rounded-xl bg-special-soft p-3 text-sm font-semibold text-special" role="alert">{fieldError}</p>}
      <Button type="submit" busy={saving} className="w-full sm:w-auto"><Truck size={19} /> {saving ? 'Creating pickup…' : 'Request pickup'}</Button>
    </form><aside className="panel flex flex-col items-center self-start p-6 text-center"><Artwork kind="truck" className="h-48 w-48" /><h2 className="font-display text-lg font-bold">What happens next?</h2><p className="mt-2 max-w-xs text-sm text-muted">A demo collector accepts, confirms actual kg, then records a destination.</p><ol className="mt-5 grid w-full grid-cols-4 gap-1 text-center text-[11px] font-semibold text-muted"><li>Request</li><li>Accept</li><li>Collect</li><li>Deliver</li></ol></aside></div> : <section><div className="mb-4"><h2 className="font-display text-xl font-bold">My requests</h2><p className="text-sm text-muted">All local requests are shown; this demo has no accounts.</p></div>{listLoading ? <div className="grid gap-3 sm:grid-cols-2"><Skeleton /><Skeleton /></div> : listError ? <ErrorState message={listError} retry={() => setReload((value) => value + 1)} /> : requests.length === 0 ? <EmptyState title="No requests yet" detail="Create one to start the pickup journey." action={<Button onClick={() => switchView('new')}>New request</Button>} /> : <div className="grid gap-3 sm:grid-cols-2">{requests.map((pickup) => <PickupCard key={pickupId(pickup)} pickup={pickup} showTimeline />)}</div>}</section>}
    {success && <Sheet title="Pickup requested" onClose={() => setSuccess(null)}><div className="text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand"><CheckCircle2 size={36} /></span><p className="mt-4 text-sm text-muted">Save this pickup ID</p><p className="mt-1 break-all font-display text-2xl font-extrabold tracking-tight text-ink" tabIndex={0}>{pickupId(success)}</p><Button variant="secondary" className="mt-3" onClick={copyId}><Clipboard size={17} /> Copy ID</Button><p className="mt-5 text-sm text-muted">Estimated weight: {success.estimatedWeightKg ?? estimatedWeightKg} kg. Actual kg is recorded when collected.</p></div><div className="mt-6 border-t border-line pt-5"><Timeline status={success.status} log={success.statusLog || []} /></div><Button className="mt-6 w-full" onClick={() => { setSuccess(null); switchView('mine') }}>See requests</Button></Sheet>}
  </div>
}
