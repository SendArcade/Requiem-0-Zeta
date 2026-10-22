'use client'
import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
const Shell = dynamic(() => import('./ConsumerShell'), { ssr: false, loading: () => <p role="status">Opening archive…</p> })
export function ConsumerBoundary({ children }: { children: ReactNode }) { return <Shell>{children}</Shell> }
