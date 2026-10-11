import { Droplets, Layers2, ShieldPlus, BatteryWarning, Cpu } from 'lucide-react'

export const streams = [
  { id: 'WET', label: 'Wet', icon: Droplets },
  { id: 'DRY', label: 'Dry', icon: Layers2 },
  { id: 'SANITARY', label: 'Sanitary', icon: ShieldPlus },
  { id: 'SPECIAL_CARE', label: 'Special-care', icon: BatteryWarning },
  { id: 'E_WASTE', label: 'E-waste', icon: Cpu },
]

export const slots = [
  { id: 'MORNING', label: 'Morning' },
  { id: 'AFTERNOON', label: 'Afternoon' },
  { id: 'EVENING', label: 'Evening' },
]

export const localities = ['Hostel A', 'Hostel B', 'Library', 'Admin Block', 'Campus Gate']
export const stages = ['REQUESTED', 'ACCEPTED', 'COLLECTED', 'DELIVERED']
export const guideExamples = ['Banana peel', 'Plastic bottle', 'Old phone', 'Battery']
// Source: githubrepos/EcoFind-main/src/app/recycle/Recycle.tsx — selectable electronics inventory, expanded with charger, earphones and battery for the local demo.
export const eWasteItems = ['Old phone', 'Laptop', 'Charger', 'Earphones', 'Battery']

export const streamName = (stream) => streams.find((option) => option.id === stream)?.label || stream || 'Choose stream'
export const slotName = (slot) => slots.find((option) => option.id === slot)?.label || slot || '—'

export function pickupId(pickup) {
  return pickup?.id ?? pickup?.pickupId ?? ''
}

export function weight(kg) {
  return `${Number(kg || 0).toLocaleString('en-IN', { maximumFractionDigits: 3 })} kg`
}

export function dateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}
