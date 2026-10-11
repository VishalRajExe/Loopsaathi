import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, Check, ChevronRight, ImagePlus, Search, Sparkles, UploadCloud, X } from 'lucide-react'
import { api } from '../api/client.js'
import { Artwork } from '../components/Artwork.jsx'
import { Button, Choice, ErrorState, PageHeading, Skeleton, StreamBadge } from '../components/UI.jsx'
import { guideExamples, streamName, streams } from '../data/options.js'
import { useToast } from '../App.jsx'
import { createLatestRequest } from '../lib/latestRequest.js'

export default function WasteGuide() {
  const navigate = useNavigate()
  const toast = useToast()
  const fileRef = useRef(null)
  const cameraRef = useRef(null)
  const classification = useRef(createLatestRequest())
  const [text, setText] = useState('')
  const [items, setItems] = useState([])
  const [searchError, setSearchError] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchRetry, setSearchRetry] = useState(0)
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState('')
  const [dragging, setDragging] = useState(false)
  const [result, setResult] = useState(null)
  const [manual, setManual] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => () => classification.current.cancel(), [])

  useEffect(() => {
    if (!photo) return undefined
    const objectUrl = URL.createObjectURL(photo)
    setPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [photo])

  useEffect(() => {
    const controller = new AbortController()
    if (!text.trim()) {
      setItems([])
      setSearchError('')
      setSearchLoading(false)
      return () => controller.abort()
    }
    setSearchLoading(true)
    setSearchError('')
    setItems([])
    const handle = setTimeout(() => {
      api.wasteItems(text.trim(), controller.signal).then((data) => {
        setItems(Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [])
        setSearchError('')
      }).catch((err) => { if (err.name !== 'AbortError') setSearchError(err.message) })
        .finally(() => { if (!controller.signal.aborted) setSearchLoading(false) })
    }, 240)
    return () => { clearTimeout(handle); controller.abort() }
  }, [text, searchRetry])

  function invalidateClassification() {
    classification.current.cancel()
    setLoading(false)
    setResult(null)
    setConfirmed(false)
    setManual(false)
    setError('')
  }

  function changeText(value) {
    invalidateClassification()
    setText(value)
  }

  function chooseSuggestion(value) {
    changeText(value)
    classify('text', value)
  }

  function removePhoto() {
    invalidateClassification()
    setPhoto(null)
    setPreview('')
  }

  // Source: githubrepos/WasteSegregationUsingAI-main/react_app/src/components/UploadImageButton/UploadImageButton.js — file selection, preview and explicit classify action; inference now goes through Spring.
  function setImage(file) {
    if (!file || loading) return
    if (!file.type.startsWith('image/')) { setError('Choose an image file (JPEG, PNG, or another supported image).'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Choose an image smaller than 10 MB.'); return }
    invalidateClassification()
    setPhoto(file)
  }

  function reviewFallback(item, message) {
    invalidateClassification()
    setResult({ item: item || '', stream: '', confidence: null, instruction: '', needsReview: true, source: 'manual' })
    setManual(true)
    setError(message)
  }

  async function classify(kind, itemText = text) {
    const phrase = itemText.trim()
    if (kind === 'text' && !phrase) { setError('Enter an item or pick a suggestion first.'); return }
    if (kind === 'photo' && !photo) { setError('Choose a photo first.'); return }
    const run = classification.current.begin()
    setLoading(true)
    setError('')
    setResult(null)
    setConfirmed(false)
    try {
      const data = kind === 'photo' ? await api.classifyPhoto(photo, run.signal) : await api.classifyText(phrase, run.signal)
      if (!run.isCurrent()) return
      const suggestedItem = kind === 'photo' && (!data?.item || data.item.toLowerCase() === 'unknown item') ? '' : data?.item || (kind === 'text' ? phrase : '')
      setResult({ ...data, item: suggestedItem, source: kind })
      setManual(Boolean(data?.needsReview || !data?.stream))
      if (data?.needsReview) toast('Please review the suggested category before requesting pickup.')
    } catch (err) {
      if (run.isCurrent()) reviewFallback(kind === 'text' ? phrase : text.trim(), kind === 'photo' ? 'Photo recognition is unavailable. Name the item and choose its stream below.' : `${err.message} You can choose the stream manually.`)
    } finally {
      if (run.isCurrent()) { setLoading(false); run.finish() }
    }
  }

  function changeStream(stream) {
    setResult((previous) => ({ ...(previous || {}), item: previous?.item || text.trim(), stream, instruction: '', confidence: null, source: 'manual', needsReview: false }))
    setConfirmed(true)
    setError('')
  }

  function requestPickup() {
    if (!result?.item?.trim()) { setError('Name the item before requesting pickup.'); return }
    if (!result?.stream) { setError('Choose a stream before requesting pickup.'); return }
    const query = new URLSearchParams({ item: result.item.trim(), stream: result.stream })
    navigate(`/request?${query}`)
  }

  // Source: githubrepos/wt23-wastewise-main/WD/next-js-app/src/components/ShowResult.js — display predicted item, recommendation and confidence as a reviewable suggestion.
  const confidence = result?.confidence == null ? null : Number(result.confidence)
  const pct = confidence != null && Number.isFinite(confidence) ? Math.max(0, Math.min(100, Math.round(confidence <= 1 ? confidence * 100 : confidence))) : null
  return <div><PageHeading eyebrow="Step 01 / Identify" title="Waste guide" subtitle="A suggestion first. Your choice is final." />
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"><div className="space-y-5"><section className="panel p-5 sm:p-7"><div className="flex items-center gap-3"><span className="rounded-xl bg-brand-soft p-2.5 text-brand"><Search size={21} /></span><div><h2 className="font-display text-lg font-bold">Describe an item</h2><p className="text-sm text-muted">Search a common waste item.</p></div></div><form onSubmit={(event) => { event.preventDefault(); classify('text') }} className="mt-5"><label htmlFor="waste-search" className="field-label">Item name</label><div className="flex flex-col gap-2 sm:flex-row"><input id="waste-search" className="input min-w-0 flex-1" value={text} onChange={(event) => changeText(event.target.value)} disabled={loading} placeholder="e.g. plastic bottle" /><Button busy={loading} type="submit" className="shrink-0"><Search size={18} /> Find guidance</Button></div></form>
      <p className="mt-5 text-xs font-bold uppercase tracking-wide text-muted">Try one</p><div className="mt-2 flex flex-wrap gap-2">{guideExamples.map((example) => <Choice key={example} selected={text.toLowerCase() === example.toLowerCase()} disabled={loading} onClick={() => chooseSuggestion(example)}>{example}</Choice>)}</div>
      {text.trim() && <div className="mt-4 border-t border-line pt-3"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Suggestions</p>{searchLoading ? <div className="skeleton h-10 w-44 rounded-full" role="status" aria-label="Loading item suggestions" /> : searchError ? <div role="alert" className="rounded-xl bg-special-soft p-3 text-sm text-special"><p>Suggestions are unavailable: {searchError}</p><Button variant="quiet" className="mt-2" onClick={() => setSearchRetry((value) => value + 1)}>Retry suggestions</Button></div> : items.length ? <div className="flex flex-wrap gap-2">{items.slice(0, 6).map((item, index) => { const name = item.itemName || item.name || item.item || ''; return name && <Choice key={`${name}-${index}`} selected={text.toLowerCase() === name.toLowerCase()} disabled={loading} onClick={() => chooseSuggestion(name)}>{name}</Choice> })}</div> : <p className="text-sm text-muted">No matching items. You can still choose a stream manually.</p>}</div>}
    </section>
    <section className="panel p-5 sm:p-7"><div className="flex items-center gap-3"><span className="rounded-xl bg-dry-soft p-2.5 text-dry"><Camera size={21} /></span><div><h2 className="font-display text-lg font-bold">Or use a photo</h2><p className="text-sm text-muted">One item, clearly in frame.</p></div></div>
      <div onDragOver={(event) => { event.preventDefault(); if (!loading) setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); if (!loading) setImage(event.dataTransfer.files[0]) }} className={`relative mt-5 rounded-2xl border-2 border-dashed transition-colors ${dragging ? 'border-brand bg-brand-soft' : 'border-line bg-bg'}`}>
        <button type="button" disabled={loading} onClick={() => fileRef.current?.click()} className="flex min-h-44 w-full flex-col items-center justify-center p-5 text-center disabled:opacity-50" aria-label={preview ? 'Replace selected waste photo' : 'Choose a waste photo or drop it here'}>{preview ? <img src={preview} alt="Your selected waste item" className="mx-auto max-h-56 max-w-full rounded-xl object-contain" /> : <><UploadCloud size={31} className="text-brand" /><span className="mt-2 text-sm font-semibold text-ink">Drop an image here</span><span className="text-sm text-muted">or click to choose</span></>}</button>
        {preview && <button type="button" disabled={loading} onClick={removePhoto} className="icon-button absolute right-2 top-2 bg-white shadow-card" aria-label="Remove photo"><X size={19} /></button>}
      </div><input ref={fileRef} type="file" accept="image/*" className="sr-only" aria-label="Choose a waste photo" disabled={loading} onChange={(event) => { setImage(event.target.files[0]); event.target.value = '' }} /><input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Take a waste photo" disabled={loading} onChange={(event) => { setImage(event.target.files[0]); event.target.value = '' }} />
      <div className="mt-3 flex flex-wrap gap-2"><Button variant="secondary" disabled={loading} onClick={() => fileRef.current?.click()}><ImagePlus size={18} /> Choose photo</Button><Button variant="quiet" disabled={loading} onClick={() => cameraRef.current?.click()}><Camera size={18} /> Use camera</Button></div><p className="mt-3 text-xs text-muted">Photo model is limited to 20 known classes; plastic bottle is not one of them. Type the item or choose a stream when unsure.</p>{photo && <Button busy={loading} onClick={() => classify('photo')} className="mt-4 w-full"><Sparkles size={18} /> Identify photo</Button>}
    </section></div>
    <div className="lg:sticky lg:top-28 lg:self-start">{loading ? <Skeleton lines={5} /> : result ? <section className="panel overflow-hidden"><div className="flex items-center justify-between bg-brand-soft px-6 py-5"><div><span className="text-xs font-bold uppercase tracking-[0.12em] text-brand">Suggested stream</span><h2 className="mt-1 font-display text-2xl font-extrabold">{result.stream ? streamName(result.stream) : 'Choose a stream'}</h2></div><Artwork kind={result.stream === 'E_WASTE' ? 'phone' : 'bin'} className="h-20 w-20" /></div><div className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">{result.stream && <StreamBadge stream={result.stream} />}{result.needsReview && <span className="badge bg-sanitary-soft text-sanitary">Needs review</span>}</div>
        <div><label htmlFor="result-item" className="field-label">Item</label><input id="result-item" className="input" value={result.item || ''} onChange={(event) => { setResult((previous) => ({ ...previous, item: event.target.value, stream: '', instruction: '', confidence: null, reason: '', specialRoute: false, needsReview: false, source: 'manual' })); setConfirmed(false); setManual(true) }} placeholder="Name the item" maxLength={100} /></div>
        {result.stream && result.instruction && result.source !== 'manual' && <p className="rounded-xl bg-bg p-3 text-sm font-medium text-ink">{result.instruction}</p>}
        {result.stream && pct != null && pct > 0 && result.source !== 'manual' && <div><div className="flex justify-between text-xs text-muted"><span>Suggestion confidence</span><span>{pct}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} /></div></div>}
        <p className="text-sm text-muted">{result.source === 'photo' ? 'Suggested by photo AI — please confirm.' : result.source === 'manual' ? 'Choose and confirm the stream; local sorting rules may vary.' : 'Suggested by item rules — please confirm.'}</p>
        {result.needsReview && <p className="rounded-xl bg-sanitary-soft p-3 text-sm text-sanitary">{result.reason || 'The suggestion needs checking.'} Choose the correct stream below.</p>}
        {(result.specialRoute || result.stream === 'SPECIAL_CARE' || result.stream === 'E_WASTE') && <p className="rounded-xl bg-special-soft p-3 text-sm font-semibold text-special">Special route needed. Keep this item separate from ordinary dry and wet waste.</p>}
        {result.stream && !confirmed && <Button variant="secondary" className="w-full" onClick={() => setConfirmed(true)}><Check size={18} /> Looks right</Button>}
        <button type="button" className="flex min-h-11 items-center font-semibold text-brand" onClick={() => setManual((value) => !value)} aria-expanded={manual}>{manual ? 'Hide choices' : 'Change category'} <ChevronRight size={17} className={`ml-1 transition-transform ${manual ? 'rotate-90' : ''}`} /></button>
        {manual && <div><p className="field-label">Choose a stream</p><div className="flex flex-wrap gap-2">{streams.map(({ id, label, icon: Icon }) => <Choice key={id} selected={result.stream === id} onClick={() => changeStream(id)}><Icon size={17} /> {label}</Choice>)}</div></div>}
        {result.stream === 'E_WASTE' && <Link to="/ewaste" className="flex min-h-11 items-center font-semibold text-ewaste">See e-waste route <ChevronRight size={17} /></Link>}
        <Button disabled={!confirmed || !result.item?.trim() || !result.stream} onClick={requestPickup} className="w-full">Request pickup <ChevronRight size={18} /></Button>
      </div></section> : <div className="panel flex min-h-72 flex-col items-center justify-center p-6 text-center"><Artwork kind="bin" className="h-40 w-40" /><h2 className="font-display text-xl font-bold">A clear next step</h2><p className="mt-1 text-sm text-muted">Search an item or upload a photo to begin.</p><Button variant="secondary" className="mt-5" onClick={() => reviewFallback(text.trim(), '')}>Choose stream manually</Button></div>}
      {error && <div className="mt-3"><ErrorState compact message={error} retry={error.includes('API') ? () => { setError(''); setManual(true) } : undefined} /></div>}
    </div></div>
  </div>
}
