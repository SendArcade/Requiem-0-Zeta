import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { FRAME, fitModel, loadAssembly, loadRecoveredModel, type StackPart } from '../lib/loadModel'

type SlotConfig = { src: string; texture?: string; tint?: string; stack?: StackPart[] }
type Slot = SlotConfig & {
  el: HTMLElement
  model?: THREE.Object3D
  spin: number
  loading?: boolean
  wanted?: boolean
}
type Registry = { register: (el: HTMLElement, config: SlotConfig) => () => void } | null

const StageContext = createContext<Registry>(null)

function disposeObject(object: THREE.Object3D) {
  object.traverse((node) => {
    const mesh = node as THREE.Mesh
    mesh.geometry?.dispose()
    const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []
    mats.forEach((m) => (m as THREE.MeshStandardMaterial).dispose())
  })
}

/**
 * One WebGL context draws every card preview via scissored viewports.
 * Meshes are loaded only while their slot is near the viewport so a large
 * catalog does not fetch every FBX at once.
 */
export function ModelStageProvider({ children }: { children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const slots = useRef(new Map<HTMLElement, Slot>())
  const sceneRef = useRef<THREE.Scene>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.85))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    renderer.autoClear = false

    const scene = new THREE.Scene()
    sceneRef.current = scene
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envRt = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = envRt.texture
    // Matched to ModelViewer — a card preview and the full inspector showing
    // the same bey under different light is the thing that reads as unfinished.
    scene.add(new THREE.HemisphereLight(0xc9edff, 0x07111d, 1.15))
    const key = new THREE.DirectionalLight(0xffffff, 3.1)
    key.position.set(3.5, 5.5, 2.8)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0x25d8ff, 1.15)
    fill.position.set(-3.5, 1.8, -2.5)
    scene.add(fill)
    // Rim from behind: draws the edge of a dark bit against a white card.
    const rim = new THREE.DirectionalLight(0xff3f58, 2.8)
    rim.position.set(-1.5, 2.8, -4.5)
    scene.add(rim)
    const top = new THREE.PointLight(0xc8ff00, 1.2, 8)
    top.position.set(0, 3.8, 1.2)
    scene.add(top)

    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 200)
    camera.position.set(2.45, 2.3, 3.65)
    camera.lookAt(0, 0, 0)

    const resize = () => renderer.setSize(innerWidth, innerHeight, false)
    resize()
    window.addEventListener('resize', resize)

    renderer.setClearColor(0x000000, 0)
    let frame = 0
    let last = performance.now()

    const tick = () => {
      frame = requestAnimationFrame(tick)
      const now = performance.now()
      const delta = Math.min((now - last) / 1000, 0.1)
      last = now

      renderer.setScissorTest(false)
      renderer.clear(true, true, false)
      renderer.setScissorTest(true)

      const viewH = renderer.domElement.clientHeight
      const viewW = renderer.domElement.clientWidth

      slots.current.forEach((slot) => {
        const rect = slot.el.getBoundingClientRect()
        const offscreen = rect.bottom <= 0 || rect.top >= viewH || rect.right <= 0 || rect.left >= viewW
        if (offscreen || rect.width < 2 || rect.height < 2 || !slot.model) return

        const bottom = viewH - rect.bottom
        renderer.setViewport(rect.left, bottom, rect.width, rect.height)
        renderer.setScissor(rect.left, bottom, rect.width, rect.height)
        renderer.clearDepth()

        slot.spin += delta * 0.55
        slot.model.rotation.y = slot.spin
        slot.model.visible = true
        camera.aspect = rect.width / rect.height
        camera.updateProjectionMatrix()
        renderer.render(scene, camera)
        slot.model.visible = false
      })
    }
    tick()

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      envRt.texture.dispose()
      pmrem.dispose()
      renderer.dispose()
      sceneRef.current = null
    }
  }, [])

  const registry = useMemo<Registry>(
    () => ({
      register(el, config) {
        const slot: Slot = { ...config, el, spin: Math.random() * Math.PI * 2, wanted: false }
        slots.current.set(el, slot)
        let cancelled = false
        let loadId = 0

        const unload = () => {
          const scene = sceneRef.current
          if (slot.model && scene) {
            scene.remove(slot.model)
            disposeObject(slot.model)
            slot.model = undefined
          }
          slot.loading = false
        }

        const load = () => {
          if (cancelled || slot.model || slot.loading) return
          slot.loading = true
          const id = ++loadId
          const request = config.stack?.length
            ? loadAssembly(config.stack)
            : loadRecoveredModel(config.src, config.texture, config.tint)
          request
            .then((object) => {
              const scene = sceneRef.current
              if (cancelled || id !== loadId || !slot.wanted || !scene) {
                disposeObject(object)
                slot.loading = false
                return
              }
              // A wrapper carries the spin so re-centring is not undone by rotation.
              const pivot = new THREE.Group()
              fitModel(object, FRAME)
              pivot.add(object)
              pivot.visible = false
              scene.add(pivot)
              slot.model = pivot
              slot.loading = false
            })
            .catch((err) => {
              slot.loading = false
              console.error('ModelStage failed', config.src, err)
            })
        }

        const observer = new IntersectionObserver(
          ([entry]) => {
            slot.wanted = entry.isIntersecting
            if (entry.isIntersecting) load()
            else unload()
          },
          // Keep the initial catalogue paint cheap. The poster is already
          // visible; parse a model only when the card is genuinely close to
          // entering the viewport.
          { rootMargin: '80px' },
        )
        observer.observe(el)

        return () => {
          cancelled = true
          observer.disconnect()
          unload()
          slots.current.delete(el)
        }
      },
    }),
    [],
  )

  return (
    <StageContext.Provider value={registry}>
      <canvas ref={canvasRef} className="model-stage-canvas" aria-hidden="true" />
      {children}
    </StageContext.Provider>
  )
}

/** Transparent window that the shared stage renders a model into. */
export function ModelSlot({
  src,
  texture,
  tint,
  stack,
  className,
}: {
  src: string
  texture?: string
  tint?: string
  stack?: StackPart[]
  className?: string
}) {
  const host = useRef<HTMLDivElement>(null)
  const registry = useContext(StageContext)
  const stackKey = stack?.map((p) => p.src).join('|')

  useEffect(() => {
    const el = host.current
    if (!el || !registry) return
    return registry.register(el, { src, texture, tint, stack })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stackKey stands in for stack
  }, [registry, src, texture, tint, stackKey])

  return <div ref={host} className={className} />
}
