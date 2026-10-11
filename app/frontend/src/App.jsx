import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { BarChart3, ClipboardList, Home as HomeIcon, Menu, ScanLine, Truck, Cpu, X } from 'lucide-react'
import Home from './pages/Home.jsx'
import WasteGuide from './pages/WasteGuide.jsx'
import RequestPickup from './pages/RequestPickup.jsx'
import Collector from './pages/Collector.jsx'
import EWaste from './pages/EWaste.jsx'
import Impact from './pages/Impact.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

const ToastContext = createContext(() => {})
export const useToast = () => useContext(ToastContext)

const nav = [
  { path: '/', label: 'Home', icon: HomeIcon, end: true },
  { path: '/guide', label: 'Guide', icon: ScanLine },
  { path: '/request', label: 'Request', icon: ClipboardList },
  { path: '/collector', label: 'Collector', icon: Truck },
  { path: '/ewaste', label: 'E-waste', icon: Cpu, desktopOnly: true },
  { path: '/impact', label: 'Impact', icon: BarChart3 },
]

function Logo() {
  return <NavLink to="/" className="flex min-h-11 items-center gap-2 font-display text-lg font-extrabold tracking-tight text-ink sm:text-xl" aria-label="LoopSaathi home">
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect width="32" height="32" rx="10" fill="#1F6B4A" /><path d="M10 15a7 7 0 0 1 11.5-5.4M21.5 9.6H18m3.5 0V13M22 17a7 7 0 0 1-11.5 5.4M10.5 22.4H14m-3.5 0V19" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
    <span>Loop<span className="text-brand">Saathi</span></span>
  </NavLink>
}

function RoleSwitcher({ role, changeRole }) {
  return <div className="relative grid h-[52px] w-[174px] shrink-0 grid-cols-2 rounded-full border border-line bg-bg p-1 sm:w-[206px]" role="group" aria-label="Choose a demo role">
    <span className={`absolute bottom-1 top-1 left-1 w-[calc(50%-4px)] rounded-full bg-brand shadow-sm transition-transform duration-200 ${role === 'collector' ? 'translate-x-full' : ''}`} aria-hidden="true" />
    {['household', 'collector'].map((value) => <button type="button" key={value} aria-pressed={role === value} onClick={() => changeRole(value)} className={`relative z-10 min-h-11 rounded-full px-1 text-xs font-bold transition-colors sm:text-sm ${role === value ? 'text-white' : 'text-muted hover:text-ink'}`}>{value === 'household' ? 'Household' : 'Collector'}</button>)}
  </div>
}

function Shell() {
  const location = useLocation()
  const navigate = useNavigate()
  const mainRef = useRef(null)
  const [role, setRole] = useState(() => location.pathname === '/collector' ? 'collector' : localStorage.getItem('loopsaathi-role') === 'collector' ? 'collector' : 'household')
  const [mobileMenu, setMobileMenu] = useState(false)
  useEffect(() => {
    if (location.pathname === '/collector') {
      setRole('collector')
      localStorage.setItem('loopsaathi-role', 'collector')
    }
    setMobileMenu(false)
    window.scrollTo(0, 0)
    mainRef.current?.focus({ preventScroll: true })
  }, [location.pathname])
  function changeRole(value) {
    setRole(value)
    localStorage.setItem('loopsaathi-role', value)
    navigate(value === 'collector' ? '/collector' : '/')
  }
  return <div className="min-h-dvh bg-bg text-ink">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur-md"><div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6"><Logo />
      <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">{nav.map(({ path, label, end }) => <NavLink key={path} to={path} end={end} className={({ isActive }) => `inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-brand-soft text-brand-dark' : 'text-muted hover:bg-white hover:text-ink'}`}>{label}</NavLink>)}</nav>
      <div className="flex items-center gap-1"><RoleSwitcher role={role} changeRole={changeRole} /><button type="button" className="icon-button hidden sm:flex lg:hidden" onClick={() => setMobileMenu(!mobileMenu)} aria-label={mobileMenu ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileMenu}>{mobileMenu ? <X size={21} /> : <Menu size={21} />}</button></div>
    </div>{mobileMenu && <nav className="hidden border-t border-line bg-white px-4 pb-3 pt-2 sm:grid lg:hidden sm:grid-cols-3" aria-label="More navigation">{nav.map(({ path, label, icon: Icon }) => <NavLink key={path} to={path} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-ink hover:bg-brand-soft"><Icon size={18} />{label}</NavLink>)}</nav>}</header>
    <main id="main-content" ref={mainRef} tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 pb-32 pt-7 outline-none sm:px-6 sm:pb-14 sm:pt-10"><Routes>
      <Route path="/" element={<Home />} /><Route path="/guide" element={<WasteGuide />} /><Route path="/request" element={<RequestPickup />} /><Route path="/collector" element={<Collector />} /><Route path="/ewaste" element={<EWaste />} /><Route path="/impact" element={<Impact />} /><Route path="*" element={<div className="panel p-8 text-center"><h1 className="font-display text-2xl font-bold">Page not found</h1><NavLink to="/" className="mt-3 inline-block font-semibold text-brand">Go home</NavLink></div>} />
    </Routes></main>
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden" aria-label="Mobile navigation"><div className="grid grid-cols-5">{nav.filter((item) => !item.desktopOnly).map(({ path, label, icon: Icon, end }) => <NavLink key={path} to={path} end={end} className={({ isActive }) => `flex min-h-[64px] flex-col items-center justify-center gap-1 px-0.5 text-[11px] font-semibold ${isActive ? 'text-brand' : 'text-muted'}`}><Icon size={21} strokeWidth={2} /><span>{label}</span></NavLink>)}</div></nav>
  </div>
}

export default function App() {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)
  const showToast = useCallback((message, kind = 'success') => {
    window.clearTimeout(timer.current)
    setToast({ message, kind })
    timer.current = window.setTimeout(() => setToast(null), 4200)
  }, [])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return <ToastContext.Provider value={showToast}><ErrorBoundary><Shell /></ErrorBoundary>{toast && <div className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-[60] mx-auto flex max-w-md items-center justify-between gap-4 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-raised sm:bottom-6 ${toast.kind === 'error' ? 'bg-danger' : 'bg-brand'}`} role="status" aria-live="polite"><span>{toast.message}</span><button type="button" className="min-h-11 min-w-11 shrink-0 rounded-xl hover:bg-white/10" aria-label="Dismiss message" onClick={() => setToast(null)}><X size={18} className="mx-auto" /></button></div>}</ToastContext.Provider>
}
