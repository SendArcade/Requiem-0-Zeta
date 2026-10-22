/**
 * Marketplace visual resolution — RIPBEYS listing id → that listing's model/poster.
 * Never uses Requiem product codes or numeric BX similarity to pick assets.
 */
import visualAssets from '../data/visual-assets.json'
import type { Listing } from './assets'
import { oracleNames } from './oracleNames'

export type ListingVisual = {
  listingId: string
  /** Assembled model path for this listing only */
  model: string | null
  modelExists: boolean
  poster: string | null
  posterExists: boolean
  /** True when neither model file nor poster file is available */
  noPreview: boolean
}

type VisualEntry = {
  displayName: string
  series: string | null
  class: string | null
  assembledModel: string | null
  assembledModelExists: boolean
  poster: string | null
  posterExists: boolean
}

const byId = visualAssets.byListingId as Record<string, VisualEntry>

export const visualAssetStats = visualAssets.stats as {
  total: number
  withAssembledModel: number
  assembledModelOnDisk: number
  withPoster: number
  posterOnDisk: number
  noPreview: number
  duplicateAssembledModelPaths: number
}

/** Resolve the visual asset for a marketplace listing from the Stage 1 map index. */
export function resolveListingVisual(listingId: string | null | undefined): ListingVisual {
  const id = listingId || ''
  const entry = byId[id]
  if (!entry) {
    return {
      listingId: id,
      model: null,
      modelExists: false,
      poster: null,
      posterExists: false,
      noPreview: true,
    }
  }
  const model = entry.assembledModel
  const poster = entry.poster
  const modelExists = Boolean(model && entry.assembledModelExists)
  const posterExists = Boolean(poster && entry.posterExists)
  return {
    listingId: id,
    model,
    modelExists,
    poster,
    posterExists,
    noPreview: !modelExists && !posterExists,
  }
}

/**
 * Model path to render — the map's assembled model for this listing id only.
 * Skips paths that are not on disk so cards degrade to poster / No preview.
 */
export function modelPathForListing(item: Listing): string | undefined {
  const v = resolveListingVisual(item.id)
  if (v.model && v.modelExists) return v.model
  return undefined
}

/** Poster fallback for this listing — map poster, else x-sprites product art. */
export function posterForListing(item: Listing): string | undefined {
  const v = resolveListingVisual(item.id)
  if (v.poster && v.posterExists && !v.poster.includes('bg-waiting')) return v.poster
  if (v.model && v.modelExists) return `/assets/spins/${item.id}.gif?v=2`
  if (/\/game\/x-sprites\//i.test(item.image)) return item.image
  return undefined
}

/** Name of the confirmed Requiem product or part. Falls back to the RIPBEYS label. */
export function oracleTitleForListing(item: Listing): string {
  return oracleNames[item.id] ?? item.name
}
