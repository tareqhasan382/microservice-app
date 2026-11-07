import type { ComponentType, SVGProps } from 'react'
import { IconBell, IconHome, IconTasks, IconUser, IconUsers } from '../icons'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** Page heading shown in the top bar. */
  title: string
  subtitle: string
  adminOnly?: boolean
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: IconHome,
    title: 'Dashboard',
    subtitle: 'Your workspace at a glance',
    end: true,
  },
  {
    to: '/tasks',
    label: 'Tasks',
    icon: IconTasks,
    title: 'Tasks',
    subtitle: 'Create, track and complete your work',
  },
  {
    to: '/notifications',
    label: 'Notifications',
    icon: IconBell,
    title: 'Notifications',
    subtitle: 'Everything the workspace told you about',
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: IconUser,
    title: 'Profile',
    subtitle: 'Manage your identity and security',
  },
  {
    to: '/users',
    label: 'Users',
    icon: IconUsers,
    title: 'Users',
    subtitle: 'Administer people and roles',
    adminOnly: true,
  },
]

/** Resolves the nav entry that owns a path (exact, then longest prefix). */
export function findNavItem(pathname: string): NavItem | undefined {
  const exact = NAV_ITEMS.find((item) => item.to === pathname)
  if (exact) return exact
  return NAV_ITEMS.filter((item) => pathname.startsWith(item.to)).sort(
    (a, b) => b.to.length - a.to.length,
  )[0]
}
