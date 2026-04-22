import React, { forwardRef, type SVGProps } from 'react'

interface IconProps {
  size?: number
  color?: string
  className?: string
}

type SvgRender = (p: { size: number; color: string; className?: string }) => React.ReactElement

function makeIcon(defaults: { size?: number; color?: string }, render: SvgRender) {
  return forwardRef<SVGSVGElement, IconProps>(function Icon(
    { size = defaults.size ?? 22, color = defaults.color ?? defaultColor, className },
    _ref,
  ) {
    return render({ size, color, className })
  })
}

const defaultColor = 'rgba(255,255,255,0.45)'
const activeColor = '#C8F25A'

export const IconHome = ({ size = 22, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M2 9.5L11 2L20 9.5V20H14.5V14H7.5V20H2V9.5Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
)

export const IconLog = ({ size = 22, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="2" width="18" height="18" rx="4" stroke={color} strokeWidth="1.5"/>
    <path d="M11 7V15M7 11H15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export const IconGoals = ({ size = 22, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="11" cy="11" r="9" stroke={color} strokeWidth="1.5"/>
    <circle cx="11" cy="11" r="5" stroke={color} strokeWidth="1.5" strokeOpacity="0.6"/>
    <circle cx="11" cy="11" r="2" fill={color}/>
  </svg>
)

export const IconRecognition = ({ size = 22, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M11 2L13.5 8H20L14.5 12L16.5 18.5L11 14.5L5.5 18.5L7.5 12L2 8H8.5L11 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
)

export const IconProfile = ({ size = 22, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="11" cy="7.5" r="4" stroke={color} strokeWidth="1.5"/>
    <path d="M2 19.5C2 15.6 6 13 11 13C16 13 20 15.6 20 19.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export const IconSquad = ({ size = 22, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="8" cy="7" r="3.5" stroke={color} strokeWidth="1.5"/>
    <circle cx="15" cy="7" r="3.5" stroke={color} strokeWidth="1.5"/>
    <path d="M1 19C1 15.7 4.1 13 8 13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 19C8 15.7 11.1 13 15 13C18.9 13 22 15.7 22 19" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export const IconSessions = ({ size = 22, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="3" width="18" height="17" rx="3" stroke={color} strokeWidth="1.5"/>
    <path d="M7 2V5M15 2V5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M2 8.5H20" stroke={color} strokeWidth="1.5"/>
    <path d="M6 13H10M6 16.5H14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export const IconAssess = ({ size = 22, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="2" width="16" height="18" rx="3" stroke={color} strokeWidth="1.5"/>
    <path d="M7 7H15M7 11H15M7 15H11" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export const IconAlerts = ({ size = 22, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M11 2C7.1 2 4 5.1 4 9V15L2 17H20L18 15V9C18 5.1 14.9 2 11 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M8.5 17C8.5 18.4 9.6 19.5 11 19.5C12.4 19.5 13.5 18.4 13.5 17" stroke={color} strokeWidth="1.5"/>
  </svg>
)

export const IconOverview = ({ size = 22, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M11 2L4 6V12C4 16.4 7 20.4 11 21.5C15 20.4 18 16.4 18 12V6L11 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M7.5 11.5L10 14L14.5 8.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const IconCoaches = ({ size = 22, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="2" width="16" height="18" rx="3" stroke={color} strokeWidth="1.5"/>
    <path d="M7 7H15M7 11H15M7 15H11" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="17" cy="17" r="4" fill="#0a0a0b" stroke={color} strokeWidth="1.5"/>
    <path d="M15.5 17L16.5 18L18.5 15.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ── Role icons (larger, coloured) ──

export const IconRolePlayer = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="8" r="5" stroke="#C8F25A" strokeWidth="1.5"/>
    <path d="M4 26C4 20.5 8.5 17 14 17C19.5 17 24 20.5 24 26" stroke="#C8F25A" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14 17V22M11 19.5L17 19.5" stroke="#C8F25A" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export const IconRoleCoach = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="3" width="20" height="22" rx="3" stroke="#60a5fa" strokeWidth="1.5"/>
    <path d="M9 9H19M9 13H19M9 17H14" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="20" cy="20" r="5" fill="#0a0a0b" stroke="#60a5fa" strokeWidth="1.5"/>
    <path d="M18 20L19.5 21.5L22.5 18.5" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const IconRoleParent = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="8" r="4" stroke="#4ade80" strokeWidth="1.5"/>
    <circle cx="20" cy="10" r="3" stroke="#4ade80" strokeWidth="1.5"/>
    <path d="M3 24C3 19.6 6.1 17 10 17C14 17 17 19.6 17 24" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M17 24C17 21.5 18.3 20 20 20C21.7 20 23 21.5 23 24" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export const IconRoleClub = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 3L4 8V14C4 19.5 8.4 24.6 14 26C19.6 24.6 24 19.5 24 14V8L14 3Z" stroke="#60a5fa" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M10 14L13 17L18 11" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ── Action icons ──

export const IconMatch = ({ size = 22, color = '#C8F25A', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="11" cy="11" r="9" stroke={color} strokeWidth="1.5"/>
    <path d="M7 11C7.5 8.5 9.5 7 11 7C12.5 7 14.5 8.5 15 11" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 13.5C8.5 15.5 9.8 16.5 11 16.5C12.2 16.5 13.5 15.5 14 13.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M11 7V4M7.5 8.5L5.5 6.5M14.5 8.5L16.5 6.5" stroke={color} strokeWidth="1" strokeLinecap="round"/>
  </svg>
)

export const IconAward = ({ size = 22, color = '#C8F25A', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M11 2L12.9 7.6H18.8L14 11L15.9 16.5L11 13.2L6.1 16.5L8 11L3.2 7.6H9.1L11 2Z" fill="rgba(200,242,90,0.15)" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
)

export const IconPassport = ({ size = 22, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="2" width="16" height="18" rx="2.5" stroke={color} strokeWidth="1.5"/>
    <circle cx="11" cy="9" r="3" stroke={color} strokeWidth="1.5"/>
    <path d="M6 15.5C6.5 13.5 8.5 12.5 11 12.5C13.5 12.5 15.5 13.5 16 15.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export const IconProgress = ({ size = 22, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M2 16L8 10L12 13L20 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 5H20V10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const IconCode = ({ size = 22, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="7" width="18" height="11" rx="2.5" stroke={color} strokeWidth="1.5"/>
    <path d="M7 7V5.5C7 3.6 8.6 2 10.5 2H11.5C13.4 2 15 3.6 15 5.5V7" stroke={color} strokeWidth="1.5"/>
    <circle cx="11" cy="12.5" r="2" fill={color}/>
  </svg>
)

export const IconVerified = ({ size = 22, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M11 2L13 3.5L15.5 3L17 5.5L19.5 6.5L19 9L21 11L19 13L19.5 15.5L17 16.5L15.5 19L13 18.5L11 20L9 18.5L6.5 19L5 16.5L2.5 15.5L3 13L1 11L3 9L2.5 6.5L5 5.5L6.5 3L9 3.5L11 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M7.5 11.5L10 14L14.5 8.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const ACTIVE_COLOR = activeColor
export const DEFAULT_COLOR = defaultColor
