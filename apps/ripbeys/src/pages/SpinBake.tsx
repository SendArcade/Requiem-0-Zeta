import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { GIFEncoder, applyPalette, quantize } from 'gifenc'
import { marketplaceListings, type Listing } from '../lib/assets'
import { FRAME, fitModel, loadAssembly, loadRecoveredModel, type StackPart } from '../lib/loadModel'
import { modelPathForListing } from '../lib/visualAssets'

// Dev-only baker. Renders each catalogue model once, writes a short GIF,
// and leaves the marketplace cards as images. Product and Lab stay live 3D.
// https://github.com/mattdesl/gifenc

const SIZE = 288
const FRAMES = 24
const DELAY = 42

let started = false

function stackOf(item: Listing): StackPart[] | undefined {
  return item.assembly === 'burst' && item.parts?.every((part) => part.src)
    ? item.parts.map((part) => ({ src: part.src!, texture: part.texture, tint: item.tint, role: part.role }))
    : undefined
}

function flipRows(src: Uint8Array, width: number, height: number) {
  const dst = new Uint8Array(src.length)
  const row = width * 4
  for (let y = 0; y < height; y++) {
    dst.set(src.subarray((height - 1 - y) * row, (height - y) * row), y * row)
  }
  return dst
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((node) => {
    const mesh = node as THREE.Mesh
    mesh.geometry?.dispose()
    const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []
    mats.forEach((material) => material.dispose())
  })
}

function textureImages(object: THREE.Object3D) {
  const images: HTMLImageElement[] = []
  object.traverse((node) => {
    const mesh = node as THREE.Mesh
    const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []
    mats.forEach((material) => {
      const map = (material as THREE.MeshStandardMaterial).map
      const image = map?.image as HTMLImageElement | undefined
      if (image) images.push(image)
    })
  })
  return images
}

async function waitTextures(object: THREE.Object3D) {
  const deadline = performance.now() + 1600
  const grace = performance.now() + 280
  while (performance.now() < deadline) {
    const images = textureImages(object)
    if (images.length === 0 && performance.now() > grace) break
    const pending = images.some((image) => !image.complete || image.naturalWidth === 0)
    if (images.length > 0 && !pending) break
    await new Promise((resolve) => window.setTimeout(resolve, 30))
  }
  object.traverse((node) => {
    const mesh = node as THREE.Mesh
    const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []
    mats.forEach((material) => {
      const map = (material as THREE.MeshStandardMaterial).map
      if (map) map.needsUpdate = true
    })
  })
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
}

async function exists(id: string) {
  const response = await fetch(`/assets/spins/${id}.gif`, { method: 'GET', cache: 'no-store' })
  if (!response.ok) return false
  const type = response.headers.get('content-type') ?? ''
  if (!type.includes('gif')) return false
  const body = await response.arrayBuffer()
  return body.byteLength > 32 && new TextDecoder().decode(body.slice(0, 6)) === 'GIF89a'
}

function bakeGif(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  object: THREE.Object3D,
) {
  const pivot = new THREE.Group()
  fitModel(object, FRAME)
  pivot.add(object)
  scene.add(pivot)
  const pixels = new Uint8Array(SIZE * SIZE * 4)
  const gl = renderer.getContext()
  const frames: Uint8Array[] = []
  for (let frame = 0; frame < FRAMES; frame++) {
    pivot.rotation.y = (frame / FRAMES) * Math.PI * 2
    renderer.setRenderTarget(null)
    renderer.clear()
    renderer.render(scene, camera)
    gl.readPixels(0, 0, SIZE, SIZE, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    frames.push(flipRows(pixels, SIZE, SIZE))
  }
  // One palette for the whole turn. A new palette per frame flickers the print.
  const pixelStride = 16
  const sample = new Uint8Array(Math.ceil(frames[0].length / (pixelStride * 4)) * 4 * frames.length)
  let offset = 0
  frames.forEach((frame) => {
    for (let i = 0; i < frame.length; i += pixelStride * 4) {
      sample[offset++] = frame[i]
      sample[offset++] = frame[i + 1]
      sample[offset++] = frame[i + 2]
      sample[offset++] = frame[i + 3]
    }
  })
  const palette = quantize(sample.subarray(0, offset), 256)
  const gif = GIFEncoder()
  frames.forEach((rgba, frame) => {
    const index = applyPalette(rgba, palette)
    gif.writeFrame(index, SIZE, SIZE, frame === 0 ? { palette, delay: DELAY, repeat: 0 } : { delay: DELAY })
  })
  gif.finish()
  scene.remove(pivot)
  disposeObject(object)
  return gif.bytes()
}

export function SpinBake() {
  const [line, setLine] = useState('Waiting')
  const [done, setDone] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (started) return
    started = true

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true })
    renderer.setPixelRatio(1)
    renderer.setSize(SIZE, SIZE)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    renderer.setClearColor(0x0a0a0a, 1)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envRt = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = envRt.texture
    scene.add(new THREE.HemisphereLight(0xc9edff, 0x07111d, 1.15))
    const key = new THREE.DirectionalLight(0xffffff, 3.1)
    key.position.set(3.5, 5.5, 2.8)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0x25d8ff, 1.15)
    fill.position.set(-3.5, 1.8, -2.5)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xff3f58, 2.8)
    rim.position.set(-1.5, 2.8, -4.5)
    scene.add(rim)
    const top = new THREE.PointLight(0xc8ff00, 1.2, 8)
    top.position.set(0, 3.8, 1.2)
    scene.add(top)

    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 200)
    camera.position.set(2.45, 2.3, 3.65)
    camera.lookAt(0, 0, 0)

    const jobs = marketplaceListings.filter((item) => item?.id && modelPathForListing(item))
    setTotal(jobs.length)

    ;(async () => {
      let finished = 0
      for (const item of jobs) {
        finished += 1
        setDone(finished)
        setLine(item.id)
        try {
          if (await exists(item.id)) continue
          const src = modelPathForListing(item)
          if (!src) continue
          const stack = stackOf(item)
          const object = stack?.length ? await loadAssembly(stack) : await loadRecoveredModel(src, item.texture, item.tint)
          await waitTextures(object)
          const bytes = bakeGif(renderer, scene, camera, object)
          const response = await fetch(`/__save-spin?id=${encodeURIComponent(item.id)}`, {
            method: 'POST',
            headers: { 'content-type': 'image/gif' },
            body: new Blob([bytes as unknown as BlobPart]),
          })
          if (!response.ok) throw new Error(`save ${response.status}`)
        } catch (error) {
          console.error('spin bake failed', item.id, error)
          setLine(`${item.id} failed`)
        }
      }
      setLine('Finished')
      envRt.texture.dispose()
      pmrem.dispose()
      renderer.dispose()
    })()
  }, [])

  return (
    <main style={{ minHeight: '100vh', padding: 32, background: '#000', color: '#f5f5f5', fontFamily: 'monospace' }}>
      <p>Baking card spins</p>
      <p>
        {done} / {total}
      </p>
      <p>{line}</p>
    </main>
  )
}
