// Hand-drawn geometry keeps each route recognizable without stock imagery.
export function Artwork({ kind = 'loop', className = 'h-28 w-28' }) {
  const base = { className, viewBox: '0 0 200 160', fill: 'none', role: 'img', 'aria-label': `${kind} illustration` }
  if (kind === 'bottle' || kind === 'scan') return (
    <svg {...base}>
      <circle cx="100" cy="80" r="73" fill="#E4F1EA" />
      <path d="M71 37h58M71 123h58M53 55V37h18M147 55V37h-18M53 105v18h18M147 105v18h-18" stroke="#1F6B4A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M95 40h10v16l7 10v53a7 7 0 0 1-7 7H95a7 7 0 0 1-7-7V66l7-10V40Z" fill="#FFF" stroke="#1F6B4A" strokeWidth="4" strokeLinejoin="round" />
      <path d="M88 80c9-7 16 6 24-1v27H88V80Z" fill="#BDE0CB" />
      <path d="M95 40h10M88 106h24" stroke="#1F6B4A" strokeWidth="4" strokeLinecap="round" />
      <circle cx="140" cy="94" r="8" fill="#A9D6B9" />
    </svg>
  )
  if (kind === 'truck') return (
    <svg {...base}>
      <circle cx="100" cy="80" r="73" fill="#E4F1EA" />
      <rect x="36" y="54" width="78" height="59" rx="8" fill="white" stroke="#1F6B4A" strokeWidth="4" />
      <path d="M114 72h20l24 23v18h-44V72Z" fill="#BDE0CB" stroke="#1F6B4A" strokeWidth="4" strokeLinejoin="round" />
      <path d="M132 78v17h17M45 88h33m-22-11 11 11-11 11" stroke="#1F6B4A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="62" cy="115" r="11" fill="white" stroke="#1F6B4A" strokeWidth="4" />
      <circle cx="137" cy="115" r="11" fill="white" stroke="#1F6B4A" strokeWidth="4" />
    </svg>
  )
  if (kind === 'phone') return (
    <svg {...base}>
      <circle cx="100" cy="80" r="73" fill="#EDE6F8" />
      <rect x="66" y="25" width="68" height="110" rx="12" fill="white" stroke="#5B3A9E" strokeWidth="4" />
      <path d="M88 34h24M88 122h24" stroke="#5B3A9E" strokeWidth="4" strokeLinecap="round" />
      <path d="m94 67 16 11-16 11V67Z" fill="#CDB8ED" stroke="#5B3A9E" strokeWidth="3" strokeLinejoin="round" />
      <path d="M82 75c2-8 8-15 16-18m19 39c-5 4-12 7-19 6" stroke="#5B3A9E" strokeWidth="3" strokeLinecap="round" />
      <circle cx="47" cy="86" r="6" fill="#CDB8ED" /><circle cx="154" cy="62" r="5" fill="#CDB8ED" />
    </svg>
  )
  if (kind === 'impact') return (
    <svg {...base}>
      <circle cx="100" cy="80" r="73" fill="#E3EEF9" />
      <rect x="45" y="44" width="110" height="82" rx="12" fill="white" stroke="#1D4E89" strokeWidth="4" />
      <path d="M65 108V90M84 108V76M103 108V86M122 108V62M141 108V71" stroke="#1D4E89" strokeWidth="8" strokeLinecap="round" />
      <path d="m63 66 19-12 21 7 23-18" stroke="#8DB9E7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  if (kind === 'bin') return (
    <svg {...base}>
      <circle cx="100" cy="80" r="73" fill="#E4F1EA" />
      <path d="M61 56h78l-8 74H69l-8-74ZM57 55h86M86 55V43h28v12" fill="white" stroke="#1F6B4A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M82 78v31m18-31v31m18-31v31" stroke="#A6D4B7" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
  return (
    <svg {...base}>
      <circle cx="100" cy="80" r="73" fill="#E4F1EA" />
      <path d="M59 72a43 43 0 0 1 72-22l10 10m0 0V40m0 20h-20M141 88a43 43 0 0 1-72 22l-10-10m0 0v20m0-20h20" stroke="#1F6B4A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="100" cy="80" r="12" fill="#B2D9C0" />
    </svg>
  )
}
