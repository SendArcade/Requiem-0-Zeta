import * as THREE from 'three'
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import partMapsJson from '../data/partMaps.json'

/**
 * Mesh -> baked AO map (and the chip decal) recovered from the FBX exports.
 * See scripts/build-part-maps.mjs — the files ship next to each mesh but land
 * in FBX texture slots three.js discards, so they are re-bound by name here.
 */
type PartMap = { ao: Record<string, string>; decal?: string }
const partMaps = partMapsJson as Record<string, PartMap>

const MODEL_DIR = '/assets/models/'

/**
 * Maps that carry shading rather than colour. Beyblade X meshes ship only
 * these — Unity tinted the parts in-shader, so the albedo is genuinely absent
 * from the export and has to be supplied per part.
 */
const MASK_MAP = /_ao\b|_ao\.|edgemask|esdgemask|curvature|uimask/i
/** Placeholder maps Unity bound to unused slots; multiplying by them muddies the part. */
const PLACEHOLDER_MAP = /emptytexture|blank/i
/** Shared detail maps the exporter wires as a normal map on every plastic part. */
const GENERIC_NORMAL = /fabric_felt|glass_foam|_height/i

type Role = {
  /** Fixed colour for parts moulded in a shared, known plastic or metal. */
  color: number
  metalness: number
  roughness: number
  /** Part takes the release's body colour instead of the fixed one. */
  paint?: boolean
  emissive?: boolean
  /** Clear/smoked plastic — the part behind it has to stay readable. */
  opacity?: number
  /** Injection-moulded parts carry a gloss layer over the colour. */
  clearcoat?: number
}

/**
 * A Beyblade X export keeps its part structure in the mesh and material names
 * (`Head_metal`, `RatchetRing_3`, `BX17_Mold4`, `Bit_F`) even though the colour
 * is gone, so each mould slot gets the finish its real counterpart has.
 * Arena exports name their slots by material instead (`Metal`, `BottomPlastic`).
 * First match wins — order is specific to generic.
 */
const ROLES: Array<[RegExp, Role]> = [
  // Fasteners and the launcher shaft are bare steel on every release.
  [/screw|shaft|spring/i, { color: 0x9aa2ab, metalness: 0.95, roughness: 0.3 }],
  // The outer blade ring is die-cast metal, painted in the release's colour.
  [/head_metal|_mold1\b|_mold1-/i, { color: 0xb9c0c9, metalness: 0.9, roughness: 0.24, paint: true }],
  // Chip face — carries the beast decal when the export shipped one.
  [/logo/i, { color: 0xd9dee4, metalness: 0.12, roughness: 0.38, paint: true, clearcoat: 0.9 }],
  // Clear cover moulded across the whole line; it sits over the printed chip,
  // so it has to stay see-through or the beast decal is hidden.
  [/head_top|sharedasset_mold2/i, { color: 0xc7d2dc, metalness: 0.1, roughness: 0.06, opacity: 0.28, clearcoat: 1 }],
  // Main coloured plastic of the blade.
  [/head_parts|blade|_mold3\b|_mold4\b/i, { color: 0x8a929c, metalness: 0.2, roughness: 0.36, paint: true, clearcoat: 0.7 }],
  // Ratchet ring is bare metal; its base is dark structural plastic.
  [/ratchetring|_ring\b|_mold5\b/i, { color: 0xb4bcc6, metalness: 0.82, roughness: 0.28 }],
  [/ratchet|_mold6\b/i, { color: 0x3b4148, metalness: 0.5, roughness: 0.45 }],
  // Internal base polymer, shared mould across releases.
  [/base_parts|sharedasset_mold7/i, { color: 0x30353c, metalness: 0.2, roughness: 0.55, clearcoat: 0.4 }],
  // Burst forge disc — the weight ring, bare die-cast metal on every release.
  [/_dis[kc]|forgedisc/i, { color: 0x8b939d, metalness: 0.96, roughness: 0.38 }],
  // Bit / driver tip — dark low-friction polymer.
  [/\bbit\b|bit_|_mold8\b|_tip|driver/i, { color: 0x2f343c, metalness: 0.1, roughness: 0.5, clearcoat: 0.5 }],
  // Arena slots.
  [/glow|emissiv|neon/i, { color: 0xffffff, metalness: 0, roughness: 0.6, emissive: true }],
  [/glass|acrylic|clear/i, { color: 0xc3d8e6, metalness: 0.1, roughness: 0.08 }],
  [/metal|chrome|steel/i, { color: 0xa8b0ba, metalness: 0.92, roughness: 0.26 }],
  [/whiteplastic/i, { color: 0xe4e8ec, metalness: 0.05, roughness: 0.45 }],
  [/plastic|rubber|track|floor/i, { color: 0x565d67, metalness: 0.08, roughness: 0.55 }],
]

const FALLBACK: Role = { color: 0x8a929c, metalness: 0.72, roughness: 0.34, paint: true, clearcoat: 0.5 }

function roleFor(slotName: string): Role {
  for (const [pattern, role] of ROLES) if (pattern.test(slotName)) return role
  return FALLBACK
}

/**
 * Textures are shared across slots, cards and models, so they are loaded once
 * and never disposed — callers must not dispose maps they got from here.
 *
 * ponytail: unbounded cache over the ~500 shipped maps; add LRU eviction only
 * if GPU memory becomes a problem, since evicting a map still in use breaks it.
 */
const textureCache = new Map<string, THREE.Texture>()
export function sharedTexture(url: string, colorSpace: THREE.ColorSpace = THREE.SRGBColorSpace) {
  const cached = textureCache.get(url)
  if (cached) return cached
  const tex = new THREE.TextureLoader().load(url)
  tex.colorSpace = colorSpace
  // Printed layer art is read at a glancing angle; without this it smears.
  tex.anisotropy = 8
  tex.name = url.split('/').pop() ?? url
  textureCache.set(url, tex)
  return tex
}

function isMaskMap(tex?: THREE.Texture | null) {
  if (!tex) return false
  const img = tex.image as { src?: string } | undefined
  return MASK_MAP.test(tex.name || '') || MASK_MAP.test(img?.src || '')
}

function isPlaceholderMap(tex?: THREE.Texture | null) {
  if (!tex) return false
  const img = tex.image as { src?: string } | undefined
  return PLACEHOLDER_MAP.test(tex.name || '') || PLACEHOLDER_MAP.test(img?.src || '')
}

/**
 * These are hard-surface meshes with authored normals, so they are left alone.
 *
 * Creasing them was tried and is wrong here: at any angle wide enough to round
 * a blade sweep it also smooths across the flat panels, and the triangulated
 * n-gons then shade as a visible fan. Only geometry that arrives with no
 * normals at all gets them computed, and creasing beats a plain per-vertex
 * average because it keeps the bevels sharp.
 */
const CREASE_ANGLE = (24 * Math.PI) / 180
function smoothCurves(geometry: THREE.BufferGeometry) {
  if (geometry.getAttribute('normal') || !geometry.getAttribute('position')) return
  try {
    const creased = toCreasedNormals(geometry, CREASE_ANGLE)
    const normal = creased.getAttribute('normal')
    if (normal) geometry.setAttribute('normal', normal)
    else geometry.computeVertexNormals()
    creased.dispose()
  } catch {
    geometry.computeVertexNormals()
  }
}

/** A texture that finished loading but produced no pixels (missing file). */
function isBrokenTexture(tex?: THREE.Texture | null) {
  const img = tex?.image as HTMLImageElement | undefined
  return !!img && img.complete === true && img.naturalWidth === 0
}

/** Palette strips are only a few pixels wide; filtering them blends colours. */
function keepPaletteCrisp(tex: THREE.Texture) {
  const img = tex.image as { width?: number; height?: number } | undefined
  if (!img?.width) return
  if (img.width <= 64 || (img.height ?? 0) <= 64) {
    tex.magFilter = THREE.NearestFilter
    tex.minFilter = THREE.NearestFilter
    tex.generateMipmaps = false
    tex.needsUpdate = true
  }
}

/**
 * Unity's shader default is white or black; a saturated authored colour is real
 * paint (arena glows, tinted acrylic) and must survive.
 */
function isShaderDefault(color?: THREE.Color) {
  if (!color) return true
  const max = Math.max(color.r, color.g, color.b)
  const min = Math.min(color.r, color.g, color.b)
  const saturation = max === 0 ? 0 : (max - min) / max
  return saturation < 0.12
}

type DressOptions = {
  /** Explicit albedo for meshes that ship no material (OBJ exports). */
  map?: THREE.Texture
  /** Body colour for parts whose albedo was baked into the shader. */
  tint?: string
  /** Model URL — keys the recovered AO / decal maps. */
  src?: string
}

/**
 * Gives recovered meshes their finish back: real `*_Color` maps stay as albedo,
 * the baked `*_AO` bakes are re-bound as ambient occlusion, the chip decal goes
 * on the logo slot, and every remaining mould slot is finished as the part it
 * actually is instead of rendering as one flat colour.
 */
export function dressRecoveredMaterials(object: THREE.Object3D, options: DressOptions = {}) {
  const tint = options.tint ? new THREE.Color(options.tint).getHex() : undefined
  const parts = options.src ? partMaps[options.src.split('/').pop() ?? ''] : undefined
  const decal = parts?.decal ? sharedTexture(MODEL_DIR + parts.decal, THREE.SRGBColorSpace) : undefined

  object.traverse((node) => {
    const mesh = node as THREE.Mesh
    if (!mesh.isMesh) return

    // Unity outline / shadow shells are pitch-black duplicates of the mesh.
    if (/outline|shadow|occlu|hide/i.test(mesh.name)) {
      mesh.visible = false
      return
    }

    const geometry = mesh.geometry as THREE.BufferGeometry | undefined
    if (geometry) smoothCurves(geometry)

    const sources = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []
    // Chip / logo meshes reuse names like Head_parts01; blade AO on those UVs
    // mulches the beast decal into a flat grey disc.
    const logoProbe = `${mesh.name} ${sources.map((s) => (s as THREE.Material | null)?.name ?? '').join(' ')}`
    const meshIsLogo = /logo/i.test(logoProbe)
    const aoFile = meshIsLogo ? undefined : parts?.ao[mesh.name]
    const ao = aoFile && geometry?.getAttribute('uv') ? sharedTexture(MODEL_DIR + aoFile, THREE.NoColorSpace) : undefined
    // AO was baked against UV0; three reads aoMap from UV1 unless told otherwise.
    if (ao) ao.channel = 0

    const dressed = (sources.length ? sources : [null]).map((source) => {
      const authored = source as THREE.MeshStandardMaterial | null
      const slotName = `${mesh.name} ${authored?.name ?? ''}`
      const role = roleFor(slotName)
      const isLogoSlot = meshIsLogo || /logo/i.test(slotName)

      const authoredMap = isPlaceholderMap(authored?.map) ? null : authored?.map ?? null
      const authoredMask = authoredMap && isMaskMap(authoredMap) ? authoredMap : null
      // Per-part maps from the export win over the catalog's whole-model map;
      // a mask is only worth binding when nothing supplies real colour.
      const albedo = (isLogoSlot && decal) || (authoredMask ? null : authoredMap) || options.map || null
      const supplied = albedo ?? authoredMask

      if (supplied) keepPaletteCrisp(supplied)

      let color: number
      let metalness: number
      let roughness: number
      if (albedo) {
        color = 0xffffff
        metalness = role.emissive ? 0 : Math.min(role.metalness, 0.3)
        roughness = 0.42
      } else if (isShaderDefault(authored?.color)) {
        color = role.paint && tint !== undefined ? tint : role.color
        metalness = role.metalness
        roughness = role.roughness
      } else {
        color = authored!.color.getHex()
        metalness = role.emissive ? 0 : 0.3
        roughness = 0.48
      }

      // The exporter wires a shared felt/foam detail map as the normal map on
      // every plastic slot; at full strength it makes moulded parts look woven.
      const normalMap = authored?.normalMap && !GENERIC_NORMAL.test(authored.normalMap.name || '')
        ? authored.normalMap
        : null

      // Physical over Standard for the gloss layer real moulded plastic has —
      // without it every part reads as matte resin.
      const material = new THREE.MeshPhysicalMaterial({
        color,
        map: supplied,
        normalMap,
        aoMap: ao ?? null,
        aoMapIntensity: albedo ? 0.7 : 1,
        clearcoat: role.clearcoat ?? 0,
        clearcoatRoughness: 0.14,
        metalness,
        roughness,
        emissive: role.emissive ? new THREE.Color(color) : new THREE.Color(0x000000),
        emissiveIntensity: role.emissive ? 0.85 : 0,
        // Pushed up for the light page: reflections are what separate die-cast
        // metal from grey plastic, and against #f6f6f6 a timid env map leaves
        // both looking like the same matte slab.
        envMapIntensity: albedo ? 1.1 : 1.5,
        side: THREE.DoubleSide,
        transparent: role.opacity !== undefined,
        opacity: role.opacity ?? 1,
        // A clear cover must not occlude the printed chip sitting under it.
        depthWrite: role.opacity === undefined,
      })
      // The badge art is a round decal on a square sheet; cut the corners away
      // rather than blending them so the chip keeps a hard edge.
      if (isLogoSlot && decal && supplied === decal) {
        material.alphaTest = 0.5
      }
      material.name = authored?.name ?? ''
      // Remembered so a texture that 404s later can fall back cleanly.
      material.userData.fallbackColor = role.paint && tint !== undefined ? tint : role.color
      return material
    })

    mesh.material = dressed.length > 1 ? dressed : dressed[0]
    sources.forEach((source) => source?.dispose())
  })
}

/**
 * Drops maps whose image failed to load. Without this a missing texture file
 * renders the whole part black instead of showing its part colour.
 */
export function repairFailedMaps(object: THREE.Object3D) {
  object.traverse((node) => {
    const mesh = node as THREE.Mesh
    if (!mesh.isMesh) return
    const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []
    mats.forEach((m) => {
      const mat = m as THREE.MeshStandardMaterial
      if (isBrokenTexture(mat.aoMap)) {
        mat.aoMap = null
        mat.needsUpdate = true
      }
      if (!isBrokenTexture(mat.map)) {
        if (mat.map) keepPaletteCrisp(mat.map)
        return
      }
      mat.map = null
      mat.alphaTest = 0
      mat.color.setHex((mat.userData.fallbackColor as number) ?? FALLBACK.color)
      mat.needsUpdate = true
    })
  })
}
