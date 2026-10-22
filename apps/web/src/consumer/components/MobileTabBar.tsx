'use client'
import { BookOpen, Box, Home, Layers3 } from 'lucide-react'
import { NavLink } from '../lib/navigation'

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/market', label: 'Catalogue', icon: Layers3 },
  { to: '/lab', label: '3D Lab', icon: Box },
  { to: '/docs', label: 'Docs', icon: BookOpen },
]
export function MobileTabBar() {
  return <nav className="mobile-tabs" aria-label="Main tabs">{tabs.map(({ to, label, icon: Icon, end }) =>
    <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? 'mobile-tab active' : 'mobile-tab'}>
      <Icon size={21} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span>
    </NavLink>
  )}</nav>
}
