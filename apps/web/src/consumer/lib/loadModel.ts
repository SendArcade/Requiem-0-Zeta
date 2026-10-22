import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { dressRecoveredMaterials, repairFailedMaps, sharedTexture } from './dressMaterials'

/**
 * Shared detail maps the exporter wires onto every plastic slot. They are
 * discarded when the materials are rebuilt, so 0.8 MB per Beyblade X mesh is
 * saved by never fetching them; the texture keeps its original name, which is
 * what dressRecoveredMaterials matches on.
 */
const UNUSED_DETAIL = /fabric_felt|glass_foam/i
const BLANK_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='

export type StackPart = { src: string; texture?: string; tint?: string; role?: string }

/**
 * How far each part rides up into the one above it, as a fraction of its own
 * height. A Burst layer is hollow underneath and swallows the top of the disc,
 * so butting the bounding boxes together leaves a visible gap.
 * ponytail: two constants eyeballed against the real toy — tune here if a
 * particular build sits proud.
 */
const STACK_OVERLAP = [0.76, 0.46]

/**
 * Loads a recovered OBJ/FBX and applies its real colour maps.
 * FBX texture references resolve as basenames next to the model, and textures
 * keep loading after the mesh resolves, so failures are repaired as they land.
 */
export async function loadRecoveredModel(src: string, texture?: string, tint?: string) {
  const manager = new THREE.LoadingManager()
  manager.setURLModifier((url) => (UNUSED_DETAIL.test(url) ? BLANK_PNG : url))
  let root: THREE.Object3D | null = null
  manager.onError = () => {
    if (root) repairFailedMaps(root)
  }
  manager.onLoad = () => {
    if (root) repairFailedMaps(root)
  }

  const map = texture ? sharedTexture(texture) : undefined

  const loader = src.toLowerCase().endsWith('.fbx') ? new FBXLoader(manager) : new OBJLoader(manager)
  const object = await loader.loadAsync(src)
  root = object
  dressRecoveredMaterials(object, { map, tint, src })
  return object
}

/**
 * A Burst release ships as three meshes — energy layer, forge disc, driver —
 * so a layer on its own is a part, not a beyblade. This stacks them back into
 * the assembled toy: widest on top, each part rising into the one above it.
 */
export async function loadAssembly(parts: StackPart[]) {
  const roles = parts.map((part) => part.role)
  if (parts.length !== 3 || roles.join('|') !== 'Layer|Disc|Driver' || parts.some((part) => !part.src)) {
    throw new Error(`Refusing an incomplete Burst stack: ${roles.join(', ') || 'no parts'}`)
  }
  const loaded = await Promise.all(parts.map((p) => loadRecoveredModel(p.src, p.texture, p.tint)))
  const group = new THREE.Group()
  let bottom = 0
  loaded.forEach((part, i) => {
    part.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(part)
    const size = box.getSize(new THREE.Vector3())
    // Centre the part, then hang it from where the previous one ended, raised
    // by its own overlap so it seats inside instead of resting on top.
    const top = bottom + (i === 0 ? 0 : size.y * (STACK_OVERLAP[i - 1] ?? 0))
    part.position.sub(box.getCenter(new THREE.Vector3()))
    part.position.y += top - size.y / 2
    bottom = top - size.y
    part.userData.beyRole = parts[i].role
    group.add(part)
  })
  return group
}

/** Beyblade X ships one mesh per release; these are its three real components. */
const X_ROLES: Array<[RegExp, string]> = [
  [/(^|[_-])(bit|tip|performance)/i, 'Bit'],
  [/(^|[_-])(ratchet|base|ring)/i, 'Ratchet'],
  [/(^|[_-])(blade|layer|head|chip|metal)/i, 'Blade'],
]

/**
 * The components a loaded bey can be pulled apart into, top of the stack first.
 * A Burst assembly already has one child per part; a Beyblade X export is a
 * single mesh tree, so its parts are recovered from the mesh names.
 */
export function partsOf(object: THREE.Object3D) {
  const assembled = object.children.filter((c) => c.userData.beyRole)
  if (assembled.length) {
    return assembled.map((c) => ({ role: c.userData.beyRole as string, objects: [c] }))
  }
  const byRole = new Map<string, THREE.Object3D[]>()
  object.traverse((node) => {
    if (!(node as THREE.Mesh).isMesh) return
    const role = X_ROLES.find(([re]) => re.test(node.name))?.[1] ?? 'Blade'
    if (!byRole.has(role)) byRole.set(role, [])
    byRole.get(role)!.push(node)
  })
  return ['Blade', 'Ratchet', 'Bit']
    .filter((r) => byRole.has(r))
    .map((role) => ({ role, objects: byRole.get(role)! }))
}

/**
 * Every model is normalised to the same size, so a wide stadium and a single
 * bey are both framed by the shared camera without per-model tuning.
 */
export const FRAME = 2.2

/**
 * Uniformly scales and centres a model so it fills its preview frame.
 *
 * Only visible meshes count: several exports ship hidden outline shells and
 * backdrop planes far outside the model, and Box3.setFromObject includes them,
 * which shrinks the real geometry to a speck.
 */
export function fitModel(object: THREE.Object3D, target: number) {
  const box = new THREE.Box3()
  object.updateWorldMatrix(true, true)
  object.traverse((node) => {
    const mesh = node as THREE.Mesh
    if (!mesh.isMesh || !mesh.visible || !mesh.geometry) return
    for (let p = node.parent; p; p = p.parent) if (!p.visible) return
    box.expandByObject(mesh)
  })
  if (box.isEmpty()) box.setFromObject(object)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const scale = target / (Math.max(size.x, size.y, size.z) || 1)
  // Some FBX roots carry a unit-conversion scale that the measured box already
  // includes, so it has to be multiplied in rather than overwritten.
  const offset = center.sub(object.position)
  object.scale.multiplyScalar(scale)
  object.position.copy(offset).multiplyScalar(-scale)
  return scale
}
