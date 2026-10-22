import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { FRAME, fitModel, loadAssembly, loadRecoveredModel, partsOf, type StackPart } from '../lib/loadModel'

type Props = {
  src: string
  height?: number | string
  autoRotate?: boolean
  className?: string
  texture?: string
  tint?: string
  /** Full component stack; when set it is assembled instead of loading `src`. */
  stack?: StackPart[]
  /** Focus one named part in the viewer without changing the assembled build. */
  focusRole?: string | null
  /** Auto-rotate speed; crank it up for a bey mid-battle. */
  spin?: number
  /**
   * Whether the model takes the pointer at all. Off for decoration — a hero or
   * a card is something you scroll past, and a canvas that swallows the wheel
   * to zoom instead of letting the page move is the single fiddliest thing a
   * 3D site does. Only the Lab, where inspecting *is* the task, turns it on.
  */
  interactive?: boolean
  /** Load the real mesh on compact layouts when the model is the hero artwork. */
  force3D?: boolean
  /**
   * Cast a shadow onto an invisible ground plane. Grounds the bey on a plain
   * surface, but over painted key art the plane greys out whatever bright
   * artwork sits behind the model — so the hero turns it off.
   */
  ground?: boolean
  /** Spin the mesh on its own Y axis, the way a Bey actually launches. */
  spinAxis?: boolean
  /** Product-shot lighting and a stadium ring. Use on marketing stages. */
  presentation?: 'default' | 'hero' | 'tile'
  /** Fires with the dressed model so callers can list its parts. */
  onReady?: (object: THREE.Object3D) => void
  /** Static art shown while a large FBX/OBJ is parsing, and when it fails. */
  poster?: string
}

/** Shared OBJ/FBX inspector used by the hero, detail modal and 3D lab. */
export function ModelViewer({ src, height = '100%', autoRotate = true, className, texture, tint, stack, focusRole = null, spin = 1.6, interactive = true, force3D = false, ground: useGround = true, spinAxis = false, presentation = 'default', onReady, poster }: Props) {
  // Serialised so a fresh array literal each render does not rebuild the scene.
  const stackKey = stack?.map((p) => p.src).join('|')
  const mount = useRef<HTMLDivElement>(null)
  const canvasHost = useRef<HTMLDivElement>(null)
  // Kept in a ref so a new callback identity never rebuilds the scene.
  const ready = useRef(onReady)
  ready.current = onReady
  const focusRef = useRef(focusRole)
  focusRef.current = focusRole
  const focusApplyRef = useRef<((role: string | null) => void) | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'static'>('loading')

  useEffect(() => {
    focusApplyRef.current?.(focusRole)
  }, [focusRole])

  useEffect(() => {
    const el = mount.current
    const host = canvasHost.current
    if (!el || !host) return
    setStatus('loading')
    // Decorative viewers are hidden on compact game layouts. Do not parse a
    // large FBX into a zero-sized canvas that the user cannot see.
    if (el.clientWidth <= 1 || el.clientHeight <= 1) return
    // On phones, decorative 3D should never block the first paint or steal the
    // page's scroll. The recovered poster remains the intentional mobile art.
    if (!interactive && !force3D && window.matchMedia('(max-width: 700px)').matches) {
      setStatus('static')
      return
    }

    const heroLook = presentation === 'hero'
    const tileLook = presentation === 'tile'
    // Tiles/hero used to overfill the frame (FRAME*1.45 + tight top-down cam),
    // which cropped to the chip hub. Keep the full silhouette with padding.
    const frameSize = tileLook ? FRAME * 0.88 : heroLook ? FRAME * 0.9 : FRAME
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(tileLook ? 32 : heroLook ? 30 : 34, 1, 0.01, 200)
    camera.position.set(
      tileLook ? 0.42 : heroLook ? 0.55 : 2.45,
      tileLook ? 1.72 : heroLook ? 1.85 : 2.3,
      tileLook ? 3.45 : heroLook ? 4.35 : 3.65,
    )
    const defaultTarget = new THREE.Vector3(0, tileLook ? 0.02 : heroLook ? 0.05 : 0, 0)

    // preserveDrawingBuffer keeps the last frame readable, so a still is
    // available for verification and the canvas survives a compositor hiccup.
    const coarse =
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: coarse)').matches &&
      !window.matchMedia('(any-pointer: fine)').matches
    const lowPower =
      coarse ||
      (typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches)
    const renderer = new THREE.WebGLRenderer({
      antialias: !lowPower,
      alpha: true,
      preserveDrawingBuffer: !lowPower,
      powerPreference: lowPower ? 'low-power' : 'high-performance',
    })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(devicePixelRatio, lowPower ? 1.15 : 1.85))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = heroLook ? 1.18 : 1.0
    // The canvas is taken out of flow so it can never contribute to the
    // container's width — otherwise it lays out at its bitmap size, the parent
    // grows to match, and the next measure reads that inflated width back.
    // Only if the page has not already given it a positioning context, so a
    // layout can inset the mount without it silently collapsing to zero height.
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative'
    Object.assign(renderer.domElement.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      display: 'block',
      // OrbitControls sets `touch-action: none` on the canvas the moment it
      // attaches, which on a phone means a finger landing on the bey cannot
      // scroll the page at all. Decorative viewers give the pointer straight
      // back to the document.
      pointerEvents: interactive ? 'auto' : 'none',
      cursor: interactive ? 'grab' : 'default',
      touchAction: interactive ? 'none' : 'pan-y',
    })
    host.appendChild(renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const envRt = pmrem.fromScene(new RoomEnvironment(), lowPower ? 0.08 : 0.04)
    scene.environment = envRt.texture

    // Soft shadows so the bey sits on a surface instead of floating. Only the
    // single-model viewer pays for this; the shared card stage does not.
    renderer.shadowMap.enabled = useGround && !lowPower
    renderer.shadowMap.type = THREE.PCFShadowMap

    // Lit for a paper-white page, not a black one: bounce comes up off the
    // ground instead of falling away into it, so the underside of a disc reads
    // as metal rather than a silhouette.
    scene.add(new THREE.HemisphereLight(heroLook ? 0x9adfff : 0xc9edff, 0x07111d, heroLook ? 0.85 : 1.15))
    const key = new THREE.DirectionalLight(0xffffff, heroLook ? 2.6 : 3.1)
    key.position.set(heroLook ? 2.2 : 3.5, heroLook ? 6.2 : 5.5, heroLook ? 3.4 : 2.8)
    key.castShadow = useGround && !lowPower
    key.shadow.mapSize.set(lowPower ? 512 : 1024, lowPower ? 512 : 1024)
    key.shadow.camera.near = 0.5
    key.shadow.camera.far = 20
    key.shadow.camera.left = -2.6
    key.shadow.camera.right = 2.6
    key.shadow.camera.top = 2.6
    key.shadow.camera.bottom = -2.6
    key.shadow.bias = -0.0016
    key.shadow.radius = 3
    scene.add(key)

    // Catches the shadow only — invisible itself, so the page shows through.
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 9),
      new THREE.ShadowMaterial({ opacity: 0.34 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -FRAME * 0.52
    ground.receiveShadow = true
    if (useGround) scene.add(ground)
    const fill = new THREE.DirectionalLight(heroLook ? 0x13fff3 : 0x25d8ff, heroLook ? 1.55 : 1.15)
    fill.position.set(-3.5, 1.8, -2.5)
    scene.add(fill)
    // Rim from behind. On a light page this is what draws the *edge* of a dark
    // bit or ratchet — without it the silhouette dissolves into the paper.
    const rim = new THREE.DirectionalLight(heroLook ? 0xff2a3c : 0xff3f58, heroLook ? 2.2 : 2.8)
    rim.position.set(-1.5, 2.8, -4.5)
    scene.add(rim)
    const top = new THREE.PointLight(heroLook ? 0xa2ff1f : 0xc8ff00, heroLook ? 0.7 : 1.2, 8)
    top.position.set(0, 3.8, 1.2)
    scene.add(top)

    if (heroLook) {
      const stadiumY = -FRAME * 0.52
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.28, 0.028, 10, 96),
        new THREE.MeshStandardMaterial({ color: 0x13fff3, emissive: 0x13fff3, emissiveIntensity: 0.7, metalness: 0.55, roughness: 0.22 }),
      )
      ring.rotation.x = Math.PI / 2
      ring.position.y = stadiumY
      scene.add(ring)
      const rail = new THREE.Mesh(
        new THREE.TorusGeometry(1.08, 0.012, 8, 80),
        new THREE.MeshStandardMaterial({ color: 0xa2ff1f, emissive: 0xa2ff1f, emissiveIntensity: 0.45, metalness: 0.4, roughness: 0.3 }),
      )
      rail.rotation.x = Math.PI / 2
      rail.position.y = stadiumY + 0.01
      scene.add(rail)
    }

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.07
    controls.rotateSpeed = 0.85
    controls.autoRotate = autoRotate && !spinAxis
    controls.autoRotateSpeed = spin
    // Panning slides the bey out of frame with no way back, and there is
    // nothing beside it worth panning to.
    controls.enablePan = false
    controls.enabled = interactive
    // Zoom is for the Lab, where inspecting a part is the point. Anywhere else
    // the wheel belongs to the page.
    controls.enableZoom = interactive
    controls.minDistance = tileLook ? 2.4 : heroLook ? 2.6 : 1.8
    controls.maxDistance = 7
    // Stops the orbit tipping under the floor or over the top, where the model
    // reads as a flat disc and the shadow plane cuts across it.
    controls.minPolarAngle = tileLook || heroLook ? 0.28 * Math.PI : 0.18 * Math.PI
    controls.maxPolarAngle = tileLook || heroLook ? 0.72 * Math.PI : 0.82 * Math.PI

    let root: THREE.Object3D | null = null
    let cancelled = false
    let groups: ReturnType<typeof partsOf> = []
    let focusFrame = 0

    const resize = () => {
      const w = el.clientWidth || 1
      const h = el.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      if (root) renderer.render(scene, camera)
    }
    resize()
    // The frame can be resized by layout alone, so watch the element, not the
    // window — otherwise the canvas keeps a stale size and renders stretched.
    const observer = new ResizeObserver(resize)
    observer.observe(el)

    const drawNow = () => renderer.render(scene, camera)

    const focusPart = (role: string | null) => {
      cancelAnimationFrame(focusFrame)
      const selected = role ? groups.find((group) => group.role === role) : undefined
      const box = new THREE.Box3()
      if (selected) selected.objects.forEach((object) => box.expandByObject(object))

      const startPosition = camera.position.clone()
      const startTarget = controls.target.clone()
      const endTarget = selected ? box.getCenter(new THREE.Vector3()) : defaultTarget.clone()
      const size = selected ? box.getSize(new THREE.Vector3()) : new THREE.Vector3()
      const radius = Math.max(size.x, size.y, size.z, 0.12)
      const direction = camera.position.clone().sub(controls.target).normalize()
      const distance = selected
        ? Math.max(radius / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.45, controls.minDistance + 0.15)
        : 3.2
      const endPosition = endTarget.clone().add(direction.multiplyScalar(distance))
      const started = performance.now()
      controls.autoRotate = !selected && autoRotate && !spinAxis

      const animateFocus = (now: number) => {
        const t = Math.min((now - started) / 520, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        camera.position.lerpVectors(startPosition, endPosition, eased)
        controls.target.lerpVectors(startTarget, endTarget, eased)
        controls.update()
        drawNow()
        if (t < 1) focusFrame = requestAnimationFrame(animateFocus)
      }
      focusFrame = requestAnimationFrame(animateFocus)
    }
    focusApplyRef.current = focusPart

    ;(async () => {
      try {
        const object = stack?.length ? await loadAssembly(stack) : await loadRecoveredModel(src, texture, tint)
        if (cancelled) return
        // Measured before fitModel, while the object is still in its own units.
        fitModel(object, frameSize)
        object.traverse((n) => {
          if ((n as THREE.Mesh).isMesh) n.castShadow = useGround
        })
        controls.target.copy(defaultTarget)
        controls.update()
        scene.add(object)
        root = object
        groups = partsOf(object)
        focusPart(focusRef.current)
        drawNow()
        setStatus('ready')
        ready.current?.(object)
      } catch (err) {
        console.error('ModelViewer failed', src, err)
        if (!cancelled) setStatus('error')
      }
    })()

    let frame = 0
    const tick = () => {
      frame = requestAnimationFrame(tick)
      if (spinAxis && root && !focusRef.current) {
        root.rotation.y += 0.018 * Math.max(spin, 0.6)
      }
      controls.update()
      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      cancelAnimationFrame(focusFrame)
      focusApplyRef.current = null
      observer.disconnect()
      controls.dispose()
      if (root) {
        scene.remove(root)
        root.traverse((node) => {
          const mesh = node as THREE.Mesh
          mesh.geometry?.dispose()
          const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []
          // Maps come from the shared texture cache; only the material is ours.
          mats.forEach((m) => (m as THREE.MeshStandardMaterial).dispose())
        })
      }
      envRt.texture.dispose()
      pmrem.dispose()
      renderer.dispose()
      // Drop the GL context so rapid product-page navigation cannot pile up contexts.
      const gl = renderer.getContext()
      const lose = (gl as WebGLRenderingContext & { getExtension(name: string): { loseContext(): void } | null }).getExtension?.(
        'WEBGL_lose_context',
      )
      lose?.loseContext()
      host.replaceChildren()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stackKey stands in for stack
  }, [src, autoRotate, texture, tint, spin, stackKey, interactive, force3D, useGround, spinAxis, presentation])

  return (
    <div
      ref={mount}
      className={`model-viewer-root${className ? ` ${className}` : ''}`}
      style={{ width: '100%', height, minHeight: typeof height === 'number' ? height : 280, position: 'relative' }}
      data-model-state={status}
      data-model-src={src}
      aria-label="Interactive 3D model"
      aria-busy={status === 'loading'}
    >
      {poster ? (
        <img
          className={`model-poster${status === 'ready' ? ' is-hidden' : ''}`}
          src={poster}
          alt=""
          aria-hidden="true"
        />
      ) : null}
      <div ref={canvasHost} className="model-canvas-host" aria-hidden="true" />
      {status === 'loading' && (
        <span className="model-status model-status-loading" aria-live="polite">
          Loading model
        </span>
      )}
      {status === 'error' && (
        <span className="model-status model-status-error" role="status">
          {poster ? '3D mesh failed — showing poster' : 'Preview unavailable'}
        </span>
      )}
      {status === 'static' && (
        <span className="model-status model-status-static">3D preview in Bey Lab</span>
      )}
    </div>
  )
}
