import { lazy, Suspense, type ComponentProps } from 'react'
import type { StackPart } from '../lib/loadModel'

const ModelViewerImpl = lazy(() => import('./ModelViewerImpl').then((module) => ({ default: module.ModelViewer })))

export type ModelViewerProps = ComponentProps<typeof ModelViewerImpl> & { poster?: string }

function StaticPreview({ poster, height = '100%', className }: Pick<ModelViewerProps, 'poster' | 'height' | 'className'>) {
  return (
    <div
      className={`model-viewer-root${className ? ` ${className}` : ''}`}
      style={{ width: '100%', height, minHeight: typeof height === 'number' ? height : 280, position: 'relative' }}
      data-model-state="static"
      aria-label="3D model preview"
    >
      {poster && <img className="model-poster" src={poster} alt="" aria-hidden="true" />}
      <span className="model-status model-status-static">3D preview in Bey Lab</span>
    </div>
  )
}

export function ModelViewer(props: ModelViewerProps) {
  const compactDecoration = !props.interactive && !props.force3D && typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches
  if (compactDecoration) return <StaticPreview {...props} />

  return (
    <Suspense fallback={<StaticPreview {...props} />}>
      <ModelViewerImpl {...props} />
    </Suspense>
  )
}

export type { StackPart }
