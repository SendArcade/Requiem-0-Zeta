import burstParts from '../data/burstParts.json'
import burstBuilds from '../data/burstBuilds.json'
import partMaps from '../data/partMaps.json'
import art from '../data/art.json'

/** Paths match web/public/assets layout */

export function modelUrl(file: string) {
  return `/assets/models/${file}`
}

/** Manifest of every mesh copied into public/assets/models by the ingest scripts. */
export const modelFiles = [
  'sword_dran.fbx',
  'dagger_dran.fbx',
  'tail_viper.fbx',
  'soar_phoenix.fbx',
  'courage_dran.fbx',
  'reaper_incendio.fbx',
  'arc_wizard.fbx',
  'dark_perseus.fbx',
  'keel_shark.fbx',
  'yell_kong.fbx',
  'helm_knight.fbx',
  'scythe_incendio.fbx',
  'chain_incendio.fbx',
  'talon_ptera.fbx',
  'savage_bear.fbx',
  'roar_tyrano.fbx',
  'bite_croc.fbx',
  'mammo_tusk.fbx',
  'gale_wyvern.fbx',
  'lance_knight.fbx',
  'horn_rhino.fbx',
  'cobalt_dragoon.fbx',
  'shinobi_knife.fbx',
  'dranzer_spiral.fbx',
  'AceDragon_Layer.obj',
  'AbyssFafnirF6_Layer.obj',
  'AchillesA5_Layer.obj',
  'LordSpryzen_Layer.obj',
  'ChoZValtryek_Layer.obj',
  'TurboAchilles_Layer.obj',
  'DeadPhoenixP4_Layer.obj',
  'FafnirF4_Layer.obj',
  'Brave_Valtryek_Layer.obj',
  'Astral_Spryzen_S7_EnergyLayer.obj',
  'Berserk_Balderov_B7_EnergyLayer.obj',
  'ChoZAchilles_Layer.obj',
  'CommandDragon_Layer.obj',
  'Amaterios_Layer.obj',
  'AnubionA4_Layer.obj',
  'BushinAsuraA5_Layer.obj',
  'BraveRoktavorR6_Layer.obj',
  'CosmicValtryek_Layer.obj',
  'JudgementJoker_Layer.obj',
  'Arena_SkyClash.obj',
  'Arena_Main.obj',
  'AuxBlade_Base.obj',
  'achillesa5unionpremiumgeo.fbx',
  'achillesa6infinitegeo.fbx',
  'achillesa6origingeo.fbx',
  'achilliescho-zgeo.fbx',
  'achillesinfinitegeo.fbx',
  'achillesunionprogeo.fbx',
  'apocalypsea5primegeov2.fbx',
  'balkeshb5erasegeo.fbx',
  'balkeshsoulgeo.fbx',
  'bushinashindraa5geov2.fbx',
  'cyclopsc5poisongeo.fbx',
  'deathscyther2geo.fbx',
  'epiceviperogeo.fbx',
  'eviperogeo.fbx',
  'fafnirf5wizardgeo.fbx',
  'fafnirf6kolossalgeo.fbx',
  'fafnirf6miragespeedstormgeo.fbx',
  'fafnirmiragegeo.fbx',
  'fafnirwizardgeo.fbx',
  'genesisg5royalpremiumgeo.fbx',
  'heliosh6kolossalv2geo.fbx',
  'heliosh6miragegeo.fbx',
  'hyperionh6demisegeo.fbx',
  'hyperionh6speargeo.fbx',
  'hyperionh6superv2geo.fbx',
  'ifritorgeo.fbx',
  'kerbeusk5shieldgeo.fbx',
  'krakenk5shieldgeo.fbx',
  'leviathanl5tactgeo.fbx',
  'minoborosgeo.fbx',
  'pegasusp5harmonygeo_v2.fbx',
  'perfectphoenixgeo.fbx',
  'satombs6bravegeo.fbx',
  'spryzenlordgeo.fbx',
  'spryzenrequiemv2geo.fbx',
  'spryzens5geo.fbx',
  'spryzens6worldgeo.fbx',
  'valtryekbravegeo.fbx',
  'valtryekcho-zredgeo.fbx',
  'valtryekswordgeo.fbx',
  'valtryekv5uniongeo.fbx',
  'valtryekv6speargeo.fbx',
  'wyvern2geo_v2.fbx',
  'wyvernw6geo.fbx',
  'arenacolossus.fbx',
  'arenasquare.fbx',
  'arenastrike.fbx',
  'defaultarena.fbx',
  'arenaswitchstriketower.fbx',
  'acedragond5geo.fbx',
  'acedragond5premiumgeo.fbx',
  'achillesa4geov4.fbx',
  'achillesa4turbogeo.fbx',
  'achillesa5swordgeo.fbx',
  'achillesa8geo.fbx',
  'achillesripfiregeo.fbx',
  'anubion2geo.fbx',
  'anubiona6geo.fbx',
  'apocalypsea5cosmicgeo.fbx',
  'apocalypsecosmicpremiumgeo.fbx',
  'atomicsgeo_guarddraciel.fbx',
  'balderovb7geo_v3.fbx',
  'balkeshb5zonegeo.fbx',
  'balkeshb7geo.fbx',
  'cobrac5flaregeo.fbx',
  'cobrac7geo_v2.fbx',
  'cobrapoisongeo.fbx',
  'commanddragond5geo.fbx',
  'cyclopsc4geo.fbx',
  'cyclopsc5behemothgeo.fbx',
  'devolosd6abyssgeo.fbx',
  'devolosd6demisegeo.fbx',
  'devolosd6miragegeo.fbx',
  'dracielfgeo.fbx',
  'dracielsgeo.fbx',
  'dracielsguardgeo.fbx',
  'dragond8geo.fbx',
  'dragonmythgeo.fbx',
  'dranzerfcrystalgeo.fbx',
  'dranzerfgeo.fbx',
  'drigerfgeo2.fbx',
  'drigersphantomgeo.fbx',
  'dullahand6demisegeo.fbx',
  'dullahand6speargeo.fbx',
  'erasedevolosd5geo.fbx',
  'evovaltryekv7geo.fbx',
  'fafnirf5zonegeo.fbx',
  'fafnirf7geo.fbx',
  'forneusf4oceanusgeo.fbx',
  'forneusf5geo.fbx',
  'forneusripfiregeo.fbx',
  'genesisg5eclipsegeo.fbx',
  'glyphdragond5geo.fbx',
  'goldenjudgementdragond5geo.fbx',
  'goldenjudgementdragond5geo_virtualchampionship.fbx',
  'heliosh6evoblazebringergeo.fbx',
  'arena_beycosmicvectorbattle.fbx',
  'arena_beyinterstellardrop.fbx',
  'arena_billionthbattle.fbx',
  'arena_championshipclash.fbx',
  'arena_collisionnebula.fbx',
  'arena_crosscollision.fbx',
  'arena_extremechallenger.fbx',
  'arena_galaxyorbit.fbx',
  'arena_hypersphere.fbx',
  'arena_infinitybrink.fbx',
  'arena_lightignite.fbx',
  'arena_motorstrike.fbx',
  'arena_proseries.fbx',
  'arena_proseriesbattle.fbx',
  'arena_quaddrive.fbx',
  'arena_quadstrike.fbx',
  'arena_quadstrikecreature.fbx',
  'arena_quadstrikethunderedge.fbx',
  'arena_slingshock_green.fbx',
  'arena_speedstorm.fbx',
  'balkeshb5zonegeo2.fbx',
  'deadphoenixp4geov2.fbx',
  'fafnirf4geov2.fbx',
  'fafnirf6abyssgeo.fbx',
  'heliosh6evoworldgeo.fbx',
  'heliosh8geo.fbx',
  'heliosh8geo_v2.fbx',
  'helioskinggeo.fbx',
  'hyperionh6evoflamebringergeo.fbx',
  'hyperionh8geo.fbx',
  'hyperionsuperblackgeo.fbx',
  'hyperionsupergeo.fbx',
  'ifritori7destructiongeo.fbx',
  'ifritori7geo.fbx',
  'ifritori7geo_v2.fbx',
  'istrosi4geo.fbx',
  'joltcho-zgeo.fbx',
  'judgementjokerj5geo.fbx',
  'kerbeusk4gamestopgeo.fbx',
  'kerbeusk4geo.fbx',
  'kerbeusk4geo_v2.fbx',
  'kerbeusk5mastergeo.fbx',
  'kerbeusk8geo.fbx',
  'kerbeusk8geo_v2.fbx',
  'kiserkerbeus2geo.fbx',
  'kiserkerbeusgeo.fbx',
  'krakenk4geo.fbx',
  'krakenk5cosmicgeo.fbx',
  'lordhydraxgeo.fbx',
  'luinorl4geo.fbx',
  'luinorl4targetgeo.fbx',
  'luinorl5geo.fbx',
  'luinorl5soulgeo.fbx',
  'luinorl5wizardgeo.fbx',
  'luinorl6geo.fbx',
  'luinorl6kolossalgeo.fbx',
  'luinorl6miragegeo.fbx',
  'luinorl7geo.fbx',
  'luinorragegeo.fbx',
  'luinortactgeo.fbx',
  'luinorzweigeo.fbx',
  'minoborosm4geo.fbx',
  'minoborosm6geo.fbx',
  'optimusprimechipgeo.fbx',
  'optimusprimelayergeo.fbx',
  'pegasusharmonypremiumgeo.fbx',
  'pegasusp5glyphgeo.fbx',
  'perfectphoenixp4geo.fbx',
  'perfectphoenixp4proseriesgeo.fbx',
  'phoenixp7geo.fbx',
  'ripfireboostgeo.fbx',
  'ripfireextendgeo.fbx',
  'ripfireknucklegeo.fbx',
  'ripfirelimitedgeo.fbx',
  'ripfiremassivegeo.fbx',
  'ripfirepressgeo.fbx',
  'ripfirerevolvegeo.fbx',
  'ripfireunitegeo.fbx',
  'ripfirevariablegeo.fbx',
  'arena_substrike.fbx',
  'arena_triangle.fbx',
  'arena_verticaldrop.fbx',
  'arena_virtualchampionship.fbx',
  'arena_voltknockout.fbx',
  'arena_vortexclimb.fbx',
  'arena_waterfall.fbx',
  'phoenixp4perfectv2geo.fbx',
  'ripfireyardgeo.fbx',
  'rockdragond5geo.fbx',
  'roktavorqgeo.fbx',
  'roktavorqgeo_v3.fbx',
  'roktavorr5geo.fbx',
  'roktavorr6bravegeo.fbx',
  'roktavorr6glidegeo.fbx',
  'satombs6cursegeo.fbx',
  'satombs6demisegeo.fbx',
  'satombs6supergeo.fbx',
  'sprigganripfiregeo.fbx',
  'spryzens5duskgeo.fbx',
  'spryzens5lordgeo.fbx',
  'spryzens5lordpremiumgeo.fbx',
  'spryzens5lordproseriesgeo.fbx',
  'spryzens8geo.fbx',
  'sworddragond5geo.fbx',
  'towersgeo_crystaldranzer.fbx',
  'triumphdragond6geo.fbx',
  'valkyriefirstgeo.fbx',
  'valkyriegeo.fbx',
  'valkyrieripfiregeo.fbx',
  'valtryekrashadv7geo.fbx',
  'valtryekv5commandgeo.fbx',
  'valtryekv5cosmicgeo.fbx',
  'valtryekv5glyphgeo.fbx',
  'valtryekv5swordgeo.fbx',
  'valtryekv5swordpremiumgeo.fbx',
  'valtryekv6bravegeo.fbx',
  'vexdragond6geo.fbx',
  'zetasgeo_phantomdriger.fbx',
] as const

export type BeyPart = { role: 'Layer' | 'Disc' | 'Driver' | 'Blade' | 'Ratchet' | 'Bit'; name: string; src?: string; texture?: string }
export type CombinationStatus = 'verified' | 'complete-mesh' | 'layer-only'

export type Listing = {
  id: string
  name: string
  series: 'X' | 'Burst'
  class: 'Attack' | 'Defense' | 'Stamina' | 'Balance' | 'Arena' | 'Part'
  /**
   * @deprecated Legacy fantasy USD. Not a market value. Do not display as Oracle.
   * Use OracleValuation / fetchListingOracle via the Stage 1 asset map bridge.
   */
  price: number
  image: string
  model?: string
  texture?: string
  /** Body colour for meshes whose albedo lived in the Unity shader, not a map. */
  tint?: string
  creator: string
  edition: string
  accent: string
  /** The components this release is built from, top of the stack first. */
  parts?: BeyPart[]
  /** The exported mesh is a Burst layer that should be assembled with recovered parts. */
  assembly?: 'burst'
  /** The beast chip art printed on this release, when the export shipped it. */
  badge?: string
  /** Provenance of the displayed component combination. */
  combinationStatus?: CombinationStatus
  /** Whether the title/code/parts were checked against a release reference. */
  partsVerified?: boolean
  /** Human-readable provenance shown beside the viewer. */
  verificationSource?: string
}

const BEY = '/assets/game/beys'
const BC = '/assets/game/burst-chrome'
const M = '/assets/models'
/** Colour bey renders decoded from the X app's UI atlas. */
const XS = '/assets/game/x-sprites'
const XC = '/assets/game/x-chrome'

const OFFICIAL_X_SOURCE = 'https://beyblade.com/'
const COMPLETE_X_MODEL_FILES = new Set([
  'x_529279_bite_croc_3_60lf.fbx',
  'x_arrow_wizard_4_60_n.fbx',
  'x_arrow_wizard_4_80b_st.fbx',
  'x_bx14_shark_edge_3_60lf.fbx',
  'x_bxg01_dranzer_spiral_3_80t_green.fbx',
  'x_bxg01_dranzer_spiral_3_80t_red.fbx',
  'x_bx_org01_samurai_steel_4_80t.fbx',
  'x_bx_org05_shinobi_knife_4_80hn.fbx',
  'x_bx_org08_mammo_tusk_3_60t.fbx',
  'x_digital_beyblade.fbx',
  'x_keel_shark_3_80_f.fbx',
  'x_keel_shark_3_80_f_st.fbx',
  'x_soar_phoenix_9_60gf_st.fbx',
  'x_steel_samurai_4_80t_st.fbx',
  'x_sword_dran_3_60_f.fbx',
  'x_tail_viber_3_80hn_rdrc.fbx',
])
const KNOWN_INCOMPLETE_MODEL_FILES = new Set([
  'arc_wizard.fbx',
  'cobalt_dragoon.fbx',
  'courage_dran.fbx',
  'dark_perseus.fbx',
  'reaper_incendio.fbx',
])
const VERIFIED_X_RELEASES: Record<string, { name: string; model?: string; image?: string }> = {
  'bx-001': { name: 'Sword Dran 3-60F', image: `${BEY}/BX17_DranSword_3-60f.png` },
  'bx-002': { name: 'Dagger Dran 4-60R', image: `${XS}/DaggerDran_Product.png` },
  'bx-003': { name: 'Soar Phoenix 9-60GF', image: `${BEY}/BX023_PhoenixWing_9-60gf.png` },
  'bx-004': { name: 'Cobalt Dragoon 2-60C', image: `${BEY}/BX34_CobaltDragoon2-60c.png` },
  'bx-006': { name: 'Horn Rhino 3-80S', image: `${BEY}/BX19_RinoHorn_3-80S.png` },
  'bx-013': { name: 'Helm Knight 3-80N', image: `${BEY}/BX04_KnightShield3-80n.png` },
  'bx-020': { name: 'Tusk Mammoth 3-60T', image: `${BEY}/BXORG08_MammoTusk_3-60_t.png` },
  'bx-022': { name: 'Lance Knight 4-80HN', image: `${BEY}/BX13_KnightLance_4-80hn.png` },
  'bx-023': { name: 'Knife Shinobi 4-80HN', image: `${BEY}/BXORG05_ShinobiKnife_4-80_hn.png` },
  'bx-024': { name: 'Dranzer Spiral 3-80T', image: `${BEY}/BXG01_DranzerSpiral_3-80t_green.png` },
  'bx-209': { name: 'Steel Samurai 4-80T', image: `${M}/BXORG01_SamuraiSteel_4-80_t.png` },
}

/** Featured beys on the landing grid — same ids the lab deep-links. */
export const FEATURED_BEY_IDS = ['bx-002', 'bx-014', 'bx-006', 'bx-013', 'bx-005', 'bx-012'] as const

export function listingById(id: string) {
  return marketplaceListings.find((item) => item.id === id)
}

/** Excludes extracted UI meshes and standalone parts from the Bey catalogue. */
export function isWholeBeyListing(item: Listing) {
  if (!item.model || item.class === 'Arena') return false
  if (item.assembly === 'burst' && item.parts?.length === 3) return true
  const file = item.model.split('/').pop() ?? ''
  if (KNOWN_INCOMPLETE_MODEL_FILES.has(file)) return false
  if (file.toLowerCase().startsWith('x_') && !COMPLETE_X_MODEL_FILES.has(file)) return false
  return !/(?:_blade_(?:chip|layer|ring)|_ratchet_ui|_bit_ui|(?:blade|layer|ring|chip|ratchet ui|bit ui))/i.test(`${file} ${item.name}`)
}

/** Product / poster art for cards. Prefers validated map poster; x-sprites product shots stay valid. */
export function productRenderFor(item: Listing) {
  if (/\/game\/x-sprites\//i.test(item.image)) return item.image
  return undefined
}

/** Fallback images only - cards prefer live 3D when `model` is set. */
export const marketplaceListings: Listing[] = [
  // X series - recovered FBX from APK
  { id: 'bx-001', name: 'Dran Sword 3-60F', series: 'X', class: 'Attack', price: 2.4, image: `${BEY}/BX17_DranSword_3-60f.png`, model: `${M}/x_sword_dran_3_60_f.fbx`, tint: '#d12f1f', creator: 'X Archive', edition: '01 / 100', accent: '#d12f1f' },
  { id: 'bx-002', name: 'Dagger Dran 4-60R', series: 'X', class: 'Attack', price: 1.92, image: `${XS}/DaggerDran_Product.png`, model: `${M}/dagger_dran.fbx`, tint: '#139ade', creator: 'X Archive', edition: '16 / 80', accent: '#139ade' },
  { id: 'bx-003', name: 'Soar Phoenix 9-60GF', series: 'X', class: 'Balance', price: 3.75, image: `${BEY}/BX023_PhoenixWing_9-60gf.png`, model: `${M}/x_soar_phoenix_9_60gf_st.fbx`, tint: '#df0719', creator: 'Phoenix Lab', edition: '02 / 25', accent: '#df0719' },
  { id: 'bx-004', name: 'Cobalt Dragoon 2-60C', series: 'X', class: 'Attack', price: 4.2, image: `${BEY}/BX34_CobaltDragoon2-60c.png`, model: `${M}/cobalt_dragoon.fbx`, tint: '#42aec8', creator: 'Rare Bey Club', edition: '01 / 15', accent: '#42aec8' },
  { id: 'bx-005', name: 'Tail Viper 5-80O', series: 'X', class: 'Stamina', price: 1.45, image: `${XS}/TailViper.png`, model: `${M}/tail_viper.fbx`, tint: '#0583d1', creator: 'X Archive', edition: '32 / 120', accent: '#0583d1' },
  { id: 'bx-006', name: 'Horn Rhino 3-80S', series: 'X', class: 'Defense', price: 1.7, image: `${XS}/HornRhino_Product.png`, model: `${M}/horn_rhino.fbx`, tint: '#7b30a6', creator: 'Beylocker', edition: '07 / 60', accent: '#7b30a6' },
  { id: 'bx-007', name: 'Courage Dran S6-60V', series: 'X', class: 'Attack', price: 2.85, image: `${BEY}/BX01_DranSword_3-60f.png`, model: `${M}/courage_dran.fbx`, tint: '#0e96d8', creator: 'X Archive', edition: '05 / 40', accent: '#0e96d8' },
  { id: 'bx-008', name: 'Reaper Incendio T4-70K', series: 'X', class: 'Attack', price: 2.55, image: `${BEY}/CX05_HellsReaperT_4-70k.png`, model: `${M}/reaper_incendio.fbx`, tint: '#eeb330', creator: 'X Archive', edition: '11 / 55', accent: '#eeb330' },
  { id: 'bx-009', name: 'Arc Wizard R4-55LO', series: 'X', class: 'Balance', price: 2.1, image: `${BEY}/CX02_WizardArcR_4-55lo.png`, model: `${M}/arc_wizard.fbx`, tint: '#fadb29', creator: 'X Archive', edition: '19 / 70', accent: '#fadb29' },
  { id: 'bx-010', name: 'Dark Perseus B6-80W', series: 'X', class: 'Defense', price: 3.05, image: `${BEY}/CX03_PerseusDarkB_6-80w.png`, model: `${M}/dark_perseus.fbx`, tint: '#40bdc7', creator: 'Rare Bey Club', edition: '04 / 30', accent: '#40bdc7' },
  { id: 'bx-011', name: 'Keel Shark 3-60LF', series: 'X', class: 'Attack', price: 1.68, image: `${BEY}/BX14_SharkEdge_3-60lf.png`, model: `${M}/keel_shark.fbx`, tint: '#55cec9', creator: 'X Archive', edition: '18 / 90', accent: '#55cec9' },
  { id: 'bx-012', name: 'Yell Kong 3-60GB', series: 'X', class: 'Attack', price: 1.55, image: `${XS}/YellKong.png`, model: `${M}/yell_kong.fbx`, tint: '#10c660', creator: 'X Archive', edition: '24 / 100', accent: '#10c660' },
  { id: 'bx-013', name: 'Helm Knight 3-80N', series: 'X', class: 'Defense', price: 1.82, image: `${XS}/HelmKnightgreen.png`, model: `${M}/helm_knight.fbx`, tint: '#14c283', creator: 'X Archive', edition: '13 / 70', accent: '#14c283' },
  { id: 'bx-014', name: 'Scythe Incendio 4-60T', series: 'X', class: 'Attack', price: 2.05, image: `${XS}/ScytheIncendioFull.png`, model: `${M}/scythe_incendio.fbx`, creator: 'X Archive', edition: '09 / 55', accent: '#ff5520' },
  { id: 'bx-015', name: 'Chain Incendio 5-60HT', series: 'X', class: 'Balance', price: 1.95, image: `${XS}/ChainIncendio_567.png`, model: `${M}/chain_incendio.fbx`, tint: '#d7081f', creator: 'X Archive', edition: '15 / 80', accent: '#d7081f' },
  { id: 'bx-016', name: 'Talon Ptera 3-80B', series: 'X', class: 'Attack', price: 1.78, image: `${XS}/TalonPteraorange.png`, model: `${M}/talon_ptera.fbx`, tint: '#4dbcef', creator: 'X Archive', edition: '21 / 95', accent: '#4dbcef' },
  { id: 'bx-017', name: 'Savage Bear 3-60S', series: 'X', class: 'Defense', price: 1.88, image: `${BEY}/BXORG04_BearScratch_3-60_s.png`, model: `${M}/savage_bear.fbx`, tint: '#5fc3da', creator: 'X Archive', edition: '10 / 65', accent: '#5fc3da' },
  { id: 'bx-018', name: 'Roar Tyrano 9-60GF', series: 'X', class: 'Attack', price: 2.35, image: `${BEY}/BXORG03_TyrannoRoar_9-60_gf.png`, model: `${M}/roar_tyrano.fbx`, tint: '#ed8336', creator: 'X Archive', edition: '06 / 45', accent: '#ed8336' },
  { id: 'bx-019', name: 'Bite Croc 3-60LF', series: 'X', class: 'Attack', price: 1.62, image: `${BEY}/BXORG06_CrocCrunch_3-60_lf.png`, model: `${M}/bite_croc.fbx`, tint: '#1bb5c1', creator: 'X Archive', edition: '27 / 110', accent: '#1bb5c1' },
  { id: 'bx-020', name: 'Mammo Tusk 3-60T', series: 'X', class: 'Defense', price: 2.15, image: `${XS}/TuskMammoth.png`, model: `${M}/x_bx_org08_mammo_tusk_3_60t.fbx`, tint: '#edd550', creator: 'X Archive', edition: '08 / 50', accent: '#edd550' },
  { id: 'bx-021', name: 'Gale Wyvern 5-80GB', series: 'X', class: 'Stamina', price: 1.98, image: `${BEY}/BX24_WyvernGale_5-80gb.png`, model: `${M}/gale_wyvern.fbx`, tint: '#dce458', creator: 'X Archive', edition: '12 / 75', accent: '#dce458' },
  { id: 'bx-022', name: 'Lance Knight 4-80HN', series: 'X', class: 'Defense', price: 1.74, image: `${XS}/LanceKnight_1954.png`, model: `${M}/lance_knight.fbx`, tint: '#adcc10', creator: 'X Archive', edition: '20 / 85', accent: '#adcc10' },
  { id: 'bx-023', name: 'Shinobi Knife 4-80HN', series: 'X', class: 'Attack', price: 1.86, image: `${BEY}/BXORG05_ShinobiKnife_4-80_hn.png`, model: `${M}/x_bx_org05_shinobi_knife_4_80hn.fbx`, tint: '#067bd0', creator: 'X Archive', edition: '17 / 80', accent: '#067bd0' },
  { id: 'bx-024', name: 'Dranzer Spiral', series: 'X', class: 'Balance', price: 3.4, image: `${BEY}/BXG01_DranzerSpiral_3-80t_green.png`, model: `${M}/x_bxg01_dranzer_spiral_3_80t_green.fbx`, tint: '#05d1bd', creator: 'Rare Bey Club', edition: '03 / 25', accent: '#05d1bd' },

  // Burst series - recovered OBJ layers
  { id: 'bb-019', name: 'Sky Clash Stadium', series: 'Burst', class: 'Arena', price: 5.8, image: `${BC}/ArenaThumb_QuadstrikeThunderEdge.png`, model: `${M}/Arena_SkyClash.obj`, texture: `${M}/Arena_SkyClash_Color.png`, creator: 'WBBA Works', edition: '03 / 20', accent: '#35d4ff' },
  { id: 'bb-020', name: 'Main Stadium', series: 'Burst', class: 'Arena', price: 4.1, image: `${BC}/ArenaThumb_Quadstrike.png`, model: `${M}/Arena_Main.obj`, creator: 'WBBA Works', edition: '08 / 40', accent: '#00e0ba' },

  // Upload-folder batch - curated named layers/arenas
  { id: 'bb-101', name: 'Union Achilles A5 (Premium)', series: 'Burst', class: 'Balance', price: 2.17, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/achillesa5unionpremiumgeo.fbx`, creator: 'WBBA Works', edition: '24 / 102', accent: '#caff00' },
  { id: 'bb-102', name: 'Infinite Achilles A6', series: 'Burst', class: 'Attack', price: 1.88, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/achillesa6infinitegeo.fbx`, creator: 'WBBA Works', edition: '26 / 169', accent: '#ff4b45' },
  { id: 'bb-103', name: 'Origin Achilles A6', series: 'Burst', class: 'Attack', price: 2.01, image: `${BC}/battle_menu_toy_battle_imagery.png`, model: `${M}/achillesa6origingeo.fbx`, creator: 'WBBA Works', edition: '25 / 115', accent: '#ff583d' },
  { id: 'bb-104', name: 'Cho-Z Achilles (Black)', series: 'Burst', class: 'Attack', price: 1.77, image: `${BC}/ArenaThumb_QuadstrikeCreature.png`, model: `${M}/achilliescho-zgeo.fbx`, creator: 'WBBA Works', edition: '07 / 138', accent: '#2a8cff' },
  { id: 'bb-105', name: 'Infinite Achilles (Pro)', series: 'Burst', class: 'Attack', price: 1.81, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/achillesinfinitegeo.fbx`, creator: 'WBBA Works', edition: '37 / 146', accent: '#8b65ff' },
  { id: 'bb-106', name: 'Union Achilles (Pro)', series: 'Burst', class: 'Balance', price: 2.37, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/achillesunionprogeo.fbx`, creator: 'WBBA Works', edition: '05 / 149', accent: '#f0aa21' },
  { id: 'bb-107', name: 'Prime Apocalypse A5', series: 'Burst', class: 'Attack', price: 2.15, image: `${BC}/battle_menu_toy_battle_imagery.png`, model: `${M}/apocalypsea5primegeov2.fbx`, creator: 'Burst Vault', edition: '16 / 53', accent: '#b8ff2e' },
  { id: 'bb-109', name: 'Erase Balkesh B5', series: 'Burst', class: 'Attack', price: 2.09, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/balkeshb5erasegeo.fbx`, creator: 'Burst Vault', edition: '15 / 51', accent: '#6ecbff' },
  { id: 'bb-110', name: 'Soul Balkesh (Pro)', series: 'Burst', class: 'Attack', price: 2.13, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/balkeshsoulgeo.fbx`, creator: 'Burst Vault', edition: '03 / 129', accent: '#5a4dff' },
  { id: 'bb-111', name: 'Bushin Ashindra A5 (ReDeco)', series: 'Burst', class: 'Attack', price: 1.96, image: `${BC}/battle_menu_toy_battle_imagery.png`, model: `${M}/bushinashindraa5geov2.fbx`, creator: 'Burst Vault', edition: '34 / 111', accent: '#1ec8ff' },
  { id: 'bb-112', name: 'Poison Cyclops C5', series: 'Burst', class: 'Attack', price: 2.25, image: `${BC}/ArenaThumb_QuadstrikeCreature.png`, model: `${M}/cyclopsc5poisongeo.fbx`, creator: 'Burst Vault', edition: '08 / 145', accent: '#ff9a1a' },
  { id: 'bb-113', name: 'Deathscyther 2', series: 'Burst', class: 'Attack', price: 2.36, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/deathscyther2geo.fbx`, creator: 'Burst Vault', edition: '18 / 147', accent: '#c0c8d4' },
  { id: 'bb-114', name: 'Epic Evipero', series: 'Burst', class: 'Attack', price: 2.05, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/epiceviperogeo.fbx`, creator: 'Burst Vault', edition: '06 / 139', accent: '#ff5520' },
  { id: 'bb-115', name: 'Evipero', series: 'Burst', class: 'Attack', price: 2.13, image: `${BC}/battle_menu_toy_battle_imagery.png`, model: `${M}/eviperogeo.fbx`, creator: 'Burst Vault', edition: '19 / 141', accent: '#7ad0ff' },
  { id: 'bb-116', name: 'Wizard Fafnir F5', series: 'Burst', class: 'Stamina', price: 1.81, image: `${BC}/ArenaThumb_QuadstrikeCreature.png`, model: `${M}/fafnirf5wizardgeo.fbx`, creator: 'Burst Vault', edition: '08 / 160', accent: '#c4783a' },
  { id: 'bb-117', name: 'Kolossal Fafnir F6', series: 'Burst', class: 'Stamina', price: 2.09, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/fafnirf6kolossalgeo.fbx`, creator: 'Burst Vault', edition: '23 / 122', accent: '#5dff7a' },
  { id: 'bb-118', name: 'Mirage Fafnir F6 (SpeedStorm)', series: 'Burst', class: 'Stamina', price: 2.21, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/fafnirf6miragespeedstormgeo.fbx`, creator: 'Burst Vault', edition: '12 / 123', accent: '#3dbf6a' },
  { id: 'bb-119', name: 'Mirage Fafnir (Pro)', series: 'Burst', class: 'Stamina', price: 2.07, image: `${BC}/battle_menu_toy_battle_imagery.png`, model: `${M}/fafnirmiragegeo.fbx`, creator: 'Burst Vault', edition: '29 / 57', accent: '#d4a056' },
  { id: 'bb-120', name: 'Wizard Fafnir (Pro)', series: 'Burst', class: 'Stamina', price: 2.27, image: `${BC}/ArenaThumb_QuadstrikeCreature.png`, model: `${M}/fafnirwizardgeo.fbx`, creator: 'Burst Vault', edition: '34 / 171', accent: '#56d4ff' },
  { id: 'bb-122', name: 'Royal Genesis G5 (Premium)', series: 'Burst', class: 'Attack', price: 2.04, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/genesisg5royalpremiumgeo.fbx`, creator: 'Burst Vault', edition: '03 / 110', accent: '#7a5cff' },
  { id: 'bb-123', name: 'King Helios H6', series: 'Burst', class: 'Attack', price: 2.13, image: `${BC}/battle_menu_toy_battle_imagery.png`, model: `${M}/heliosh6kolossalv2geo.fbx`, creator: 'Burst Vault', edition: '20 / 73', accent: '#00c8ff' },
  { id: 'bb-124', name: 'Mirage Helios H6', series: 'Burst', class: 'Attack', price: 2.28, image: `${BC}/ArenaThumb_QuadstrikeCreature.png`, model: `${M}/heliosh6miragegeo.fbx`, creator: 'Burst Vault', edition: '34 / 158', accent: '#ffd84f' },
  { id: 'bb-125', name: 'Demise Hyperion H6', series: 'Burst', class: 'Attack', price: 1.83, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/hyperionh6demisegeo.fbx`, creator: 'Burst Vault', edition: '28 / 170', accent: '#ff4f6a' },
  { id: 'bb-126', name: 'Spear Hyperion H6', series: 'Burst', class: 'Attack', price: 2.04, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/hyperionh6speargeo.fbx`, creator: 'Burst Vault', edition: '13 / 139', accent: '#ff3d61' },
  { id: 'bb-127', name: 'Super Hyperion H6', series: 'Burst', class: 'Attack', price: 1.93, image: `${BC}/battle_menu_toy_battle_imagery.png`, model: `${M}/hyperionh6superv2geo.fbx`, creator: 'Burst Vault', edition: '19 / 71', accent: '#35d4ff' },
  { id: 'bb-128', name: 'Ifritor', series: 'Burst', class: 'Attack', price: 1.99, image: `${BC}/ArenaThumb_QuadstrikeCreature.png`, model: `${M}/ifritorgeo.fbx`, creator: 'Burst Vault', edition: '32 / 137', accent: '#ffa23a' },
  { id: 'bb-129', name: 'Shield Kerbeus K5', series: 'Burst', class: 'Defense', price: 1.92, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/kerbeusk5shieldgeo.fbx`, creator: 'Burst Vault', edition: '23 / 168', accent: '#bb67ff' },
  { id: 'bb-130', name: 'Shield Kraken K5', series: 'Burst', class: 'Defense', price: 2.01, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/krakenk5shieldgeo.fbx`, creator: 'Burst Vault', edition: '32 / 119', accent: '#ffe066' },
  { id: 'bb-132', name: 'Tact Leviathan L5', series: 'Burst', class: 'Attack', price: 1.94, image: `${BC}/ArenaThumb_QuadstrikeCreature.png`, model: `${M}/leviathanl5tactgeo.fbx`, creator: 'Burst Vault', edition: '27 / 66', accent: '#ff5a7a' },
  { id: 'bb-133', name: 'Minoboros', series: 'Burst', class: 'Attack', price: 2.05, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/minoborosgeo.fbx`, creator: 'Burst Vault', edition: '06 / 135', accent: '#8a9aaa' },
  { id: 'bb-134', name: 'Harmony Pegasus P5', series: 'Burst', class: 'Balance', price: 2.43, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/pegasusp5harmonygeo_v2.fbx`, creator: 'Burst Vault', edition: '30 / 156', accent: '#ff6b4a' },
  { id: 'bb-135', name: 'Perfect Phoenix', series: 'Burst', class: 'Attack', price: 2.17, image: `${BC}/battle_menu_toy_battle_imagery.png`, model: `${M}/perfectphoenixgeo.fbx`, creator: 'Burst Vault', edition: '28 / 125', accent: '#00e0a8' },
  { id: 'bb-136', name: 'Brave Satomb S6', series: 'Burst', class: 'Attack', price: 1.86, image: `${BC}/ArenaThumb_QuadstrikeCreature.png`, model: `${M}/satombs6bravegeo.fbx`, creator: 'Burst Vault', edition: '16 / 128', accent: '#ffd04a' },
  { id: 'bb-138', name: 'Lord Spryzen', series: 'Burst', class: 'Attack', price: 2.24, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/spryzenlordgeo.fbx`, creator: 'Burst Vault', edition: '07 / 131', accent: '#ff4040' },
  { id: 'bb-139', name: 'Spryzen Requiem', series: 'Burst', class: 'Attack', price: 2.8, image: `${BC}/battle_menu_toy_battle_imagery.png`, model: `${M}/spryzenrequiemv2geo.fbx`, creator: 'Burst Vault', edition: '15 / 169', accent: '#ff8a2b' },
  { id: 'bb-140', name: 'Spryzen Requiem S5', series: 'Burst', class: 'Attack', price: 2.0, image: `${BC}/ArenaThumb_QuadstrikeCreature.png`, model: `${M}/spryzens5geo.fbx`, creator: 'Burst Vault', edition: '09 / 80', accent: '#6ad0ff' },
  { id: 'bb-141', name: 'World Spryzen S6', series: 'Burst', class: 'Stamina', price: 1.93, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/spryzens6worldgeo.fbx`, creator: 'Burst Vault', edition: '21 / 152', accent: '#caff00' },
  { id: 'bb-142', name: 'Brave Valtryek', series: 'Burst', class: 'Attack', price: 1.71, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/valtryekbravegeo.fbx`, creator: 'WBBA Works', edition: '27 / 108', accent: '#ff4b45' },
  { id: 'bb-143', name: 'Cho-Z Valtryek (Red)', series: 'Burst', class: 'Attack', price: 2.68, image: `${BC}/battle_menu_toy_battle_imagery.png`, model: `${M}/valtryekcho-zredgeo.fbx`, creator: 'WBBA Works', edition: '18 / 178', accent: '#ff583d' },
  { id: 'bb-144', name: 'Sword Valtryek', series: 'Burst', class: 'Attack', price: 2.15, image: `${BC}/ArenaThumb_QuadstrikeCreature.png`, model: `${M}/valtryekswordgeo.fbx`, creator: 'WBBA Works', edition: '14 / 103', accent: '#2a8cff' },
  { id: 'bb-145', name: 'Union Valtryek V5', series: 'Burst', class: 'Balance', price: 2.12, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/valtryekv5uniongeo.fbx`, creator: 'WBBA Works', edition: '39 / 132', accent: '#8b65ff' },
  { id: 'bb-146', name: 'Spear Valtryek V6', series: 'Burst', class: 'Attack', price: 1.75, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/valtryekv6speargeo.fbx`, creator: 'WBBA Works', edition: '03 / 76', accent: '#f0aa21' },
  { id: 'bb-147', name: 'Wyvern 2', series: 'Burst', class: 'Attack', price: 1.93, image: `${BC}/battle_menu_toy_battle_imagery.png`, model: `${M}/wyvern2geo_v2.fbx`, creator: 'Burst Vault', edition: '14 / 122', accent: '#b8ff2e' },
  { id: 'bb-148', name: 'Wyvern W6', series: 'Burst', class: 'Attack', price: 2.01, image: `${BC}/ArenaThumb_QuadstrikeCreature.png`, model: `${M}/wyvernw6geo.fbx`, creator: 'Burst Vault', edition: '09 / 55', accent: '#ff6a2b' },
  { id: 'bx-149', name: 'Arena Colossus', series: 'X', class: 'Arena', price: 1.48, image: `${BEY}/BX01_DranSword_3-60f.png`, model: `${M}/arenacolossus.fbx`, creator: 'Stadium Works', edition: '03 / 73', accent: '#6ecbff' },
  { id: 'bx-150', name: 'Arena Square', series: 'X', class: 'Arena', price: 1.99, image: `${XC}/bg-waiting-01.png`, model: `${M}/arenasquare.fbx`, creator: 'Stadium Works', edition: '03 / 128', accent: '#5a4dff' },
  { id: 'bx-151', name: 'Arena Strike', series: 'X', class: 'Arena', price: 1.37, image: `${XC}/bg-waiting-01.png`, model: `${M}/arenastrike.fbx`, creator: 'Stadium Works', edition: '30 / 77', accent: '#1ec8ff' },
  { id: 'bx-152', name: 'Default Arena', series: 'X', class: 'Arena', price: 1.23, image: `${XC}/bg-waiting-01.png`, model: `${M}/defaultarena.fbx`, creator: 'Stadium Works', edition: '26 / 178', accent: '#ff9a1a' },
  { id: 'bx-153', name: 'Switch Strike Tower', series: 'X', class: 'Arena', price: 1.63, image: `${XC}/bg-waiting-01.png`, model: `${M}/arenaswitchstriketower.fbx`, creator: 'Stadium Works', edition: '06 / 81', accent: '#c0c8d4' },
  { id: 'bb-200', name: 'Ace Dragon D5', series: 'Burst', class: 'Attack', price: 1.1, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/acedragond5geo.fbx`, creator: 'Burst Vault', edition: '01 / 60', accent: '#ff4f6a' },
  { id: 'bb-202', name: 'Ace Dragon D5 (Premium)', series: 'Burst', class: 'Stamina', price: 1.46, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/acedragond5premiumgeo.fbx`, creator: 'X Archive', edition: '03 / 100', accent: '#ffa23a' },
  { id: 'bb-204', name: 'Achilles A4', series: 'Burst', class: 'Attack', price: 1.82, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/achillesa4geov4.fbx`, creator: 'Phoenix Lab', edition: '05 / 140', accent: '#8b65ff' },
  { id: 'bb-205', name: 'Turbo Achilles A4', series: 'Burst', class: 'Defense', price: 2, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/achillesa4turbogeo.fbx`, creator: 'Beylocker', edition: '06 / 160', accent: '#caff00' },
  { id: 'bb-207', name: 'Sword Achilles A5', series: 'Burst', class: 'Balance', price: 2.36, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/achillesa5swordgeo.fbx`, creator: 'WBBA Works', edition: '08 / 200', accent: '#2a8cff' },
  { id: 'bb-208', name: 'Achilles A8', series: 'Burst', class: 'Attack', price: 2.54, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/achillesa8geo.fbx`, creator: 'X Archive', edition: '09 / 220', accent: '#00c8ff' },
  { id: 'bb-210', name: 'Achilles Ripfire', series: 'Burst', class: 'Stamina', price: 2.9, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/achillesripfiregeo.fbx`, creator: 'Phoenix Lab', edition: '11 / 80', accent: '#5dff7a' },
  { id: 'bb-211', name: 'Anubion 2', series: 'Burst', class: 'Balance', price: 1.1, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/anubion2geo.fbx`, creator: 'Beylocker', edition: '12 / 100', accent: '#f0aa21' },
  { id: 'bb-212', name: 'Anubion A6', series: 'Burst', class: 'Attack', price: 1.28, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/anubiona6geo.fbx`, creator: 'Burst Vault', edition: '13 / 120', accent: '#ff4f6a' },
  { id: 'bb-213', name: 'Cosmic Apocalypse A5', series: 'Burst', class: 'Defense', price: 1.46, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/apocalypsea5cosmicgeo.fbx`, creator: 'WBBA Works', edition: '14 / 140', accent: '#35d4ff' },
  { id: 'bb-214', name: 'Cosmic Apocalypse (Premium)', series: 'Burst', class: 'Stamina', price: 1.64, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/apocalypsecosmicpremiumgeo.fbx`, creator: 'X Archive', edition: '15 / 160', accent: '#ffa23a' },
  { id: 'bb-216', name: 'Balderov B7', series: 'Burst', class: 'Attack', price: 2, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/balderovb7geo_v3.fbx`, creator: 'Phoenix Lab', edition: '17 / 200', accent: '#8b65ff' },
  { id: 'bb-217', name: 'Zone Balkesh B5', series: 'Burst', class: 'Defense', price: 2.18, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/balkeshb5zonegeo.fbx`, creator: 'Beylocker', edition: '18 / 220', accent: '#caff00' },
  { id: 'bb-219', name: 'Balkesh B7', series: 'Burst', class: 'Balance', price: 2.54, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/balkeshb7geo.fbx`, creator: 'WBBA Works', edition: '20 / 80', accent: '#2a8cff' },
  { id: 'bb-221', name: 'Flare Cobra C5', series: 'Burst', class: 'Defense', price: 2.9, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/cobrac5flaregeo.fbx`, creator: 'Rare Bey Club', edition: '22 / 120', accent: '#ff3d61' },
  { id: 'bb-222', name: 'Cobra C7', series: 'Burst', class: 'Stamina', price: 1.1, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/cobrac7geo_v2.fbx`, creator: 'Phoenix Lab', edition: '23 / 140', accent: '#5dff7a' },
  { id: 'bb-223', name: 'Poison Cobra', series: 'Burst', class: 'Balance', price: 1.28, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/cobrapoisongeo.fbx`, creator: 'Beylocker', edition: '24 / 160', accent: '#f0aa21' },
  { id: 'bb-224', name: 'Command Dragon D5', series: 'Burst', class: 'Attack', price: 1.46, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/commanddragond5geo.fbx`, creator: 'Burst Vault', edition: '25 / 180', accent: '#ff4f6a' },
  { id: 'bb-225', name: 'Cyclops C4', series: 'Burst', class: 'Defense', price: 1.64, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/cyclopsc4geo.fbx`, creator: 'WBBA Works', edition: '26 / 200', accent: '#35d4ff' },
  { id: 'bb-226', name: 'Behemoth Cyclops C5', series: 'Burst', class: 'Stamina', price: 1.82, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/cyclopsc5behemothgeo.fbx`, creator: 'X Archive', edition: '27 / 220', accent: '#ffa23a' },
  { id: 'bb-228', name: 'Abyss Devolos D6', series: 'Burst', class: 'Attack', price: 2.18, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/devolosd6abyssgeo.fbx`, creator: 'Phoenix Lab', edition: '29 / 80', accent: '#8b65ff' },
  { id: 'bb-229', name: 'Demise Devolos D6', series: 'Burst', class: 'Defense', price: 2.36, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/devolosd6demisegeo.fbx`, creator: 'Beylocker', edition: '30 / 100', accent: '#caff00' },
  { id: 'bb-230', name: 'Mirage Devolos D6', series: 'Burst', class: 'Stamina', price: 2.54, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/devolosd6miragegeo.fbx`, creator: 'Burst Vault', edition: '31 / 120', accent: '#ff583d' },
  { id: 'bb-231', name: 'Draciel F', series: 'Burst', class: 'Balance', price: 2.72, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/dracielfgeo.fbx`, creator: 'WBBA Works', edition: '32 / 140', accent: '#2a8cff' },
  { id: 'bb-232', name: 'Draciel S', series: 'Burst', class: 'Attack', price: 2.9, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/dracielsgeo.fbx`, creator: 'X Archive', edition: '33 / 160', accent: '#00c8ff' },
  { id: 'bb-233', name: 'Draciel S Guard', series: 'Burst', class: 'Defense', price: 1.1, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/dracielsguardgeo.fbx`, creator: 'Rare Bey Club', edition: '34 / 180', accent: '#ff3d61' },
  { id: 'bb-235', name: 'Dragon D8', series: 'Burst', class: 'Balance', price: 1.46, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/dragond8geo.fbx`, creator: 'Beylocker', edition: '36 / 220', accent: '#f0aa21' },
  { id: 'bb-237', name: 'Dragon Myth', series: 'Burst', class: 'Defense', price: 1.82, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/dragonmythgeo.fbx`, creator: 'WBBA Works', edition: '38 / 80', accent: '#35d4ff' },
  { id: 'bb-238', name: 'Dranzer F Crystal', series: 'X', class: 'Stamina', price: 2, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/dranzerfcrystalgeo.fbx`, creator: 'X Archive', edition: '39 / 100', accent: '#ffa23a' },
  { id: 'bb-239', name: 'Dranzer F', series: 'X', class: 'Balance', price: 2.18, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/dranzerfgeo.fbx`, creator: 'Rare Bey Club', edition: '40 / 120', accent: '#ffd84f' },
  { id: 'bb-240', name: 'Driger F', series: 'Burst', class: 'Attack', price: 2.36, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/drigerfgeo2.fbx`, creator: 'Phoenix Lab', edition: '01 / 140', accent: '#8b65ff' },
  { id: 'bb-241', name: 'Driger S Phantom', series: 'Burst', class: 'Defense', price: 2.54, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/drigersphantomgeo.fbx`, creator: 'Beylocker', edition: '02 / 160', accent: '#caff00' },
  { id: 'bb-242', name: 'Demise Dullahan D6', series: 'Burst', class: 'Stamina', price: 2.72, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/dullahand6demisegeo.fbx`, creator: 'Burst Vault', edition: '03 / 180', accent: '#ff583d' },
  { id: 'bb-243', name: 'Spear Dullahan D6', series: 'Burst', class: 'Balance', price: 2.9, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/dullahand6speargeo.fbx`, creator: 'WBBA Works', edition: '04 / 200', accent: '#2a8cff' },
  { id: 'bb-244', name: 'Erase Devolos D5', series: 'Burst', class: 'Attack', price: 1.1, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/erasedevolosd5geo.fbx`, creator: 'X Archive', edition: '05 / 220', accent: '#00c8ff' },
  { id: 'bb-245', name: 'Evo Valtryek', series: 'Burst', class: 'Defense', price: 1.28, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/evovaltryekv7geo.fbx`, creator: 'Rare Bey Club', edition: '06 / 60', accent: '#ff3d61' },
  { id: 'bb-248', name: 'Zone Fafnir F5', series: 'Burst', class: 'Attack', price: 1.82, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/fafnirf5zonegeo.fbx`, creator: 'Burst Vault', edition: '09 / 120', accent: '#ff4f6a' },
  { id: 'bb-250', name: 'Fafnir F7', series: 'Burst', class: 'Stamina', price: 2.18, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/fafnirf7geo.fbx`, creator: 'X Archive', edition: '11 / 160', accent: '#ffa23a' },
  { id: 'bb-252', name: 'Oceanus Forneus F4', series: 'Burst', class: 'Attack', price: 2.54, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/forneusf4oceanusgeo.fbx`, creator: 'Phoenix Lab', edition: '13 / 200', accent: '#8b65ff' },
  { id: 'bb-253', name: 'Forneus F5', series: 'Burst', class: 'Defense', price: 2.72, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/forneusf5geo.fbx`, creator: 'Beylocker', edition: '14 / 220', accent: '#caff00' },
  { id: 'bb-254', name: 'Forneus Ripfire', series: 'Burst', class: 'Stamina', price: 2.9, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/forneusripfiregeo.fbx`, creator: 'Burst Vault', edition: '15 / 60', accent: '#ff583d' },
  { id: 'bb-255', name: 'Eclipse Genesis G5', series: 'Burst', class: 'Balance', price: 1.1, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/genesisg5eclipsegeo.fbx`, creator: 'WBBA Works', edition: '16 / 80', accent: '#2a8cff' },
  { id: 'bb-256', name: 'Glyph Dragon D5', series: 'Burst', class: 'Attack', price: 1.28, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/glyphdragond5geo.fbx`, creator: 'X Archive', edition: '17 / 100', accent: '#00c8ff' },
  { id: 'bb-257', name: 'Golden Judgement Dragon D5', series: 'Burst', class: 'Defense', price: 1.46, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/goldenjudgementdragond5geo.fbx`, creator: 'Rare Bey Club', edition: '18 / 120', accent: '#ff3d61' },
  { id: 'bb-258', name: 'Golden Judgement Dragon D5 (Virtual Championship)', series: 'Burst', class: 'Stamina', price: 1.64, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/goldenjudgementdragond5geo_virtualchampionship.fbx`, creator: 'Phoenix Lab', edition: '19 / 140', accent: '#5dff7a' },
  { id: 'bb-259', name: 'Evo Helios H6 (Blazebringer)', series: 'Burst', class: 'Balance', price: 1.82, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/heliosh6evoblazebringergeo.fbx`, creator: 'Beylocker', edition: '20 / 160', accent: '#f0aa21' },
  { id: 'bb-260', name: 'Cosmic Vector Arena', series: 'Burst', class: 'Arena', price: 3.9, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_beycosmicvectorbattle.fbx`, creator: 'Burst Vault', edition: '21 / 180', accent: '#ff4f6a' },
  { id: 'bb-261', name: 'Interstellar Drop Arena', series: 'Burst', class: 'Arena', price: 4.25, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_beyinterstellardrop.fbx`, creator: 'WBBA Works', edition: '22 / 200', accent: '#35d4ff' },
  { id: 'bb-262', name: 'Billionth Battle Arena', series: 'Burst', class: 'Arena', price: 4.6, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_billionthbattle.fbx`, creator: 'X Archive', edition: '23 / 220', accent: '#ffa23a' },
  { id: 'bb-263', name: 'Championship Clash Arena', series: 'Burst', class: 'Arena', price: 2.5, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_championshipclash.fbx`, creator: 'Rare Bey Club', edition: '24 / 60', accent: '#ffd84f' },
  { id: 'bb-264', name: 'Collision Nebula Arena', series: 'Burst', class: 'Arena', price: 2.85, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_collisionnebula.fbx`, creator: 'Phoenix Lab', edition: '25 / 80', accent: '#8b65ff' },
  { id: 'bb-265', name: 'Cross Collision Arena', series: 'Burst', class: 'Arena', price: 3.2, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_crosscollision.fbx`, creator: 'Beylocker', edition: '26 / 100', accent: '#caff00' },
  { id: 'bb-266', name: 'Extreme Challenger Arena', series: 'Burst', class: 'Arena', price: 3.55, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_extremechallenger.fbx`, creator: 'Burst Vault', edition: '27 / 120', accent: '#ff583d' },
  { id: 'bb-267', name: 'Galaxy Orbit Arena', series: 'Burst', class: 'Arena', price: 3.9, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_galaxyorbit.fbx`, creator: 'WBBA Works', edition: '28 / 140', accent: '#2a8cff' },
  { id: 'bb-268', name: 'Hyper Sphere Arena', series: 'Burst', class: 'Arena', price: 4.25, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_hypersphere.fbx`, creator: 'X Archive', edition: '29 / 160', accent: '#00c8ff' },
  { id: 'bb-269', name: 'Infinity Brink Arena', series: 'Burst', class: 'Arena', price: 4.6, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_infinitybrink.fbx`, creator: 'Rare Bey Club', edition: '30 / 180', accent: '#ff3d61' },
  { id: 'bb-270', name: 'Light Ignite Arena', series: 'Burst', class: 'Arena', price: 2.5, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_lightignite.fbx`, creator: 'Phoenix Lab', edition: '31 / 200', accent: '#5dff7a' },
  { id: 'bb-271', name: 'Motor Strike Arena', series: 'Burst', class: 'Arena', price: 2.85, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_motorstrike.fbx`, creator: 'Beylocker', edition: '32 / 220', accent: '#f0aa21' },
  { id: 'bb-272', name: 'Pro Series Arena', series: 'Burst', class: 'Arena', price: 3.2, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_proseries.fbx`, creator: 'Burst Vault', edition: '33 / 60', accent: '#ff4f6a' },
  { id: 'bb-273', name: 'Pro Series Battle Arena', series: 'Burst', class: 'Arena', price: 3.55, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_proseriesbattle.fbx`, creator: 'WBBA Works', edition: '34 / 80', accent: '#35d4ff' },
  { id: 'bb-274', name: 'Quaddrive Arena', series: 'Burst', class: 'Arena', price: 3.9, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_quaddrive.fbx`, creator: 'X Archive', edition: '35 / 100', accent: '#ffa23a' },
  { id: 'bb-275', name: 'Quadstrike Arena', series: 'Burst', class: 'Arena', price: 4.25, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_quadstrike.fbx`, creator: 'Rare Bey Club', edition: '36 / 120', accent: '#ffd84f' },
  { id: 'bb-276', name: 'Quadstrike Creature Arena', series: 'Burst', class: 'Arena', price: 4.6, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_quadstrikecreature.fbx`, creator: 'Phoenix Lab', edition: '37 / 140', accent: '#8b65ff' },
  { id: 'bb-277', name: 'Thunder Edge Arena', series: 'Burst', class: 'Arena', price: 2.5, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_quadstrikethunderedge.fbx`, creator: 'Beylocker', edition: '38 / 160', accent: '#caff00' },
  { id: 'bb-278', name: 'Slingshock Arena (Green)', series: 'Burst', class: 'Arena', price: 2.85, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_slingshock_green.fbx`, creator: 'Burst Vault', edition: '39 / 180', accent: '#ff583d' },
  { id: 'bb-279', name: 'SpeedStorm Arena', series: 'Burst', class: 'Arena', price: 3.2, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_speedstorm.fbx`, creator: 'WBBA Works', edition: '40 / 200', accent: '#2a8cff' },
  { id: 'bb-280', name: 'Balkesh B5Zone Geo 2', series: 'Burst', class: 'Attack', price: 1.1, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/balkeshb5zonegeo2.fbx`, creator: 'Burst Vault', edition: '01 / 60', accent: '#ff4f6a' },
  { id: 'bb-201', name: 'Dead Phoenix P4Geo', series: 'Burst', class: 'Defense', price: 1.28, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/deadphoenixp4geov2.fbx`, creator: 'WBBA Works', edition: '02 / 80', accent: '#35d4ff' },
  { id: 'bb-281', name: 'Fafnir F4Geo', series: 'Burst', class: 'Stamina', price: 1.46, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/fafnirf4geov2.fbx`, creator: 'X Archive', edition: '03 / 100', accent: '#ffa23a' },
  { id: 'bb-203', name: 'Fafnir F6Abyss', series: 'Burst', class: 'Balance', price: 1.64, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/fafnirf6abyssgeo.fbx`, creator: 'Rare Bey Club', edition: '04 / 120', accent: '#ffd84f' },
  { id: 'bb-282', name: 'Helios H6Evo World', series: 'Burst', class: 'Attack', price: 1.82, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/heliosh6evoworldgeo.fbx`, creator: 'Phoenix Lab', edition: '05 / 140', accent: '#8b65ff' },
  { id: 'bb-283', name: 'Helios H8', series: 'Burst', class: 'Defense', price: 2, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/heliosh8geo.fbx`, creator: 'Beylocker', edition: '06 / 160', accent: '#caff00' },
  { id: 'bb-206', name: 'Helios H8Geo', series: 'Burst', class: 'Stamina', price: 2.18, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/heliosh8geo_v2.fbx`, creator: 'Burst Vault', edition: '07 / 180', accent: '#ff583d' },
  { id: 'bb-284', name: 'Helios King', series: 'Burst', class: 'Balance', price: 2.36, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/helioskinggeo.fbx`, creator: 'WBBA Works', edition: '08 / 200', accent: '#2a8cff' },
  { id: 'bb-285', name: 'Hyperion H6Evo Flamebringer', series: 'Burst', class: 'Attack', price: 2.54, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/hyperionh6evoflamebringergeo.fbx`, creator: 'X Archive', edition: '09 / 220', accent: '#00c8ff' },
  { id: 'bb-209', name: 'Hyperion H8', series: 'Burst', class: 'Defense', price: 2.72, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/hyperionh8geo.fbx`, creator: 'Rare Bey Club', edition: '10 / 60', accent: '#ff3d61' },
  { id: 'bb-286', name: 'Hyperion Super Black', series: 'Burst', class: 'Stamina', price: 2.9, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/hyperionsuperblackgeo.fbx`, creator: 'Phoenix Lab', edition: '11 / 80', accent: '#5dff7a' },
  { id: 'bb-287', name: 'Hyperion Super', series: 'Burst', class: 'Balance', price: 1.1, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/hyperionsupergeo.fbx`, creator: 'Beylocker', edition: '12 / 100', accent: '#f0aa21' },
  { id: 'bb-288', name: 'Ifritor I7Destruction', series: 'Burst', class: 'Attack', price: 1.28, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ifritori7destructiongeo.fbx`, creator: 'Burst Vault', edition: '13 / 120', accent: '#ff4f6a' },
  { id: 'bb-289', name: 'Ifritor I7', series: 'Burst', class: 'Defense', price: 1.46, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ifritori7geo.fbx`, creator: 'WBBA Works', edition: '14 / 140', accent: '#35d4ff' },
  { id: 'bb-290', name: 'Ifritor I7Geo', series: 'Burst', class: 'Stamina', price: 1.64, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ifritori7geo_v2.fbx`, creator: 'X Archive', edition: '15 / 160', accent: '#ffa23a' },
  { id: 'bb-291', name: 'Istros I4', series: 'Burst', class: 'Balance', price: 1.82, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/istrosi4geo.fbx`, creator: 'Rare Bey Club', edition: '16 / 180', accent: '#ffd84f' },
  { id: 'bb-292', name: 'Jolt Cho-Z', series: 'Burst', class: 'Attack', price: 2, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/joltcho-zgeo.fbx`, creator: 'Phoenix Lab', edition: '17 / 200', accent: '#8b65ff' },
  { id: 'bb-293', name: 'Judgement Joker J5', series: 'Burst', class: 'Defense', price: 2.18, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/judgementjokerj5geo.fbx`, creator: 'Beylocker', edition: '18 / 220', accent: '#caff00' },
  { id: 'bb-218', name: 'Kerbeus K4Gamestop', series: 'Burst', class: 'Stamina', price: 2.36, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/kerbeusk4gamestopgeo.fbx`, creator: 'Burst Vault', edition: '19 / 60', accent: '#ff583d' },
  { id: 'bb-294', name: 'Kerbeus K4', series: 'Burst', class: 'Balance', price: 2.54, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/kerbeusk4geo.fbx`, creator: 'WBBA Works', edition: '20 / 80', accent: '#2a8cff' },
  { id: 'bb-220', name: 'Kerbeus K4Geo', series: 'Burst', class: 'Attack', price: 2.72, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/kerbeusk4geo_v2.fbx`, creator: 'X Archive', edition: '21 / 100', accent: '#00c8ff' },
  { id: 'bb-295', name: 'Kerbeus K5Master', series: 'Burst', class: 'Defense', price: 2.9, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/kerbeusk5mastergeo.fbx`, creator: 'Rare Bey Club', edition: '22 / 120', accent: '#ff3d61' },
  { id: 'bb-296', name: 'Kerbeus K8', series: 'Burst', class: 'Stamina', price: 1.1, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/kerbeusk8geo.fbx`, creator: 'Phoenix Lab', edition: '23 / 140', accent: '#5dff7a' },
  { id: 'bb-297', name: 'Kerbeus K8Geo', series: 'Burst', class: 'Balance', price: 1.28, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/kerbeusk8geo_v2.fbx`, creator: 'Beylocker', edition: '24 / 160', accent: '#f0aa21' },
  { id: 'bb-298', name: 'Kiser Kerbeus 2', series: 'Burst', class: 'Attack', price: 1.46, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/kiserkerbeus2geo.fbx`, creator: 'Burst Vault', edition: '25 / 180', accent: '#ff4f6a' },
  { id: 'bb-299', name: 'Kiser Kerbeus', series: 'Burst', class: 'Defense', price: 1.64, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/kiserkerbeusgeo.fbx`, creator: 'WBBA Works', edition: '26 / 200', accent: '#35d4ff' },
  { id: 'bb-300', name: 'Kraken K4', series: 'Burst', class: 'Stamina', price: 1.82, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/krakenk4geo.fbx`, creator: 'X Archive', edition: '27 / 220', accent: '#ffa23a' },
  { id: 'bb-227', name: 'Kraken K5Cosmic', series: 'Burst', class: 'Balance', price: 2, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/krakenk5cosmicgeo.fbx`, creator: 'Rare Bey Club', edition: '28 / 60', accent: '#ffd84f' },
  { id: 'bb-301', name: 'Lord Hydrax', series: 'Burst', class: 'Attack', price: 2.18, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/lordhydraxgeo.fbx`, creator: 'Phoenix Lab', edition: '29 / 80', accent: '#8b65ff' },
  { id: 'bb-302', name: 'Luinor L4', series: 'Burst', class: 'Defense', price: 2.36, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/luinorl4geo.fbx`, creator: 'Beylocker', edition: '30 / 100', accent: '#caff00' },
  { id: 'bb-303', name: 'Luinor L4Target', series: 'Burst', class: 'Stamina', price: 2.54, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/luinorl4targetgeo.fbx`, creator: 'Burst Vault', edition: '31 / 120', accent: '#ff583d' },
  { id: 'bb-304', name: 'Luinor L5', series: 'Burst', class: 'Balance', price: 2.72, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/luinorl5geo.fbx`, creator: 'WBBA Works', edition: '32 / 140', accent: '#2a8cff' },
  { id: 'bb-305', name: 'Luinor L5Soul', series: 'Burst', class: 'Attack', price: 2.9, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/luinorl5soulgeo.fbx`, creator: 'X Archive', edition: '33 / 160', accent: '#00c8ff' },
  { id: 'bb-306', name: 'Luinor L5Wizard', series: 'Burst', class: 'Defense', price: 1.1, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/luinorl5wizardgeo.fbx`, creator: 'Rare Bey Club', edition: '34 / 180', accent: '#ff3d61' },
  { id: 'bb-234', name: 'Luinor L6', series: 'Burst', class: 'Stamina', price: 1.28, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/luinorl6geo.fbx`, creator: 'Phoenix Lab', edition: '35 / 200', accent: '#5dff7a' },
  { id: 'bb-307', name: 'Luinor L6Kolossal', series: 'Burst', class: 'Balance', price: 1.46, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/luinorl6kolossalgeo.fbx`, creator: 'Beylocker', edition: '36 / 220', accent: '#f0aa21' },
  { id: 'bb-236', name: 'Luinor L6Mirage', series: 'Burst', class: 'Attack', price: 1.64, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/luinorl6miragegeo.fbx`, creator: 'Burst Vault', edition: '37 / 60', accent: '#ff4f6a' },
  { id: 'bb-308', name: 'Luinor L7', series: 'Burst', class: 'Defense', price: 1.82, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/luinorl7geo.fbx`, creator: 'WBBA Works', edition: '38 / 80', accent: '#35d4ff' },
  { id: 'bb-309', name: 'Luinor Rage', series: 'Burst', class: 'Stamina', price: 2, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/luinorragegeo.fbx`, creator: 'X Archive', edition: '39 / 100', accent: '#ffa23a' },
  { id: 'bb-310', name: 'Luinor Tact', series: 'Burst', class: 'Balance', price: 2.18, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/luinortactgeo.fbx`, creator: 'Rare Bey Club', edition: '40 / 120', accent: '#ffd84f' },
  { id: 'bb-311', name: 'Luinor Zwei', series: 'Burst', class: 'Attack', price: 2.36, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/luinorzweigeo.fbx`, creator: 'Phoenix Lab', edition: '01 / 140', accent: '#8b65ff' },
  { id: 'bb-312', name: 'Minoboros M4', series: 'Burst', class: 'Defense', price: 2.54, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/minoborosm4geo.fbx`, creator: 'Beylocker', edition: '02 / 160', accent: '#caff00' },
  { id: 'bb-313', name: 'Minoboros M6', series: 'Burst', class: 'Stamina', price: 2.72, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/minoborosm6geo.fbx`, creator: 'Burst Vault', edition: '03 / 180', accent: '#ff583d' },
  { id: 'bb-316', name: 'Pegasus Harmony Premium', series: 'Burst', class: 'Defense', price: 1.28, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/pegasusharmonypremiumgeo.fbx`, creator: 'Rare Bey Club', edition: '06 / 60', accent: '#ff3d61' },
  { id: 'bb-246', name: 'Glyph Pegasus P5', series: 'Burst', class: 'Stamina', price: 1.46, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/pegasusp5glyphgeo.fbx`, creator: 'Phoenix Lab', edition: '07 / 80', accent: '#5dff7a' },
  { id: 'bb-247', name: 'Perfect Phoenix P4', series: 'Burst', class: 'Balance', price: 1.64, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/perfectphoenixp4geo.fbx`, creator: 'Beylocker', edition: '08 / 100', accent: '#f0aa21' },
  { id: 'bb-317', name: 'Perfect Phoenix P4 (Pro Series)', series: 'Burst', class: 'Attack', price: 1.82, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/perfectphoenixp4proseriesgeo.fbx`, creator: 'Burst Vault', edition: '09 / 120', accent: '#ff4f6a' },
  { id: 'bb-318', name: 'Phoenix P7', series: 'Burst', class: 'Stamina', price: 2.18, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/phoenixp7geo.fbx`, creator: 'X Archive', edition: '11 / 160', accent: '#ffa23a' },
  { id: 'bb-327', name: 'Sub Strike Arena', series: 'Burst', class: 'Arena', price: 3.9, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_substrike.fbx`, creator: 'Burst Vault', edition: '21 / 180', accent: '#ff4f6a' },
  { id: 'bb-328', name: 'Triangle Arena', series: 'Burst', class: 'Arena', price: 4.25, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_triangle.fbx`, creator: 'WBBA Works', edition: '22 / 200', accent: '#35d4ff' },
  { id: 'bb-329', name: 'Vertical Drop Arena', series: 'Burst', class: 'Arena', price: 4.6, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_verticaldrop.fbx`, creator: 'X Archive', edition: '23 / 220', accent: '#ffa23a' },
  { id: 'bb-330', name: 'Virtual Championship Arena', series: 'Burst', class: 'Arena', price: 2.5, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_virtualchampionship.fbx`, creator: 'Rare Bey Club', edition: '24 / 60', accent: '#ffd84f' },
  { id: 'bb-331', name: 'Volt Knockout Arena', series: 'Burst', class: 'Arena', price: 2.85, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_voltknockout.fbx`, creator: 'Phoenix Lab', edition: '25 / 80', accent: '#8b65ff' },
  { id: 'bb-332', name: 'Vortex Climb Arena', series: 'Burst', class: 'Arena', price: 3.2, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_vortexclimb.fbx`, creator: 'Beylocker', edition: '26 / 100', accent: '#caff00' },
  { id: 'bb-333', name: 'Waterfall Arena', series: 'Burst', class: 'Arena', price: 3.55, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/arena_waterfall.fbx`, creator: 'Burst Vault', edition: '27 / 120', accent: '#ff583d' },
  { id: 'bb-336', name: 'Rock Dragon D5', series: 'Burst', class: 'Stamina', price: 1.46, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/rockdragond5geo.fbx`, creator: 'X Archive', edition: '03 / 100', accent: '#ffa23a' },
  { id: 'bb-337', name: 'Roktavor Q', series: 'Burst', class: 'Balance', price: 1.64, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/roktavorqgeo.fbx`, creator: 'Rare Bey Club', edition: '04 / 120', accent: '#ffd84f' },
  { id: 'bb-339', name: 'Roktavor R5', series: 'Burst', class: 'Defense', price: 2, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/roktavorr5geo.fbx`, creator: 'Beylocker', edition: '06 / 160', accent: '#caff00' },
  { id: 'bb-341', name: 'Glide Roktavor R6', series: 'Burst', class: 'Balance', price: 2.36, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/roktavorr6glidegeo.fbx`, creator: 'WBBA Works', edition: '08 / 200', accent: '#2a8cff' },
  { id: 'bb-342', name: 'Curse Satomb S6', series: 'Burst', class: 'Attack', price: 2.54, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/satombs6cursegeo.fbx`, creator: 'X Archive', edition: '09 / 220', accent: '#00c8ff' },
  { id: 'bb-343', name: 'Demise Satomb S6', series: 'Burst', class: 'Defense', price: 2.72, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/satombs6demisegeo.fbx`, creator: 'Rare Bey Club', edition: '10 / 60', accent: '#ff3d61' },
  { id: 'bb-344', name: 'Super Satomb S6', series: 'Burst', class: 'Stamina', price: 2.9, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/satombs6supergeo.fbx`, creator: 'Phoenix Lab', edition: '11 / 80', accent: '#5dff7a' },
  { id: 'bb-345', name: 'Spriggan Rip Fire', series: 'Burst', class: 'Balance', price: 1.1, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/sprigganripfiregeo.fbx`, creator: 'Beylocker', edition: '12 / 100', accent: '#f0aa21' },
  { id: 'bb-346', name: 'Dusk Spryzen S5', series: 'Burst', class: 'Attack', price: 1.28, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/spryzens5duskgeo.fbx`, creator: 'Burst Vault', edition: '13 / 120', accent: '#ff4f6a' },
  { id: 'bb-347', name: 'Lord Spryzen S5', series: 'Burst', class: 'Defense', price: 1.46, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/spryzens5lordgeo.fbx`, creator: 'WBBA Works', edition: '14 / 140', accent: '#35d4ff' },
  { id: 'bb-348', name: 'Lord Spryzen S5 (Premium)', series: 'Burst', class: 'Stamina', price: 1.64, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/spryzens5lordpremiumgeo.fbx`, creator: 'X Archive', edition: '15 / 160', accent: '#ffa23a' },
  { id: 'bb-349', name: 'Lord Spryzen S5 (Pro Series)', series: 'Burst', class: 'Balance', price: 1.82, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/spryzens5lordproseriesgeo.fbx`, creator: 'Rare Bey Club', edition: '16 / 180', accent: '#ffd84f' },
  { id: 'bb-350', name: 'Spryzen S8', series: 'Burst', class: 'Attack', price: 2, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/spryzens8geo.fbx`, creator: 'Phoenix Lab', edition: '17 / 200', accent: '#8b65ff' },
  { id: 'bb-351', name: 'Sword Dragon D5', series: 'Burst', class: 'Defense', price: 2.18, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/sworddragond5geo.fbx`, creator: 'Beylocker', edition: '18 / 220', accent: '#caff00' },
  { id: 'bb-353', name: 'Triumph Dragon D6', series: 'Burst', class: 'Balance', price: 2.54, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/triumphdragond6geo.fbx`, creator: 'WBBA Works', edition: '20 / 80', accent: '#2a8cff' },
  { id: 'bb-354', name: 'Valkyrie First', series: 'Burst', class: 'Attack', price: 2.72, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/valkyriefirstgeo.fbx`, creator: 'X Archive', edition: '21 / 100', accent: '#00c8ff' },
  { id: 'bb-355', name: 'Valkyrie', series: 'Burst', class: 'Defense', price: 2.9, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/valkyriegeo.fbx`, creator: 'Rare Bey Club', edition: '22 / 120', accent: '#ff3d61' },
  { id: 'bb-356', name: 'Valkyrie Rip Fire', series: 'Burst', class: 'Stamina', price: 1.1, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/valkyrieripfiregeo.fbx`, creator: 'Phoenix Lab', edition: '23 / 140', accent: '#5dff7a' },
  { id: 'bb-357', name: 'Rashad Valtryek', series: 'Burst', class: 'Balance', price: 1.28, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/valtryekrashadv7geo.fbx`, creator: 'Beylocker', edition: '24 / 160', accent: '#f0aa21' },
  { id: 'bb-358', name: 'Command Valtryek V5', series: 'Burst', class: 'Attack', price: 1.46, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/valtryekv5commandgeo.fbx`, creator: 'Burst Vault', edition: '25 / 180', accent: '#ff4f6a' },
  { id: 'bb-359', name: 'Cosmic Valtryek V5', series: 'Burst', class: 'Defense', price: 1.64, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/valtryekv5cosmicgeo.fbx`, creator: 'WBBA Works', edition: '26 / 200', accent: '#35d4ff' },
  { id: 'bb-360', name: 'Glyph Valtryek V5', series: 'Burst', class: 'Stamina', price: 1.82, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/valtryekv5glyphgeo.fbx`, creator: 'X Archive', edition: '27 / 220', accent: '#ffa23a' },
  { id: 'bb-361', name: 'Sword Valtryek V5', series: 'Burst', class: 'Balance', price: 2, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/valtryekv5swordgeo.fbx`, creator: 'Rare Bey Club', edition: '28 / 60', accent: '#ffd84f' },
  { id: 'bb-362', name: 'Sword Valtryek V5 (Premium)', series: 'Burst', class: 'Attack', price: 2.18, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/valtryekv5swordpremiumgeo.fbx`, creator: 'Phoenix Lab', edition: '29 / 80', accent: '#8b65ff' },
  { id: 'bb-363', name: 'Brave Valtryek V6', series: 'Burst', class: 'Defense', price: 2.36, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/valtryekv6bravegeo.fbx`, creator: 'Beylocker', edition: '30 / 100', accent: '#caff00' },
  { id: 'bb-364', name: 'Vex Dragon D6', series: 'Burst', class: 'Stamina', price: 2.54, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/vexdragond6geo.fbx`, creator: 'Burst Vault', edition: '31 / 120', accent: '#ff583d' },

  // Full recovered Beyblade X line — one folder per release in the decode.
  { id: 'bx-201', name: 'Soar Phoenix 9-60GF (st)', series: 'X', class: 'Balance', price: 2.27, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_soar_phoenix_9_60gf_st.fbx`, tint: '#35d4ff', creator: 'X Archive', edition: '08 / 87', accent: '#35d4ff' },
  { id: 'bx-202', name: 'Sword Dran 3-60 F', series: 'X', class: 'Attack', price: 3.56, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_sword_dran_3_60_f.fbx`, tint: '#7a5cff', creator: 'X Archive', edition: '37 / 116', accent: '#7a5cff' },
  { id: 'bx-203', name: 'Helm Knight 5-80 T', series: 'X', class: 'Defense', price: 2.73, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_helm_knight_5_80_t.fbx`, tint: '#00e0a8', creator: 'X Archive', edition: '14 / 133', accent: '#00e0a8' },
  { id: 'bx-204', name: 'Arrow Wizard 4-60-N', series: 'X', class: 'Stamina', price: 2.38, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_arrow_wizard_4_60_n.fbx`, tint: '#ffd21e', creator: 'X Archive', edition: '19 / 98', accent: '#ffd21e' },
  { id: 'bx-205', name: 'Arrow Wizard 4-80B (st)', series: 'X', class: 'Defense', price: 2.77, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_arrow_wizard_4_80b_st.fbx`, tint: '#00e0a8', creator: 'X Archive', edition: '38 / 77', accent: '#00e0a8' },
  { id: 'bx-206', name: 'Tail Viper 3-80HN (rdrc)', series: 'X', class: 'Attack', price: 2.12, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_tail_viper_3_80hn_rdrc.fbx`, tint: '#e11d2e', creator: 'X Archive', edition: '33 / 112', accent: '#e11d2e' },
  { id: 'bx-207', name: '– Tail Viber 3-80HN (rdrc)', series: 'X', class: 'Balance', price: 2.55, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_tail_viber_3_80hn_rdrc.fbx`, tint: '#35d4ff', creator: 'X Archive', edition: '16 / 95', accent: '#35d4ff' },
  { id: 'bx-208', name: 'Knight Lance 4-80HN', series: 'X', class: 'Balance', price: 3.59, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_knight_lance_4_80hn.fbx`, tint: '#35d4ff', creator: 'X Archive', edition: '40 / 79', accent: '#35d4ff' },
  { id: 'bx-209', name: 'Steel Samurai 4-80T (st)', series: 'X', class: 'Stamina', price: 3.50, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_steel_samurai_4_80t_st.fbx`, tint: '#ff8a2b', creator: 'X Archive', edition: '31 / 150', accent: '#ff8a2b' },
  { id: 'bx-210', name: '– Claw Leon 5-60P', series: 'X', class: 'Stamina', price: 2.90, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_claw_leon_5_60p.fbx`, tint: '#ffd21e', creator: 'X Archive', edition: '11 / 50', accent: '#ffd21e' },
  { id: 'bx-211', name: 'Sting Unicorn 5-60GP', series: 'X', class: 'Stamina', price: 1.90, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_sting_unicorn_5_60gp.fbx`, tint: '#ffd21e', creator: 'X Archive', edition: '11 / 90', accent: '#ffd21e' },
  { id: 'bx-212', name: 'Scythe Incendio 3-80 B', series: 'X', class: 'Defense', price: 2.77, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_scythe_incendio_3_80_b.fbx`, tint: '#10a5ff', creator: 'X Archive', edition: '18 / 97', accent: '#10a5ff' },
  { id: 'bx-213', name: '533023 - Gale Wyvern 3-60T', series: 'X', class: 'Balance', price: 2.95, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_533023_gale_wyvern_3_60t.fbx`, tint: '#c6ced8', creator: 'X Archive', edition: '36 / 115', accent: '#c6ced8' },
  { id: 'bx-214', name: '533023 - Sword Dran 3-80B', series: 'X', class: 'Defense', price: 2.61, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_533023_sword_dran_3_80b.fbx`, tint: '#00e0a8', creator: 'X Archive', edition: '22 / 141', accent: '#00e0a8' },
  { id: 'bx-215', name: 'Keel Shark 3-80-F', series: 'X', class: 'Defense', price: 2.85, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_keel_shark_3_80_f.fbx`, tint: '#00e0a8', creator: 'X Archive', edition: '06 / 125', accent: '#00e0a8' },
  { id: 'bx-216', name: 'Keel Shark 3-80-F (st)', series: 'X', class: 'Balance', price: 2.95, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_keel_shark_3_80_f_st.fbx`, tint: '#c6ced8', creator: 'X Archive', edition: '36 / 75', accent: '#c6ced8' },
  { id: 'bx-217', name: 'Impact Drake 9-60LR', series: 'X', class: 'Defense', price: 2.81, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_impact_drake_9_60lr.fbx`, tint: '#10a5ff', creator: 'X Archive', edition: '02 / 121', accent: '#10a5ff' },
  { id: 'bx-218', name: 'Cowl Sphinx 9-80GN', series: 'X', class: 'Attack', price: 2.60, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_cowl_sphinx_9_80gn.fbx`, tint: '#7a5cff', creator: 'X Archive', edition: '21 / 100', accent: '#7a5cff' },
  { id: 'bx-219', name: 'Arrow Wizard 4-80GB', series: 'X', class: 'Stamina', price: 3.34, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_arrow_wizard_4_80gb.fbx`, tint: '#ffd21e', creator: 'X Archive', edition: '35 / 114', accent: '#ffd21e' },
  { id: 'bx-220', name: 'Obsidian Shell 4-60D', series: 'X', class: 'Attack', price: 2.52, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_obsidian_shell_4_60d.fbx`, tint: '#7a5cff', creator: 'X Archive', edition: '13 / 92', accent: '#7a5cff' },
  { id: 'bx-221', name: 'Obsidian Shell 4-60D-RATCHET UI', series: 'X', class: 'Attack', price: 2.48, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_obsidian_shell_4_60d_ratchet_ui.fbx`, tint: '#7a5cff', creator: 'X Archive', edition: '29 / 148', accent: '#7a5cff' },
  { id: 'bx-222', name: 'Keel Shark 1-60Q', series: 'X', class: 'Defense', price: 1.93, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_keel_shark_1_60q.fbx`, tint: '#10a5ff', creator: 'X Archive', edition: '34 / 73', accent: '#10a5ff' },
  { id: 'bx-223', name: 'Wand Wizard 5-70DB', series: 'X', class: 'Attack', price: 1.72, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_wand_wizard_5_70db.fbx`, tint: '#7a5cff', creator: 'X Archive', edition: '13 / 92', accent: '#7a5cff' },
  { id: 'bx-224', name: 'Wand Wizard 1-60R', series: 'X', class: 'Balance', price: 1.99, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_wand_wizard_1_60r.fbx`, tint: '#35d4ff', creator: 'X Archive', edition: '40 / 79', accent: '#35d4ff' },
  { id: 'bx-225', name: 'Shadow Shinobi 1-80MN', series: 'X', class: 'Defense', price: 3.25, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_shadow_shinobi_1_80mn.fbx`, tint: '#10a5ff', creator: 'X Archive', edition: '26 / 145', accent: '#10a5ff' },
  { id: 'bx-226', name: 'Beat Tyranno 4-70Q', series: 'X', class: 'Attack', price: 1.84, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_beat_tyranno_4_70q.fbx`, tint: '#e11d2e', creator: 'X Archive', edition: '25 / 64', accent: '#e11d2e' },
  { id: 'bx-227', name: 'Soar Phoenix 5-80H', series: 'X', class: 'Attack', price: 2.20, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_soar_phoenix_5_80h.fbx`, tint: '#7a5cff', creator: 'X Archive', edition: '21 / 100', accent: '#7a5cff' },
  { id: 'bx-228', name: 'Cobalt Dragoon 2-60C', series: 'X', class: 'Balance', price: 3.19, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_cobalt_dragoon_2_60c.fbx`, tint: '#c6ced8', creator: 'X Archive', edition: '20 / 99', accent: '#c6ced8' },
  { id: 'bx-229', name: 'Dran Buster 1-60A', series: 'X', class: 'Defense', price: 2.17, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_dran_buster_1_60a.fbx`, tint: '#10a5ff', creator: 'X Archive', edition: '18 / 137', accent: '#10a5ff' },
  { id: 'bx-230', name: 'Tide Whale 5-80E', series: 'X', class: 'Attack', price: 3.16, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_tide_whale_5_80e.fbx`, tint: '#7a5cff', creator: 'X Archive', edition: '37 / 156', accent: '#7a5cff' },
  { id: 'bx-231', name: 'Dagger Dran 4-70Q', series: 'X', class: 'Attack', price: 3.08, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_dagger_dran_4_70q.fbx`, tint: '#e11d2e', creator: 'X Archive', edition: '09 / 88', accent: '#e11d2e' },
  { id: 'bx-232', name: 'Buster Dran 5-70DB', series: 'X', class: 'Defense', price: 2.37, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_buster_dran_5_70db.fbx`, tint: '#00e0a8', creator: 'X Archive', edition: '38 / 157', accent: '#00e0a8' },
  { id: 'bx-233', name: 'Hammer Incendio 3-70H', series: 'X', class: 'Stamina', price: 2.18, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_hammer_incendio_3_70h.fbx`, tint: '#ffd21e', creator: 'X Archive', edition: '19 / 98', accent: '#ffd21e' },
  { id: 'bx-234', name: 'Scarlet Garuda 4-70TP', series: 'X', class: 'Stamina', price: 2.62, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_scarlet_garuda_4_70tp.fbx`, tint: '#ff8a2b', creator: 'X Archive', edition: '23 / 142', accent: '#ff8a2b' },
  { id: 'bx-235', name: 'Sterling Wolf 3-80FB', series: 'X', class: 'Attack', price: 2.28, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_sterling_wolf_3_80fb.fbx`, tint: '#e11d2e', creator: 'X Archive', edition: '09 / 48', accent: '#e11d2e' },
  { id: 'bx-236', name: 'Courage Dran S 6-60V-BLADE Chip', series: 'X', class: 'Attack', price: 2.32, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_courage_dran_s_6_60v_blade_chip.fbx`, tint: '#7a5cff', creator: 'X Archive', edition: '13 / 132', accent: '#7a5cff' },
  { id: 'bx-237', name: 'Courage Dran S 6-60V-BLADE Layer', series: 'X', class: 'Defense', price: 3.33, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_courage_dran_s_6_60v_blade_layer.fbx`, tint: '#10a5ff', creator: 'X Archive', edition: '34 / 153', accent: '#10a5ff' },
  { id: 'bx-238', name: 'Courage Dran S 6-60V-BLADE Ring', series: 'X', class: 'Attack', price: 2.84, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_courage_dran_s_6_60v_blade_ring.fbx`, tint: '#e11d2e', creator: 'X Archive', edition: '25 / 144', accent: '#e11d2e' },
  { id: 'bx-239', name: 'Reaper Incendio T 4-70K-BLADE Chip', series: 'X', class: 'Attack', price: 2.00, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_reaper_incendio_t_4_70k_blade_chip.fbx`, tint: '#e11d2e', creator: 'X Archive', edition: '01 / 120', accent: '#e11d2e' },
  { id: 'bx-240', name: 'Reaper Incendio T 4-70K-BLADE Layer', series: 'X', class: 'Defense', price: 2.53, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_reaper_incendio_t_4_70k_blade_layer.fbx`, tint: '#00e0a8', creator: 'X Archive', edition: '14 / 93', accent: '#00e0a8' },
  { id: 'bx-241', name: 'Reaper Incendio T 4-70K-BLADE Ring', series: 'X', class: 'Attack', price: 2.52, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_reaper_incendio_t_4_70k_blade_ring.fbx`, tint: '#7a5cff', creator: 'X Archive', edition: '13 / 132', accent: '#7a5cff' },
  { id: 'bx-242', name: 'ARC Wizard R 4-55LO-BLADE Chip', series: 'X', class: 'Attack', price: 1.84, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_arc_wizard_r_4_55lo_blade_chip.fbx`, tint: '#e11d2e', creator: 'X Archive', edition: '25 / 104', accent: '#e11d2e' },
  { id: 'bx-243', name: 'ARC Wizard R 4-55LO-BLADE Layer', series: 'X', class: 'Defense', price: 2.89, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_arc_wizard_r_4_55lo_blade_layer.fbx`, tint: '#00e0a8', creator: 'X Archive', edition: '30 / 149', accent: '#00e0a8' },
  { id: 'bx-244', name: 'ARC Wizard R 4-55LO-BLADE Ring', series: 'X', class: 'Attack', price: 2.36, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_arc_wizard_r_4_55lo_blade_ring.fbx`, tint: '#7a5cff', creator: 'X Archive', edition: '37 / 116', accent: '#7a5cff' },
  { id: 'bx-245', name: 'Dark Perseus B 6-80W-BLADE Chip', series: 'X', class: 'Attack', price: 1.44, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_dark_perseus_b_6_80w_blade_chip.fbx`, tint: '#7a5cff', creator: 'X Archive', edition: '05 / 124', accent: '#7a5cff' },
  { id: 'bx-246', name: 'Dark Perseus B 6-80W-BLADE Layer', series: 'X', class: 'Defense', price: 3.29, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_dark_perseus_b_6_80w_blade_layer.fbx`, tint: '#10a5ff', creator: 'X Archive', edition: '10 / 129', accent: '#10a5ff' },
  { id: 'bx-247', name: 'Dark Perseus B 6-80W-BLADE Ring', series: 'X', class: 'Attack', price: 1.96, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_dark_perseus_b_6_80w_blade_ring.fbx`, tint: '#e11d2e', creator: 'X Archive', edition: '17 / 136', accent: '#e11d2e' },
  { id: 'bx-248', name: 'Cowl Sphinx 1-80GF', series: 'X', class: 'Attack', price: 2.44, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_cowl_sphinx_1_80gf.fbx`, tint: '#7a5cff', creator: 'X Archive', edition: '05 / 84', accent: '#7a5cff' },
  { id: 'bx-249', name: 'Crest Leon 7-60GN', series: 'X', class: 'Stamina', price: 1.46, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_crest_leon_7_60gn.fbx`, tint: '#ff8a2b', creator: 'X Archive', edition: '07 / 46', accent: '#ff8a2b' },
  { id: 'bx-250', name: 'Gill Shark 4-70O', series: 'X', class: 'Attack', price: 2.88, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_gill_shark_4_70o.fbx`, tint: '#7a5cff', creator: 'X Archive', edition: '29 / 68', accent: '#7a5cff' },
  { id: 'bx-251', name: '1 - G1686 - Pearl Tiger 3-60U', series: 'X', class: 'Balance', price: 1.83, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_1_g1686_pearl_tiger_3_60u.fbx`, tint: '#c6ced8', creator: 'X Archive', edition: '04 / 123', accent: '#c6ced8' },
  { id: 'bx-252', name: 'Dranzer Spiral 3-80T', series: 'X', class: 'Balance', price: 3.39, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_dranzer_spiral_3_80t.fbx`, tint: '#35d4ff', creator: 'X Archive', edition: '40 / 79', accent: '#35d4ff' },
  { id: 'bx-253', name: 'Driger Slash 4-80P', series: 'X', class: 'Defense', price: 2.93, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_driger_slash_4_80p.fbx`, tint: '#00e0a8', creator: 'X Archive', edition: '14 / 133', accent: '#00e0a8' },
  { id: 'bx-254', name: 'Saber Samurai 2-70L', series: 'X', class: 'Defense', price: 3.01, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_saber_samurai_2_70l.fbx`, tint: '#00e0a8', creator: 'X Archive', edition: '22 / 141', accent: '#00e0a8' },
  { id: 'bx-255', name: 'Bx-org01 Samurai Steel 4-80T', series: 'X', class: 'Attack', price: 3.08, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bx_org01_samurai_steel_4_80t.fbx`, tint: '#e11d2e', creator: 'X Archive', edition: '09 / 88', accent: '#e11d2e' },
  { id: 'bx-256', name: 'Bx-org05 Shinobi Knife 4-80HN', series: 'X', class: 'Attack', price: 1.56, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bx_org05_shinobi_knife_4_80hn.fbx`, tint: '#7a5cff', creator: 'X Archive', edition: '37 / 156', accent: '#7a5cff' },
  { id: 'bx-257', name: 'Bx-org08 Mammo Tusk 3-60T', series: 'X', class: 'Defense', price: 3.05, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bx_org08_mammo_tusk_3_60t.fbx`, tint: '#10a5ff', creator: 'X Archive', edition: '26 / 65', accent: '#10a5ff' },
  { id: 'bx-258', name: 'Bx04 Helm Knight 3-80N-BIT UI', series: 'X', class: 'Balance', price: 2.55, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bx04_helm_knight_3_80n_bit_ui.fbx`, tint: '#35d4ff', creator: 'X Archive', edition: '16 / 135', accent: '#35d4ff' },
  { id: 'bx-259', name: 'Bx04 Helm Knight 3-80N', series: 'X', class: 'Defense', price: 2.65, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bx04_helm_knight_3_80n.fbx`, tint: '#00e0a8', creator: 'X Archive', edition: '06 / 125', accent: '#00e0a8' },
  { id: 'bx-260', name: 'Bx04 Helm Knight 3-80N-RATCHET UI', series: 'X', class: 'Balance', price: 2.47, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bx04_helm_knight_3_80n_ratchet_ui.fbx`, tint: '#c6ced8', creator: 'X Archive', edition: '28 / 147', accent: '#c6ced8' },
  { id: 'bx-261', name: 'Bx14 Keel Shark 3-60LF-BIT UI', series: 'X', class: 'Balance', price: 3.59, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bx14_keel_shark_3_60lf_bit_ui.fbx`, tint: '#c6ced8', creator: 'X Archive', edition: '20 / 99', accent: '#c6ced8' },
  { id: 'bx-262', name: 'Bx14 Keel Shark 3-60LF', series: 'X', class: 'Defense', price: 2.65, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bx14_keel_shark_3_60lf.fbx`, tint: '#10a5ff', creator: 'X Archive', edition: '26 / 105', accent: '#10a5ff' },
  { id: 'bx-263', name: 'Bx14 Keel Shark 3-60LF-RATCHET UI', series: 'X', class: 'Balance', price: 1.91, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bx14_keel_shark_3_60lf_ratchet_ui.fbx`, tint: '#35d4ff', creator: 'X Archive', edition: '32 / 111', accent: '#35d4ff' },
  { id: 'bx-264', name: 'Bx14 Shark Edge 3-60LF', series: 'X', class: 'Balance', price: 2.03, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bx14_shark_edge_3_60lf.fbx`, tint: '#35d4ff', creator: 'X Archive', edition: '24 / 103', accent: '#35d4ff' },
  { id: 'bx-265', name: 'Bx14 Shark Edge 3-60LF-BIT (blue)', series: 'X', class: 'Attack', price: 2.16, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bx14_shark_edge_3_60lf_bit_blue.fbx`, tint: '#e11d2e', creator: 'X Archive', edition: '17 / 136', accent: '#e11d2e' },
  { id: 'bx-266', name: 'Bx14 Shark Edge 3-60LF-BIT (red)', series: 'X', class: 'Balance', price: 1.99, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bx14_shark_edge_3_60lf_bit_red.fbx`, tint: '#35d4ff', creator: 'X Archive', edition: '40 / 79', accent: '#35d4ff' },
  { id: 'bx-267', name: 'Bx14 Shark Edge 3-60LF-BLADE (blue)', series: 'X', class: 'Defense', price: 2.57, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bx14_shark_edge_3_60lf_blade_blue.fbx`, tint: '#00e0a8', creator: 'X Archive', edition: '38 / 117', accent: '#00e0a8' },
  { id: 'bx-268', name: 'Bx14 Shark Edge 3-60LF-BLADE (red)', series: 'X', class: 'Stamina', price: 2.70, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bx14_shark_edge_3_60lf_blade_red.fbx`, tint: '#ffd21e', creator: 'X Archive', edition: '11 / 50', accent: '#ffd21e' },
  { id: 'bx-269', name: 'Bx14 Shark Edge 3-60LF-RATCHET (blue)', series: 'X', class: 'Attack', price: 2.80, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bx14_shark_edge_3_60lf_ratchet_blue.fbx`, tint: '#7a5cff', creator: 'X Archive', edition: '21 / 60', accent: '#7a5cff' },
  { id: 'bx-270', name: 'Bx14 Shark Edge 3-60LF-RATCHET (red)', series: 'X', class: 'Balance', price: 3.43, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bx14_shark_edge_3_60lf_ratchet_red.fbx`, tint: '#c6ced8', creator: 'X Archive', edition: '04 / 123', accent: '#c6ced8' },
  { id: 'bx-271', name: 'Bx19 Rhino Horn 3-80S-BIT UI', series: 'X', class: 'Stamina', price: 1.70, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bx19_rhino_horn_3_80s_bit_ui.fbx`, tint: '#ffd21e', creator: 'X Archive', edition: '11 / 130', accent: '#ffd21e' },
  { id: 'bx-272', name: 'Bx19 Rhino Horn 3-80S', series: 'X', class: 'Stamina', price: 1.82, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bx19_rhino_horn_3_80s.fbx`, tint: '#ffd21e', creator: 'X Archive', edition: '03 / 122', accent: '#ffd21e' },
  { id: 'bx-273', name: 'Bx19 Rhino Horn 3-80S-RATCHET UI', series: 'X', class: 'Stamina', price: 3.58, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bx19_rhino_horn_3_80s_ratchet_ui.fbx`, tint: '#ff8a2b', creator: 'X Archive', edition: '39 / 118', accent: '#ff8a2b' },
  { id: 'bx-274', name: 'Bx20 Dagger Dran 4-60R-BIT UI', series: 'X', class: 'Attack', price: 2.28, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bx20_dagger_dran_4_60r_bit_ui.fbx`, tint: '#e11d2e', creator: 'X Archive', edition: '09 / 48', accent: '#e11d2e' },
  { id: 'bx-275', name: 'Bx20 Dagger Dran 4-60R', series: 'X', class: 'Attack', price: 1.92, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bx20_dagger_dran_4_60r.fbx`, tint: '#7a5cff', creator: 'X Archive', edition: '13 / 92', accent: '#7a5cff' },
  { id: 'bx-276', name: 'Bx20 Dagger Dran 4-60R-RATCHET UI', series: 'X', class: 'Attack', price: 1.60, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bx20_dagger_dran_4_60r_ratchet_ui.fbx`, tint: '#7a5cff', creator: 'X Archive', edition: '21 / 140', accent: '#7a5cff' },
  { id: 'bx-277', name: 'Bxg01 Dranzer Spiral 3-80T Green', series: 'X', class: 'Attack', price: 2.48, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bxg01_dranzer_spiral_3_80t_green.fbx`, tint: '#e11d2e', creator: 'X Archive', edition: '09 / 128', accent: '#e11d2e' },
  { id: 'bx-278', name: 'Bxg01 Dranzer Spiral 3-80T RED', series: 'X', class: 'Stamina', price: 2.58, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_bxg01_dranzer_spiral_3_80t_red.fbx`, tint: '#ff8a2b', creator: 'X Archive', edition: '39 / 158', accent: '#ff8a2b' },
  { id: 'bx-279', name: 'Digital Beyblade', series: 'X', class: 'Stamina', price: 1.98, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_digital_beyblade.fbx`, tint: '#ffd21e', creator: 'X Archive', edition: '19 / 98', accent: '#ffd21e' },
  { id: 'bx-280', name: '529279 - Sting Unicorn 4-60 P (rdrc)', series: 'X', class: 'Defense', price: 1.77, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_529279_sting_unicorn_4_60_p_rdrc.fbx`, tint: '#10a5ff', creator: 'X Archive', edition: '18 / 97', accent: '#10a5ff' },
  { id: 'bx-281', name: '529279 Bite Croc 3-60LF', series: 'X', class: 'Balance', price: 2.19, image: `${XC}/bg-waiting-01.png`, model: `${M}/x_529279_bite_croc_3_60lf.fbx`, tint: '#c6ced8', creator: 'X Archive', edition: '20 / 59', accent: '#c6ced8' },

  // Full recovered Burst line — layer + disc + driver assembled at load.
  { id: 'bb-401', name: 'Ace Dragon D5', series: 'Burst', class: 'Defense', price: 2.85, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/AceDragonD5_Layer.obj`, texture: `${M}/AceDragonD5_Layer_Color.png`, creator: 'WBBA Works', edition: '26 / 145', accent: '#10a5ff' },
  { id: 'bb-402', name: 'Air Knight K4', series: 'Burst', class: 'Stamina', price: 1.38, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/AirKnightK4_Layer.obj`, texture: `${M}/AirKnightK4_Layer_Color.png`, creator: 'Beylocker', edition: '19 / 58', accent: '#ffd21e' },
  { id: 'bb-403', name: 'Anubion A6', series: 'Burst', class: 'Defense', price: 1.49, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/AnubionA6_Layer.obj`, texture: `${M}/AnubionA6_Layer_Color.png`, creator: 'WBBA Works', edition: '30 / 69', accent: '#00e0a8' },
  { id: 'bb-404', name: 'Apollos A5', series: 'Burst', class: 'Stamina', price: 1.26, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ApollosA5_Layer.obj`, texture: `${M}/ApollosA5_Layer_Color.png`, creator: 'Beylocker', edition: '27 / 106', accent: '#ffd21e' },
  { id: 'bb-405', name: 'Artemis A4', series: 'Burst', class: 'Stamina', price: 1.94, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ArtemisA4_Layer.obj`, texture: `${M}/ArtemisA4_Layer_Color.png`, creator: 'Beylocker', edition: '35 / 114', accent: '#ffd21e' },
  { id: 'bb-406', name: 'Artemis A5', series: 'Burst', class: 'Balance', price: 1.95, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ArtemisA5_Layer.obj`, texture: `${M}/ArtemisA5_Layer_Color.png`, creator: 'Rare Bey Club', edition: '36 / 115', accent: '#c6ced8' },
  { id: 'bb-407', name: 'Balar B4', series: 'Burst', class: 'Stamina', price: 1.70, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/BalarB4_Layer.obj`, texture: `${M}/BalarB4_Layer_Color.png`, creator: 'Beylocker', edition: '11 / 90', accent: '#ffd21e' },
  { id: 'bb-408', name: 'Balor B4', series: 'Burst', class: 'Attack', price: 2.20, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/BalorB4_Layer.obj`, texture: `${M}/BalorB4_Layer_Color.png`, creator: 'Burst Vault', edition: '21 / 140', accent: '#7a5cff' },
  { id: 'bb-409', name: 'Behemoth Cyclopse C5', series: 'Burst', class: 'Attack', price: 2.88, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/BehemothCyclopseC5_Layer.obj`, texture: `${M}/BehemothCyclopseC5_Layer_Color.png`, creator: 'Burst Vault', edition: '29 / 148', accent: '#7a5cff' },
  { id: 'bb-410', name: 'Betromoth B6', series: 'Burst', class: 'Stamina', price: 1.86, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/BetromothB6_Layer.obj`, texture: `${M}/BetromothB6_Layer_Color.png`, creator: 'Beylocker', edition: '27 / 106', accent: '#ffd21e' },
  { id: 'bb-411', name: 'Betromoth', series: 'Burst', class: 'Stamina', price: 2.42, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/Betromoth_Layer.obj`, texture: `${M}/Betromoth_Layer_Color.png`, creator: 'Beylocker', edition: '23 / 102', accent: '#ff8a2b' },
  { id: 'bb-412', name: 'Brave Satomb S6', series: 'Burst', class: 'Balance', price: 1.27, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/BraveSatombS6_Layer.obj`, texture: `${M}/BraveSatombS6_Layer_Color.png`, creator: 'Rare Bey Club', edition: '28 / 107', accent: '#c6ced8' },
  { id: 'bb-413', name: 'Brave Valtryek V6', series: 'Burst', class: 'Stamina', price: 1.22, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/BraveValtryekV6_Layer.obj`, texture: `${M}/BraveValtryekV6_Layer_Color.png`, creator: 'Beylocker', edition: '03 / 42', accent: '#ffd21e' },
  { id: 'bb-414', name: 'Cho ZValtryek Red', series: 'Burst', class: 'Balance', price: 2.19, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ChoZValtryekRed_Layer.obj`, texture: `${M}/ChoZValtryekRed_Layer_Color.png`, creator: 'Rare Bey Club', edition: '20 / 139', accent: '#c6ced8' },
  { id: 'bb-415', name: 'Command Dragon D5', series: 'Burst', class: 'Defense', price: 1.29, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/CommandDragonD5_Layer.obj`, texture: `${M}/CommandDragonD5_Layer_Color.png`, creator: 'WBBA Works', edition: '10 / 49', accent: '#10a5ff' },
  { id: 'bb-416', name: 'Command Valtryek V5', series: 'Burst', class: 'Attack', price: 1.44, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/CommandValtryekV5_Layer.obj`, texture: `${M}/CommandValtryekV5_Layer_Color.png`, creator: 'Burst Vault', edition: '05 / 124', accent: '#7a5cff' },
  { id: 'bb-417', name: 'Cosmo Apocalypse A5', series: 'Burst', class: 'Stamina', price: 1.94, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/CosmoApocalypseA5_Layer.obj`, texture: `${M}/CosmoApocalypseA5_Layer_Color.png`, creator: 'Beylocker', edition: '15 / 54', accent: '#ff8a2b' },
  { id: 'bb-418', name: 'Crystal Dranzer F', series: 'Burst', class: 'Stamina', price: 2.02, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/CrystalDranzerF_Layer.obj`, texture: `${M}/CrystalDranzerF_Layer_Color.png`, creator: 'Beylocker', edition: '03 / 122', accent: '#ffd21e' },
  { id: 'bb-419', name: 'Curse Satomb S6', series: 'Burst', class: 'Defense', price: 1.97, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/CurseSatombS6_Layer.obj`, texture: `${M}/CurseSatombS6_Layer_Color.png`, creator: 'WBBA Works', edition: '38 / 117', accent: '#00e0a8' },
  { id: 'bb-420', name: 'Cyclops C4', series: 'Burst', class: 'Stamina', price: 1.50, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/CyclopsC4_Layer.obj`, texture: `${M}/CyclopsC4_Layer_Color.png`, creator: 'Beylocker', edition: '31 / 70', accent: '#ff8a2b' },
  { id: 'bb-421', name: 'Demise Devolos D6', series: 'Burst', class: 'Balance', price: 2.59, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/DemiseDevolosD6_Layer.obj`, texture: `${M}/DemiseDevolosD6_Layer_Color.png`, creator: 'Rare Bey Club', edition: '20 / 59', accent: '#c6ced8' },
  { id: 'bb-422', name: 'Demise Dullahan D6', series: 'Burst', class: 'Attack', price: 2.72, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/DemiseDullahanD6_Layer.obj`, texture: `${M}/DemiseDullahanD6_Layer_Color.png`, creator: 'Burst Vault', edition: '33 / 72', accent: '#e11d2e' },
  { id: 'bb-423', name: 'Demise Hyperion H6', series: 'Burst', class: 'Balance', price: 2.31, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/DemiseHyperionH6_Layer.obj`, texture: `${M}/DemiseHyperionH6_Layer_Color.png`, creator: 'Rare Bey Club', edition: '12 / 91', accent: '#c6ced8' },
  { id: 'bb-424', name: 'Demise Satomb S6', series: 'Burst', class: 'Stamina', price: 2.38, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/DemiseSatombS6_Layer.obj`, texture: `${M}/DemiseSatombS6_Layer_Color.png`, creator: 'Beylocker', edition: '19 / 98', accent: '#ffd21e' },
  { id: 'bb-425', name: 'Destruction Ifritor I7', series: 'Burst', class: 'Defense', price: 1.73, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/DestructionIfritorI7_Layer.obj`, texture: `${M}/DestructionIfritorI7_Layer_Color.png`, creator: 'WBBA Works', edition: '34 / 153', accent: '#10a5ff' },
  { id: 'bb-426', name: 'Draciel F', series: 'Burst', class: 'Attack', price: 2.48, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/DracielF_Layer.obj`, texture: `${M}/DracielF_Layer_Color.png`, creator: 'Burst Vault', edition: '09 / 48', accent: '#e11d2e' },
  { id: 'bb-427', name: 'Dread Bahamut B5', series: 'Burst', class: 'Balance', price: 2.27, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/DreadBahamutB5_Layer.obj`, texture: `${M}/DreadBahamutB5_Layer_Color.png`, creator: 'Rare Bey Club', edition: '08 / 87', accent: '#35d4ff' },
  { id: 'bb-428', name: 'Dullahan D4', series: 'Burst', class: 'Balance', price: 2.59, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/DullahanD4_Layer.obj`, texture: `${M}/DullahanD4_Layer_Color.png`, creator: 'Rare Bey Club', edition: '40 / 119', accent: '#35d4ff' },
  { id: 'bb-429', name: 'Dullahan D5', series: 'Burst', class: 'Attack', price: 2.60, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/DullahanD5_Layer.obj`, texture: `${M}/DullahanD5_Layer_Color.png`, creator: 'Burst Vault', edition: '01 / 120', accent: '#e11d2e' },
  { id: 'bb-430', name: 'Dusk Spryzen S5', series: 'Burst', class: 'Stamina', price: 2.46, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/DuskSpryzenS5_Layer.obj`, texture: `${M}/DuskSpryzenS5_Layer_Color.png`, creator: 'Beylocker', edition: '27 / 106', accent: '#ffd21e' },
  { id: 'bb-431', name: 'Eclipse Evo Devolos D5', series: 'Burst', class: 'Stamina', price: 2.34, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/EclipseEvoDevolosD5_Layer.obj`, texture: `${M}/EclipseEvoDevolosD5_Layer_Color.png`, creator: 'Beylocker', edition: '35 / 154', accent: '#ffd21e' },
  { id: 'bb-432', name: 'Eclipse Genesis G5', series: 'Burst', class: 'Defense', price: 2.81, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/EclipseGenesisG5_Layer.obj`, texture: `${M}/EclipseGenesisG5_Layer_Color.png`, creator: 'WBBA Works', edition: '02 / 81', accent: '#10a5ff' },
  { id: 'bb-433', name: 'Engaard E4_Egis E4', series: 'Burst', class: 'Defense', price: 1.53, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/EngaardE4_EgisE4_Layer.obj`, texture: `${M}/EngaardE4_EgisE4_Layer_Color.png`, creator: 'WBBA Works', edition: '14 / 133', accent: '#00e0a8' },
  { id: 'bb-434', name: 'Engaard E5', series: 'Burst', class: 'Stamina', price: 2.34, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/EngaardE5_Layer.obj`, texture: `${M}/EngaardE5_Layer_Color.png`, creator: 'Beylocker', edition: '35 / 154', accent: '#ffd21e' },
  { id: 'bb-435', name: 'Erase Balkesh B5', series: 'Burst', class: 'Balance', price: 2.03, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/EraseBalkeshB5_Layer.obj`, texture: `${M}/EraseBalkeshB5_Layer_Color.png`, creator: 'Rare Bey Club', edition: '04 / 123', accent: '#c6ced8' },
  { id: 'bb-436', name: 'Erase Diablos D5', series: 'Burst', class: 'Balance', price: 1.27, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/EraseDiablosD5_Layer.obj`, texture: `${M}/EraseDiablosD5_Layer_Color.png`, creator: 'Rare Bey Club', edition: '08 / 47', accent: '#35d4ff' },
  { id: 'bb-437', name: 'Evo Helios Blazebringer H6', series: 'Burst', class: 'Defense', price: 2.81, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/EvoHeliosBlazebringerH6_Layer.obj`, texture: `${M}/EvoHeliosBlazebringerH6_Layer_Color.png`, creator: 'WBBA Works', edition: '02 / 81', accent: '#10a5ff' },
  { id: 'bb-438', name: 'Evo Lucius Endbringer', series: 'Burst', class: 'Defense', price: 1.49, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/EvoLuciusEndbringer_Layer.obj`, texture: `${M}/EvoLuciusEndbringer_Layer_Color.png`, creator: 'WBBA Works', edition: '10 / 129', accent: '#10a5ff' },
  { id: 'bb-439', name: 'Fang Dragoon F', series: 'Burst', class: 'Stamina', price: 2.26, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/FangDragoonF_Layer.obj`, texture: `${M}/FangDragoonF_Layer_Color.png`, creator: 'Beylocker', edition: '27 / 146', accent: '#ffd21e' },
  { id: 'bb-440', name: 'Flare Cobra C5', series: 'Burst', class: 'Balance', price: 2.23, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/FlareCobraC5_Layer.obj`, texture: `${M}/FlareCobraC5_Layer_Color.png`, creator: 'Rare Bey Club', edition: '04 / 83', accent: '#c6ced8' },
  { id: 'bb-441', name: 'Force Worlborg', series: 'Burst', class: 'Defense', price: 1.85, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ForceWorlborg_Layer.obj`, texture: `${M}/ForceWorlborg_Layer_Color.png`, creator: 'WBBA Works', edition: '26 / 105', accent: '#10a5ff' },
  { id: 'bb-442', name: 'Forneus F4', series: 'Burst', class: 'Stamina', price: 2.54, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ForneusF4_Layer.obj`, texture: `${M}/ForneusF4_Layer_Color.png`, creator: 'Beylocker', edition: '15 / 54', accent: '#ff8a2b' },
  { id: 'bb-443', name: 'Forneus F5', series: 'Burst', class: 'Balance', price: 1.79, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ForneusF5_Layer.obj`, texture: `${M}/ForneusF5_Layer_Color.png`, creator: 'Rare Bey Club', edition: '40 / 159', accent: '#35d4ff' },
  { id: 'bb-444', name: 'Gaianon G6', series: 'Burst', class: 'Attack', price: 2.88, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/GaianonG6_Layer.obj`, texture: `${M}/GaianonG6_Layer_Color.png`, creator: 'Burst Vault', edition: '29 / 148', accent: '#7a5cff' },
  { id: 'bb-445', name: 'Galaxy Zeutron Z5', series: 'Burst', class: 'Attack', price: 2.20, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/GalaxyZeutronZ5_Layer.obj`, texture: `${M}/GalaxyZeutronZ5_Layer_Color.png`, creator: 'Burst Vault', edition: '21 / 140', accent: '#7a5cff' },
  { id: 'bb-446', name: 'Gargoyle G4', series: 'Burst', class: 'Defense', price: 2.13, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/GargoyleG4_Layer.obj`, texture: `${M}/GargoyleG4_Layer_Color.png`, creator: 'WBBA Works', edition: '34 / 73', accent: '#10a5ff' },
  { id: 'bb-447', name: 'Gargoyle G5', series: 'Burst', class: 'Stamina', price: 2.14, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/GargoyleG5_Layer.obj`, texture: `${M}/GargoyleG5_Layer_Color.png`, creator: 'Beylocker', edition: '35 / 74', accent: '#ffd21e' },
  { id: 'bb-448', name: 'Gianon G4', series: 'Burst', class: 'Defense', price: 1.49, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/GianonG4_Layer.obj`, texture: `${M}/GianonG4_Layer_Color.png`, creator: 'WBBA Works', edition: '30 / 69', accent: '#00e0a8' },
  { id: 'bb-449', name: 'Glide Roktavor R6', series: 'Burst', class: 'Defense', price: 2.65, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/GlideRoktavorR6_Layer.obj`, texture: `${M}/GlideRoktavorR6_Layer_Color.png`, creator: 'WBBA Works', edition: '26 / 65', accent: '#10a5ff' },
  { id: 'bb-450', name: 'Glyph Dragon D5', series: 'Burst', class: 'Stamina', price: 2.30, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/GlyphDragonD5_Layer.obj`, texture: `${M}/GlyphDragonD5_Layer_Color.png`, creator: 'Beylocker', edition: '11 / 90', accent: '#ffd21e' },
  { id: 'bb-451', name: 'Glyph Pegasus', series: 'Burst', class: 'Attack', price: 1.72, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/GlyphPegasus_Layer.obj`, texture: `${M}/GlyphPegasus_Layer_Color.png`, creator: 'Burst Vault', edition: '33 / 152', accent: '#e11d2e' },
  { id: 'bb-452', name: 'Glyph Valtryek', series: 'Burst', class: 'Stamina', price: 1.94, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/GlyphValtryek_Layer.obj`, texture: `${M}/GlyphValtryek_Layer_Color.png`, creator: 'Beylocker', edition: '15 / 54', accent: '#ff8a2b' },
  { id: 'bb-453', name: 'GTJudgement Dragon', series: 'Burst', class: 'Defense', price: 2.17, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/GTJudgementDragon_Layer.obj`, texture: `${M}/GTJudgementDragon_Layer_Color.png`, creator: 'WBBA Works', edition: '38 / 77', accent: '#00e0a8' },
  { id: 'bb-454', name: 'Guard Draciel S', series: 'Burst', class: 'Stamina', price: 1.26, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/GuardDracielS_Layer.obj`, texture: `${M}/GuardDracielS_Layer_Color.png`, creator: 'Beylocker', edition: '27 / 106', accent: '#ffd21e' },
  { id: 'bb-455', name: 'Hades_H4', series: 'Burst', class: 'Attack', price: 2.72, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/Hades_H4_Layer.obj`, texture: `${M}/Hades_H4_Layer_Color.png`, creator: 'Burst Vault', edition: '13 / 132', accent: '#7a5cff' },
  { id: 'bb-456', name: 'Harmony Pegasus', series: 'Burst', class: 'Stamina', price: 1.22, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/HarmonyPegasus_Layer.obj`, texture: `${M}/HarmonyPegasus_Layer_Color.png`, creator: 'Beylocker', edition: '23 / 102', accent: '#ff8a2b' },
  { id: 'bb-457', name: 'Hazard Kerbeus_K4', series: 'Burst', class: 'Balance', price: 2.07, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/HazardKerbeus_K4_Layer.obj`, texture: `${M}/HazardKerbeus_K4_Layer_Color.png`, creator: 'Rare Bey Club', edition: '28 / 67', accent: '#c6ced8' },
  { id: 'bb-458', name: 'Hercules H4', series: 'Burst', class: 'Defense', price: 1.97, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/HerculesH4_Layer.obj`, texture: `${M}/HerculesH4_Layer_Color.png`, creator: 'WBBA Works', edition: '18 / 57', accent: '#10a5ff' },
  { id: 'bb-459', name: 'Hollow Doomscizor D6', series: 'Burst', class: 'Attack', price: 2.52, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/HollowDoomscizorD6_Layer.obj`, texture: `${M}/HollowDoomscizorD6_Layer_Color.png`, creator: 'Burst Vault', edition: '33 / 112', accent: '#e11d2e' },
  { id: 'bb-460', name: 'Hyperion Flamebringer H6', series: 'Burst', class: 'Attack', price: 2.60, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/HyperionFlamebringerH6_Layer.obj`, texture: `${M}/HyperionFlamebringerH6_Layer_Color.png`, creator: 'Burst Vault', edition: '01 / 120', accent: '#e11d2e' },
  { id: 'bb-461', name: 'Hyper Sphere_Lord Spryzen S5', series: 'Burst', class: 'Attack', price: 1.52, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/HyperSphere_LordSpryzenS5_Layer.obj`, texture: `${M}/HyperSphere_LordSpryzenS5_Layer_Color.png`, creator: 'Burst Vault', edition: '33 / 72', accent: '#e11d2e' },
  { id: 'bb-462', name: 'Hyrus', series: 'Burst', class: 'Defense', price: 2.61, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/Hyrus_Layer.obj`, texture: `${M}/Hyrus_Layer_Color.png`, creator: 'WBBA Works', edition: '02 / 121', accent: '#10a5ff' },
  { id: 'bb-463', name: 'Inferno Salamander', series: 'Burst', class: 'Balance', price: 2.75, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/InfernoSalamander_Layer.obj`, texture: `${M}/InfernoSalamander_Layer_Color.png`, creator: 'Rare Bey Club', edition: '36 / 75', accent: '#c6ced8' },
  { id: 'bb-464', name: 'Infinite Achilles A6', series: 'Burst', class: 'Attack', price: 2.04, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/InfiniteAchillesA6_Layer.obj`, texture: `${M}/InfiniteAchillesA6_Layer_Color.png`, creator: 'Burst Vault', edition: '05 / 124', accent: '#7a5cff' },
  { id: 'bb-465', name: 'Jet Wyvron W6', series: 'Burst', class: 'Balance', price: 2.07, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/JetWyvronW6_Layer.obj`, texture: `${M}/JetWyvronW6_Layer_Color.png`, creator: 'Rare Bey Club', edition: '08 / 127', accent: '#35d4ff' },
  { id: 'bb-466', name: 'Jinnius J3', series: 'Burst', class: 'Balance', price: 1.79, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/JinniusJ3_Layer.obj`, texture: `${M}/JinniusJ3_Layer_Color.png`, creator: 'Rare Bey Club', edition: '20 / 99', accent: '#c6ced8' },
  { id: 'bb-467', name: 'Jormunter J4', series: 'Burst', class: 'Attack', price: 2.36, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/JormunterJ4_Layer.obj`, texture: `${M}/JormunterJ4_Layer_Color.png`, creator: 'Burst Vault', edition: '37 / 156', accent: '#7a5cff' },
  { id: 'bb-468', name: 'Jormuntor J6', series: 'Burst', class: 'Attack', price: 2.48, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/JormuntorJ6_Layer.obj`, texture: `${M}/JormuntorJ6_Layer_Color.png`, creator: 'Burst Vault', edition: '29 / 108', accent: '#7a5cff' },
  { id: 'bb-469', name: 'Kerbeus K4', series: 'Burst', class: 'Attack', price: 2.36, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/KerbeusK4_Layer.obj`, texture: `${M}/KerbeusK4_Layer_Color.png`, creator: 'Burst Vault', edition: '37 / 156', accent: '#7a5cff' },
  { id: 'bb-470', name: 'King Helios H6', series: 'Burst', class: 'Defense', price: 1.45, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/KingHeliosH6_Layer.obj`, texture: `${M}/KingHeliosH6_Layer_Color.png`, creator: 'WBBA Works', edition: '06 / 125', accent: '#00e0a8' },
  { id: 'bb-471', name: 'Kolossal Fafnir F6', series: 'Burst', class: 'Attack', price: 2.72, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/KolossalFafnirF6_Layer.obj`, texture: `${M}/KolossalFafnirF6_Layer_Color.png`, creator: 'Burst Vault', edition: '33 / 72', accent: '#e11d2e' },
  { id: 'bb-472', name: 'Kolossal Helios H6', series: 'Burst', class: 'Attack', price: 1.88, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/KolossalHeliosH6_Layer.obj`, texture: `${M}/KolossalHeliosH6_Layer_Color.png`, creator: 'Burst Vault', edition: '09 / 48', accent: '#e11d2e' },
  { id: 'bb-473', name: 'Kraken K4', series: 'Burst', class: 'Defense', price: 2.41, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/KrakenK4_Layer.obj`, texture: `${M}/KrakenK4_Layer_Color.png`, creator: 'WBBA Works', edition: '22 / 101', accent: '#00e0a8' },
  { id: 'bb-474', name: 'Leopard L4', series: 'Burst', class: 'Balance', price: 1.59, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/LeopardL4_Layer.obj`, texture: `${M}/LeopardL4_Layer_Color.png`, creator: 'Rare Bey Club', edition: '20 / 139', accent: '#c6ced8' },
  { id: 'bb-475', name: 'Lord Hydrax', series: 'Burst', class: 'Defense', price: 2.65, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/LordHydrax_Layer.obj`, texture: `${M}/LordHydrax_Layer_Color.png`, creator: 'WBBA Works', edition: '06 / 125', accent: '#00e0a8' },
  { id: 'bb-476', name: 'Lord Spryzen S5', series: 'Burst', class: 'Stamina', price: 1.78, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/LordSpryzenS5_Layer.obj`, texture: `${M}/LordSpryzenS5_Layer_Color.png`, creator: 'Beylocker', edition: '39 / 158', accent: '#ff8a2b' },
  { id: 'bb-477', name: 'Luinor L4', series: 'Burst', class: 'Balance', price: 1.51, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/LuinorL4_Layer.obj`, texture: `${M}/LuinorL4_Layer_Color.png`, creator: 'Rare Bey Club', edition: '12 / 131', accent: '#c6ced8' },
  { id: 'bb-478', name: 'Master Devolos D5', series: 'Burst', class: 'Balance', price: 2.31, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/MasterDevolosD5_Layer.obj`, texture: `${M}/MasterDevolosD5_Layer_Color.png`, creator: 'Rare Bey Club', edition: '32 / 151', accent: '#35d4ff' },
  { id: 'bb-479', name: 'Master Devolos Pro Series', series: 'Burst', class: 'Stamina', price: 2.38, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/MasterDevolosProSeries_Layer.obj`, texture: `${M}/MasterDevolosProSeries_Layer_Color.png`, creator: 'Beylocker', edition: '19 / 98', accent: '#ffd21e' },
  { id: 'bb-480', name: 'Master Kerbeus K5', series: 'Burst', class: 'Balance', price: 2.11, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/MasterKerbeusK5_Layer.obj`, texture: `${M}/MasterKerbeusK5_Layer_Color.png`, creator: 'Rare Bey Club', edition: '12 / 131', accent: '#c6ced8' },
  { id: 'bb-481', name: 'Miniboros M6', series: 'Burst', class: 'Defense', price: 1.93, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/MiniborosM6_Layer.obj`, texture: `${M}/MiniborosM6_Layer_Color.png`, creator: 'WBBA Works', edition: '14 / 53', accent: '#00e0a8' },
  { id: 'bb-482', name: 'Mirage Devolos D6', series: 'Burst', class: 'Defense', price: 1.69, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/MirageDevolosD6_Layer.obj`, texture: `${M}/MirageDevolosD6_Layer_Color.png`, creator: 'WBBA Works', edition: '10 / 89', accent: '#10a5ff' },
  { id: 'bb-483', name: 'Mirage Helios H6', series: 'Burst', class: 'Balance', price: 2.23, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/MirageHeliosH6_Layer.obj`, texture: `${M}/MirageHeliosH6_Layer_Color.png`, creator: 'Rare Bey Club', edition: '24 / 143', accent: '#35d4ff' },
  { id: 'bb-484', name: 'Mirage Lunior L6', series: 'Burst', class: 'Attack', price: 1.96, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/MirageLuniorL6_Layer.obj`, texture: `${M}/MirageLuniorL6_Layer_Color.png`, creator: 'Burst Vault', edition: '37 / 116', accent: '#7a5cff' },
  { id: 'bb-485', name: 'Monster Devolos D5', series: 'Burst', class: 'Balance', price: 1.27, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/MonsterDevolosD5_Layer.obj`, texture: `${M}/MonsterDevolosD5_Layer_Color.png`, creator: 'Rare Bey Club', edition: '08 / 47', accent: '#35d4ff' },
  { id: 'bb-486', name: 'Monster Ogre O5', series: 'Burst', class: 'Defense', price: 2.73, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/MonsterOgreO5_Layer.obj`, texture: `${M}/MonsterOgreO5_Layer_Color.png`, creator: 'WBBA Works', edition: '14 / 133', accent: '#00e0a8' },
  { id: 'bb-487', name: 'Morrigna M4', series: 'Burst', class: 'Attack', price: 2.80, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/MorrignaM4_Layer.obj`, texture: `${M}/MorrignaM4_Layer_Color.png`, creator: 'Burst Vault', edition: '21 / 140', accent: '#7a5cff' },
  { id: 'bb-488', name: 'Morrigna M5', series: 'Burst', class: 'Defense', price: 2.81, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/MorrignaM5_Layer.obj`, texture: `${M}/MorrignaM5_Layer_Color.png`, creator: 'WBBA Works', edition: '22 / 141', accent: '#00e0a8' },
  { id: 'bb-489', name: 'Myth Evo Dragon D5', series: 'Burst', class: 'Attack', price: 1.96, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/MythEvoDragonD5_Layer.obj`, texture: `${M}/MythEvoDragonD5_Layer_Color.png`, creator: 'Burst Vault', edition: '37 / 116', accent: '#7a5cff' },
  { id: 'bb-490', name: 'Myth Odax', series: 'Burst', class: 'Stamina', price: 1.94, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/MythOdax_Layer.obj`, texture: `${M}/MythOdax_Layer_Color.png`, creator: 'Beylocker', edition: '15 / 54', accent: '#ff8a2b' },
  { id: 'bb-491', name: 'Nepstrius N4', series: 'Burst', class: 'Balance', price: 1.23, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/NepstriusN4_Layer.obj`, texture: `${M}/NepstriusN4_Layer_Color.png`, creator: 'Rare Bey Club', edition: '24 / 103', accent: '#35d4ff' },
  { id: 'bb-492', name: 'Odax O6', series: 'Burst', class: 'Defense', price: 1.85, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/OdaxO6_Layer.obj`, texture: `${M}/OdaxO6_Layer_Color.png`, creator: 'WBBA Works', edition: '06 / 45', accent: '#00e0a8' },
  { id: 'bb-493', name: 'Ogre O4', series: 'Burst', class: 'Stamina', price: 2.42, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/OgreO4_Layer.obj`, texture: `${M}/OgreO4_Layer_Color.png`, creator: 'Beylocker', edition: '03 / 42', accent: '#ffd21e' },
  { id: 'bb-494', name: 'Orb Engaard', series: 'Burst', class: 'Balance', price: 2.15, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/OrbEngaard_Layer.obj`, texture: `${M}/OrbEngaard_Layer_Color.png`, creator: 'Rare Bey Club', edition: '36 / 75', accent: '#c6ced8' },
  { id: 'bb-495', name: 'Orichalcum', series: 'Burst', class: 'Balance', price: 2.31, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/Orichalcum_Layer.obj`, texture: `${M}/Orichalcum_Layer_Color.png`, creator: 'Rare Bey Club', edition: '32 / 151', accent: '#35d4ff' },
  { id: 'bb-496', name: 'Origin Achilles A6', series: 'Burst', class: 'Stamina', price: 2.94, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/OriginAchillesA6_Layer.obj`, texture: `${M}/OriginAchillesA6_Layer_Color.png`, creator: 'Beylocker', edition: '15 / 94', accent: '#ff8a2b' },
  { id: 'bb-497', name: 'Perfect Phoenix P4', series: 'Burst', class: 'Attack', price: 2.24, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/PerfectPhoenixP4_Layer.obj`, texture: `${M}/PerfectPhoenixP4_Layer_Color.png`, creator: 'Burst Vault', edition: '25 / 144', accent: '#e11d2e' },
  { id: 'bb-498', name: 'Perfect Phoenix', series: 'Burst', class: 'Attack', price: 2.56, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/PerfectPhoenix_Layer.obj`, texture: `${M}/PerfectPhoenix_Layer_Color.png`, creator: 'Burst Vault', edition: '37 / 116', accent: '#7a5cff' },
  { id: 'bb-499', name: 'Phantom Driger S', series: 'Burst', class: 'Balance', price: 1.43, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/PhantomDrigerS_Layer.obj`, texture: `${M}/PhantomDrigerS_Layer_Color.png`, creator: 'Rare Bey Club', edition: '24 / 63', accent: '#35d4ff' },
  { id: 'bb-500', name: 'Pheonix P4', series: 'Burst', class: 'Defense', price: 1.69, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/PheonixP4_Layer.obj`, texture: `${M}/PheonixP4_Layer_Color.png`, creator: 'WBBA Works', edition: '10 / 89', accent: '#10a5ff' },
  { id: 'bb-501', name: 'Premium_Ace Dragon D5', series: 'Burst', class: 'Defense', price: 1.57, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/Premium_AceDragonD5_Layer.obj`, texture: `${M}/Premium_AceDragonD5_Layer_Color.png`, creator: 'WBBA Works', edition: '18 / 137', accent: '#10a5ff' },
  { id: 'bb-502', name: 'Premium_Force Worlborg', series: 'Burst', class: 'Defense', price: 1.33, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/Premium_ForceWorlborg_Layer.obj`, texture: `${M}/Premium_ForceWorlborg_Layer_Color.png`, creator: 'WBBA Works', edition: '34 / 113', accent: '#10a5ff' },
  { id: 'bb-503', name: 'Premium_Harmony Pegasus', series: 'Burst', class: 'Stamina', price: 2.22, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/Premium_HarmonyPegasus_Layer.obj`, texture: `${M}/Premium_HarmonyPegasus_Layer_Color.png`, creator: 'Beylocker', edition: '23 / 142', accent: '#ff8a2b' },
  { id: 'bb-504', name: 'Premium_Royal Genesis G5', series: 'Burst', class: 'Defense', price: 1.37, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/Premium_RoyalGenesisG5_Layer.obj`, texture: `${M}/Premium_RoyalGenesisG5_Layer_Color.png`, creator: 'WBBA Works', edition: '18 / 57', accent: '#10a5ff' },
  { id: 'bb-505', name: 'Premium_Viper Hydra H5', series: 'Burst', class: 'Balance', price: 2.43, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/Premium_ViperHydraH5_Layer.obj`, texture: `${M}/Premium_ViperHydraH5_Layer_Color.png`, creator: 'Rare Bey Club', edition: '24 / 103', accent: '#35d4ff' },
  { id: 'bb-506', name: 'Prime Apocalypse A5', series: 'Burst', class: 'Attack', price: 2.72, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/PrimeApocalypseA5_Layer.obj`, texture: `${M}/PrimeApocalypseA5_Layer_Color.png`, creator: 'Burst Vault', edition: '13 / 132', accent: '#7a5cff' },
  { id: 'bb-507', name: 'Pro Series_Perfect Phoenix P4', series: 'Burst', class: 'Balance', price: 2.67, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ProSeries_PerfectPhoenixP4_Layer.obj`, texture: `${M}/ProSeries_PerfectPhoenixP4_Layer_Color.png`, creator: 'Rare Bey Club', edition: '28 / 67', accent: '#c6ced8' },
  { id: 'bb-508', name: 'Pro Soul Balkesh', series: 'Burst', class: 'Stamina', price: 1.94, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ProSoulBalkesh_Layer.obj`, texture: `${M}/ProSoulBalkesh_Layer_Color.png`, creator: 'Beylocker', edition: '15 / 54', accent: '#ff8a2b' },
  { id: 'bb-509', name: 'Raid Lunior L6', series: 'Burst', class: 'Defense', price: 2.89, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/RaidLuniorL6_Layer.obj`, texture: `${M}/RaidLuniorL6_Layer_Color.png`, creator: 'WBBA Works', edition: '30 / 149', accent: '#00e0a8' },
  { id: 'bb-510', name: 'Regulus R3', series: 'Burst', class: 'Attack', price: 2.60, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/RegulusR3_Layer.obj`, texture: `${M}/RegulusR3_Layer_Color.png`, creator: 'Burst Vault', edition: '21 / 60', accent: '#7a5cff' },
  { id: 'bb-511', name: 'Regulus R6', series: 'Burst', class: 'Balance', price: 1.87, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/RegulusR6_Layer.obj`, texture: `${M}/RegulusR6_Layer_Color.png`, creator: 'Rare Bey Club', edition: '08 / 47', accent: '#35d4ff' },
  { id: 'bb-512', name: 'Rocktavor R4', series: 'Burst', class: 'Balance', price: 2.59, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/RocktavorR4_Layer.obj`, texture: `${M}/RocktavorR4_Layer_Color.png`, creator: 'Rare Bey Club', edition: '20 / 59', accent: '#c6ced8' },
  { id: 'bb-513', name: 'Roktavor R5', series: 'Burst', class: 'Balance', price: 2.95, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/RoktavorR5_Layer.obj`, texture: `${M}/RoktavorR5_Layer_Color.png`, creator: 'Rare Bey Club', edition: '36 / 155', accent: '#c6ced8' },
  { id: 'bb-514', name: 'Royal Genesis G5', series: 'Burst', class: 'Defense', price: 2.17, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/RoyalGenesisG5_Layer.obj`, texture: `${M}/RoyalGenesisG5_Layer_Color.png`, creator: 'WBBA Works', edition: '18 / 137', accent: '#10a5ff' },
  { id: 'bb-515', name: 'Rudr R4', series: 'Burst', class: 'Defense', price: 2.69, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/RudrR4_Layer.obj`, texture: `${M}/RudrR4_Layer_Color.png`, creator: 'WBBA Works', edition: '30 / 69', accent: '#00e0a8' },
  { id: 'bb-516', name: 'Salamander S4', series: 'Burst', class: 'Defense', price: 2.61, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/SalamanderS4_Layer.obj`, texture: `${M}/SalamanderS4_Layer_Color.png`, creator: 'WBBA Works', edition: '22 / 61', accent: '#00e0a8' },
  { id: 'bb-517', name: 'Shield Kerbeus K5', series: 'Burst', class: 'Attack', price: 1.52, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ShieldKerbeusK5_Layer.obj`, texture: `${M}/ShieldKerbeusK5_Layer_Color.png`, creator: 'Burst Vault', edition: '13 / 132', accent: '#7a5cff' },
  { id: 'bb-518', name: 'Shield Kraken K5', series: 'Burst', class: 'Balance', price: 1.67, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ShieldKrakenK5_Layer.obj`, texture: `${M}/ShieldKrakenK5_Layer_Color.png`, creator: 'Rare Bey Club', edition: '08 / 87', accent: '#35d4ff' },
  { id: 'bb-519', name: 'Sling Shock_Xcalius_X4', series: 'Burst', class: 'Stamina', price: 2.38, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/SlingShock_Xcalius_X4_Layer.obj`, texture: `${M}/SlingShock_Xcalius_X4_Layer_Color.png`, creator: 'Beylocker', edition: '19 / 98', accent: '#ffd21e' },
  { id: 'bb-520', name: 'Soul Luinor L5', series: 'Burst', class: 'Balance', price: 2.83, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/SoulLuinorL5_Layer.obj`, texture: `${M}/SoulLuinorL5_Layer_Color.png`, creator: 'Rare Bey Club', edition: '24 / 143', accent: '#35d4ff' },
  { id: 'bb-521', name: 'Spear Dullahan D6', series: 'Burst', class: 'Stamina', price: 2.94, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/SpearDullahanD6_Layer.obj`, texture: `${M}/SpearDullahanD6_Layer_Color.png`, creator: 'Beylocker', edition: '35 / 154', accent: '#ffd21e' },
  { id: 'bb-522', name: 'Spear Hyperion H6', series: 'Burst', class: 'Defense', price: 2.53, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/SpearHyperionH6_Layer.obj`, texture: `${M}/SpearHyperionH6_Layer_Color.png`, creator: 'WBBA Works', edition: '14 / 53', accent: '#00e0a8' },
  { id: 'bb-523', name: 'Spear Valtryek V6', series: 'Burst', class: 'Balance', price: 2.43, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/SpearValtryekV6_Layer.obj`, texture: `${M}/SpearValtryekV6_Layer_Color.png`, creator: 'Rare Bey Club', edition: '04 / 43', accent: '#c6ced8' },
  { id: 'bb-524', name: 'Sphinx S4', series: 'Burst', class: 'Balance', price: 1.27, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/SphinxS4_Layer.obj`, texture: `${M}/SphinxS4_Layer_Color.png`, creator: 'Rare Bey Club', edition: '28 / 107', accent: '#c6ced8' },
  { id: 'bb-525', name: 'Spiral Treptune T4', series: 'Burst', class: 'Attack', price: 2.40, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/SpiralTreptuneT4_Layer.obj`, texture: `${M}/SpiralTreptuneT4_Layer_Color.png`, creator: 'Burst Vault', edition: '21 / 100', accent: '#7a5cff' },
  { id: 'bb-526', name: 'Spryzen S5', series: 'Burst', class: 'Balance', price: 1.87, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/SpryzenS5_Layer.obj`, texture: `${M}/SpryzenS5_Layer_Color.png`, creator: 'Rare Bey Club', edition: '28 / 107', accent: '#c6ced8' },
  { id: 'bb-527', name: 'Super Hyperion H6', series: 'Burst', class: 'Balance', price: 2.63, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/SuperHyperionH6_Layer.obj`, texture: `${M}/SuperHyperionH6_Layer_Color.png`, creator: 'Rare Bey Club', edition: '24 / 63', accent: '#35d4ff' },
  { id: 'bb-528', name: 'Super Satomb S6', series: 'Burst', class: 'Stamina', price: 1.90, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/SuperSatombS6_Layer.obj`, texture: `${M}/SuperSatombS6_Layer_Color.png`, creator: 'Beylocker', edition: '31 / 110', accent: '#ff8a2b' },
  { id: 'bb-529', name: 'Sword Achilles A5', series: 'Burst', class: 'Attack', price: 2.68, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/SwordAchillesA5_Layer.obj`, texture: `${M}/SwordAchillesA5_Layer_Color.png`, creator: 'Burst Vault', edition: '29 / 68', accent: '#7a5cff' },
  { id: 'bb-530', name: 'Sword Dragon D5', series: 'Burst', class: 'Balance', price: 1.95, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/SwordDragonD5_Layer.obj`, texture: `${M}/SwordDragonD5_Layer_Color.png`, creator: 'Rare Bey Club', edition: '36 / 115', accent: '#c6ced8' },
  { id: 'bb-531', name: 'Tact Leviathan L5', series: 'Burst', class: 'Balance', price: 2.79, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/TactLeviathanL5_Layer.obj`, texture: `${M}/TactLeviathanL5_Layer_Color.png`, creator: 'Rare Bey Club', edition: '20 / 139', accent: '#c6ced8' },
  { id: 'bb-532', name: 'Treptune T4', series: 'Burst', class: 'Balance', price: 1.51, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/TreptuneT4_Layer.obj`, texture: `${M}/TreptuneT4_Layer_Color.png`, creator: 'Rare Bey Club', edition: '12 / 131', accent: '#c6ced8' },
  { id: 'bb-533', name: 'Triumph Devolos D6', series: 'Burst', class: 'Balance', price: 2.51, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/TriumphDevolosD6_Layer.obj`, texture: `${M}/TriumphDevolosD6_Layer_Color.png`, creator: 'Rare Bey Club', edition: '32 / 111', accent: '#35d4ff' },
  { id: 'bb-534', name: 'Triumph Dragon D6', series: 'Burst', class: 'Stamina', price: 1.22, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/TriumphDragonD6_Layer.obj`, texture: `${M}/TriumphDragonD6_Layer_Color.png`, creator: 'Beylocker', edition: '03 / 42', accent: '#ffd21e' },
  { id: 'bb-535', name: 'Typhon T4', series: 'Burst', class: 'Stamina', price: 2.26, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/TyphonT4_Layer.obj`, texture: `${M}/TyphonT4_Layer_Color.png`, creator: 'Beylocker', edition: '07 / 86', accent: '#ff8a2b' },
  { id: 'bb-536', name: 'Typhon T5', series: 'Burst', class: 'Balance', price: 1.51, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/TyphonT5_Layer.obj`, texture: `${M}/TyphonT5_Layer_Color.png`, creator: 'Rare Bey Club', edition: '32 / 71', accent: '#35d4ff' },
  { id: 'bb-537', name: 'Tyros T6', series: 'Burst', class: 'Defense', price: 2.21, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/TyrosT6_Layer.obj`, texture: `${M}/TyrosT6_Layer_Color.png`, creator: 'WBBA Works', edition: '22 / 141', accent: '#00e0a8' },
  { id: 'bb-538', name: 'Union Achilles A5', series: 'Burst', class: 'Stamina', price: 2.98, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/UnionAchillesA5_Layer.obj`, texture: `${M}/UnionAchillesA5_Layer_Color.png`, creator: 'Beylocker', edition: '39 / 158', accent: '#ff8a2b' },
  { id: 'bb-539', name: 'Union Valtryek', series: 'Burst', class: 'Defense', price: 1.89, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/UnionValtryek_Layer.obj`, texture: `${M}/UnionValtryek_Layer_Color.png`, creator: 'WBBA Works', edition: '10 / 49', accent: '#10a5ff' },
  { id: 'bb-540', name: 'V4', series: 'Burst', class: 'Attack', price: 2.40, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/V4_Layer.obj`, texture: `${M}/V4_Layer_Color.png`, creator: 'Burst Vault', edition: '01 / 40', accent: '#e11d2e' },
  { id: 'bb-541', name: 'Valtryek_V5', series: 'Burst', class: 'Attack', price: 2.24, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/Valtryek_V5_Layer.obj`, texture: `${M}/Valtryek_V5_Layer_Color.png`, creator: 'Burst Vault', edition: '25 / 144', accent: '#e11d2e' },
  { id: 'bb-542', name: 'Venom Diabolos D5', series: 'Burst', class: 'Balance', price: 2.79, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/VenomDiabolosD5_Layer.obj`, texture: `${M}/VenomDiabolosD5_Layer_Color.png`, creator: 'Rare Bey Club', edition: '40 / 79', accent: '#35d4ff' },
  { id: 'bb-543', name: 'Vex Dragon D6', series: 'Burst', class: 'Attack', price: 2.12, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/VexDragonD6_Layer.obj`, texture: `${M}/VexDragonD6_Layer_Color.png`, creator: 'Burst Vault', edition: '33 / 72', accent: '#e11d2e' },
  { id: 'bb-544', name: 'Vex Lucius L6', series: 'Burst', class: 'Stamina', price: 1.82, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/VexLuciusL6_Layer.obj`, texture: `${M}/VexLuciusL6_Layer_Color.png`, creator: 'Beylocker', edition: '03 / 42', accent: '#ffd21e' },
  { id: 'bb-545', name: 'Virtual Championship', series: 'Burst', class: 'Stamina', price: 1.34, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/VirtualChampionship_Layer.obj`, texture: `${M}/VirtualChampionship_Layer_Color.png`, creator: 'Beylocker', edition: '35 / 114', accent: '#ffd21e' },
  { id: 'bb-546', name: 'Wizard Luinor L5', series: 'Burst', class: 'Balance', price: 1.87, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/WizardLuinorL5_Layer.obj`, texture: `${M}/WizardLuinorL5_Layer_Color.png`, creator: 'Rare Bey Club', edition: '08 / 47', accent: '#35d4ff' },
  { id: 'bb-547', name: 'Worlborg', series: 'Burst', class: 'Stamina', price: 1.34, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/Worlborg_Layer.obj`, texture: `${M}/Worlborg_Layer_Color.png`, creator: 'Beylocker', edition: '15 / 54', accent: '#ff8a2b' },
  { id: 'bb-548', name: 'World Evo Helios H6', series: 'Burst', class: 'Stamina', price: 2.74, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/WorldEvoHeliosH6_Layer.obj`, texture: `${M}/WorldEvoHeliosH6_Layer_Color.png`, creator: 'Beylocker', edition: '35 / 74', accent: '#ffd21e' },
  { id: 'bb-549', name: 'World Spryzen S6', series: 'Burst', class: 'Stamina', price: 2.86, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/WorldSpryzenS6_Layer.obj`, texture: `${M}/WorldSpryzenS6_Layer_Color.png`, creator: 'Beylocker', edition: '27 / 146', accent: '#ffd21e' },
  { id: 'bb-550', name: 'Wraith Driger F', series: 'Burst', class: 'Attack', price: 1.24, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/WraithDrigerF_Layer.obj`, texture: `${M}/WraithDrigerF_Layer_Color.png`, creator: 'Burst Vault', edition: '25 / 104', accent: '#e11d2e' },
  { id: 'bb-551', name: 'Wyvron W6', series: 'Burst', class: 'Stamina', price: 2.14, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/WyvronW6_Layer.obj`, texture: `${M}/WyvronW6_Layer_Color.png`, creator: 'Beylocker', edition: '15 / 134', accent: '#ff8a2b' },
  { id: 'bb-552', name: 'Xcalius_X4', series: 'Burst', class: 'Attack', price: 2.96, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/Xcalius_X4_Layer.obj`, texture: `${M}/Xcalius_X4_Layer_Color.png`, creator: 'Burst Vault', edition: '37 / 156', accent: '#7a5cff' },
  { id: 'bb-553', name: 'Zeutron Z4', series: 'Burst', class: 'Balance', price: 2.71, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ZeutronZ4_Layer.obj`, texture: `${M}/ZeutronZ4_Layer_Color.png`, creator: 'Rare Bey Club', edition: '12 / 131', accent: '#c6ced8' },
  { id: 'bb-554', name: 'Zone Balkesh B5', series: 'Burst', class: 'Defense', price: 1.89, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ZoneBalkeshB5_Layer.obj`, texture: `${M}/ZoneBalkeshB5_Layer_Color.png`, creator: 'WBBA Works', edition: '30 / 109', accent: '#00e0a8' },
  { id: 'bb-555', name: 'Zone Balkesh', series: 'Burst', class: 'Stamina', price: 2.06, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ZoneBalkesh_Layer.obj`, texture: `${M}/ZoneBalkesh_Layer_Color.png`, creator: 'Beylocker', edition: '27 / 66', accent: '#ffd21e' },
  { id: 'bb-556', name: 'Zone Fafnir F5', series: 'Burst', class: 'Defense', price: 2.45, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ZoneFafnirF5_Layer.obj`, texture: `${M}/ZoneFafnirF5_Layer_Color.png`, creator: 'WBBA Works', edition: '26 / 105', accent: '#10a5ff' },
  { id: 'bb-557', name: 'Zone Luinor L5', series: 'Burst', class: 'Attack', price: 1.76, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ZoneLuinorL5_Layer.obj`, texture: `${M}/ZoneLuinorL5_Layer_Color.png`, creator: 'Burst Vault', edition: '17 / 96', accent: '#e11d2e' },
  { id: 'bb-558', name: 'Zwei Lunior', series: 'Burst', class: 'Stamina', price: 2.70, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ZweiLunior_Layer.obj`, texture: `${M}/ZweiLunior_Layer_Color.png`, creator: 'Beylocker', edition: '11 / 130', accent: '#ffd21e' },

  // Remaining recovered meshes that had no listing.
  { id: 'bb-366', name: 'Union Achilles A5', series: 'Burst', class: 'Balance', price: 2.22, image: `${BC}/battle_menu_toy_battle_imagery.png`, model: `${M}/achillesa5uniongeo.fbx`, creator: 'WBBA Works', edition: '11 / 118', accent: '#f0aa21' },
  { id: 'bb-367', name: 'Cho-Z Achilles (Onyx)', series: 'Burst', class: 'Attack', price: 1.94, image: `${BC}/ArenaThumb_QuadstrikeCreature.png`, model: `${M}/achillescho-zblackgeo.fbx`, creator: 'WBBA Works', edition: '22 / 90', accent: '#2a8cff' },
  { id: 'bb-368', name: 'Mirage Fafnir F6', series: 'Burst', class: 'Stamina', price: 2.16, image: `${BC}/ArenaThumb_HyperSphere.png`, model: `${M}/fafnirf6miragegeo.fbx`, creator: 'Burst Vault', edition: '17 / 134', accent: '#3dbf6a' },
  { id: 'bb-369', name: 'Kolossal Helios H6', series: 'Burst', class: 'Attack', price: 2.31, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/heliosh6kolossalgeo.fbx`, creator: 'Burst Vault', edition: '09 / 88', accent: '#ffd84f' },
  { id: 'bb-370', name: 'Super Hyperion H6 (Rev A)', series: 'Burst', class: 'Attack', price: 2.02, image: `${BC}/battle_menu_toy_battle_imagery.png`, model: `${M}/hyperionh6supergeo.fbx`, creator: 'Burst Vault', edition: '26 / 105', accent: '#35d4ff' },
  { id: 'bb-371', name: 'Perfect Phoenix P4', series: 'Burst', class: 'Stamina', price: 2.44, image: `${BC}/ArenaThumb_QuadstrikeCreature.png`, model: `${M}/phoenixp4perfectv2geo.fbx`, creator: 'Burst Vault', edition: '04 / 62', accent: '#ff6b4a' },
  { id: 'bb-372', name: 'Quad Roktavor R2', series: 'Burst', class: 'Attack', price: 1.88, image: `${BC}/ArenaThumb_Quadstrike.png`, model: `${M}/roktavorqgeo_v3.fbx`, creator: 'Burst Vault', edition: '35 / 150', accent: '#ff8a2b' },
  { id: 'bb-373', name: 'Brave Roktavor R6 (Pro)', series: 'Burst', class: 'Attack', price: 2.08, image: `${BC}/ArenaThumb_Quadstrike.png`, model: `${M}/roktavorr6bravegeo.fbx`, creator: 'Burst Vault', edition: '13 / 126', accent: '#ffa23a' },
  { id: 'bb-374', name: 'Spryzen Requiem S3', series: 'Burst', class: 'Balance', price: 2.61, image: `${BC}/battle_menu_imagery_battle_friend.png`, model: `${M}/spryzenrequiemgeo.fbx`, creator: 'Burst Vault', edition: '06 / 70', accent: '#ff3d61' },
  { id: 'bb-375', name: 'Ultimate Spryzen Requiem', series: 'Burst', class: 'Balance', price: 2.95, image: `${BC}/battle_menu_imagery_battle_friend.png`, model: `${M}/spryzenrequiemultimategeo.fbx`, creator: 'Rare Bey Club', edition: '02 / 40', accent: '#c0c8d4' },
  { id: 'bx-154', name: 'Arena Square (Alt)', series: 'X', class: 'Arena', price: 1.72, image: `${XC}/bg-waiting-01.png`, model: `${M}/arenasquarealt.fbx`, creator: 'Stadium Works', edition: '12 / 96', accent: '#fffd00' },


  // Layers recovered in the full catalogue sweep.
  { id: 'bb-559', name: 'Ace Dragon D5', series: 'Burst', class: 'Attack', price: 1.60, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/AceDragonD5GeoV2.fbx`, texture: `${M}/AceDragonD5_Layer_Color.png`, creator: 'Burst Vault', edition: '21 / 100', accent: '#8b5cf6' },
  { id: 'bb-560', name: 'Ace Dragon D5Premium', series: 'Burst', class: 'Attack', price: 2.47, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/AceDragonD5PremiumGeoV2.fbx`, creator: 'Beylocker', edition: '28 / 137', accent: '#c6ced8' },
  { id: 'bb-561', name: 'Achilles A4', series: 'Burst', class: 'Attack', price: 1.95, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/AchillesA4GeoV2.fbx`, creator: 'Beylocker', edition: '16 / 105', accent: '#06b6d4' },
  { id: 'bb-562', name: 'Achilles A4Turbo', series: 'Burst', class: 'Attack', price: 1.41, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/AchillesA4TurboGeoV2.fbx`, creator: 'WBBA Works', edition: '02 / 181', accent: '#10a5ff' },
  { id: 'bb-563', name: 'Achilles A8', series: 'Burst', class: 'Attack', price: 2.04, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/AchillesA8Geo_V2.fbx`, creator: 'Burst Vault', edition: '25 / 114', accent: '#e11d2e' },
  { id: 'bb-564', name: 'Achilles V2', series: 'Burst', class: 'Attack', price: 2.86, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/AchillesV2Geo.fbx`, creator: 'Rare Bey Club', edition: '27 / 116', accent: '#ffd21e' },
  { id: 'bb-565', name: 'Air Knight K4', series: 'Burst', class: 'Attack', price: 2.03, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/AirKnightK4Geo.fbx`, texture: `${M}/AirKnightK4_Layer_Color.png`, creator: 'Beylocker', edition: '24 / 123', accent: '#06b6d4' },
  { id: 'bb-566', name: 'Air Knight K5', series: 'Burst', class: 'Attack', price: 2.02, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/AirKnightK5Geo.fbx`, creator: 'Rare Bey Club', edition: '23 / 162', accent: '#f97316' },
  { id: 'bb-567', name: 'Anubion A4', series: 'Burst', class: 'Balance', price: 2.98, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/AnubionA4Geo.fbx`, texture: `${M}/AnubionA4_Layer_Color.png`, creator: 'Rare Bey Club', edition: '39 / 108', accent: '#f97316' },
  { id: 'bb-568', name: 'Apocalypse A5Prime', series: 'Burst', class: 'Balance', price: 1.51, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ApocalypseA5PrimeGeo.fbx`, creator: 'Beylocker', edition: '12 / 121', accent: '#c6ced8' },
  { id: 'bb-569', name: 'Balderov B7', series: 'Burst', class: 'Balance', price: 1.71, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/BalderovB7Geo.fbx`, creator: 'Beylocker', edition: '32 / 181', accent: '#06b6d4' },
  { id: 'bb-570', name: 'Balkesh B5', series: 'Burst', class: 'Stamina', price: 2.52, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/BalkeshB5Geo.fbx`, creator: 'Burst Vault', edition: '33 / 112', accent: '#e11d2e' },
  { id: 'bb-571', name: 'Balkesh B7', series: 'Burst', class: 'Stamina', price: 2.45, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/BalkeshB7Geo_V2.fbx`, creator: 'WBBA Works', edition: '26 / 135', accent: '#10a5ff' },
  { id: 'bb-572', name: 'Balor B4', series: 'Burst', class: 'Defense', price: 2.65, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/BalorB4Geo.fbx`, texture: `${M}/BalorB4_Layer_Color.png`, creator: 'WBBA Works', edition: '06 / 135', accent: '#22c55e' },
  { id: 'bb-573', name: 'Bazilisk B8', series: 'Burst', class: 'Balance', price: 2.74, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/BaziliskB8Geo.fbx`, creator: 'Rare Bey Club', edition: '15 / 104', accent: '#f97316' },
  { id: 'bb-574', name: 'Belfyre B7', series: 'Burst', class: 'Attack', price: 2.63, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/BelfyreB7Geo.fbx`, creator: 'Beylocker', edition: '04 / 103', accent: '#c6ced8' },
  { id: 'bb-575', name: 'Betromoth B4', series: 'Burst', class: 'Defense', price: 1.81, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/BetromothB4Geo.fbx`, creator: 'WBBA Works', edition: '02 / 141', accent: '#10a5ff' },
  { id: 'bb-576', name: 'Betromoth B6', series: 'Burst', class: 'Defense', price: 2.75, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/BetromothB6Geo.fbx`, texture: `${M}/BetromothB6_Layer_Color.png`, creator: 'Beylocker', edition: '16 / 115', accent: '#06b6d4' },
  { id: 'bb-577', name: 'Bushin Ashindra A5', series: 'Burst', class: 'Balance', price: 2.10, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/BushinAshindraA5Geo.fbx`, creator: 'Rare Bey Club', edition: '31 / 130', accent: '#f97316' },
  { id: 'bb-578', name: 'Cobra C7', series: 'Burst', class: 'Balance', price: 1.78, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/CobraC7Geo.fbx`, creator: 'Rare Bey Club', edition: '39 / 148', accent: '#f97316' },
  { id: 'bb-579', name: 'Dead Phoenix P4', series: 'Burst', class: 'Balance', price: 2.20, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/DeadPhoenixP4Geo.fbx`, texture: `${M}/DeadPhoenixP4_Layer_Color.png`, creator: 'Burst Vault', edition: '01 / 100', accent: '#e11d2e' },
  { id: 'bb-580', name: 'Diomedes D4', series: 'Burst', class: 'Balance', price: 2.03, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/DiomedesD4Geo.fbx`, texture: `${M}/DiomedesD4_Layer_Color.png`, creator: 'Beylocker', edition: '24 / 123', accent: '#06b6d4' },
  { id: 'bb-581', name: 'Draciel SV2', series: 'Burst', class: 'Balance', price: 1.88, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/DracielSV2Geo.fbx`, creator: 'Burst Vault', edition: '09 / 118', accent: '#e11d2e' },
  { id: 'bb-582', name: 'Dragon D8', series: 'Burst', class: 'Attack', price: 2.67, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/DragonD8Geo_V2.fbx`, creator: 'Beylocker', edition: '08 / 117', accent: '#06b6d4' },
  { id: 'bb-583', name: 'Dullahan D4', series: 'Burst', class: 'Balance', price: 1.82, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/DullahanD4Geo.fbx`, texture: `${M}/DullahanD4_Layer_Color.png`, creator: 'Rare Bey Club', edition: '03 / 182', accent: '#ffd21e' },
  { id: 'bb-584', name: 'Dullahan D5', series: 'Burst', class: 'Balance', price: 2.77, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/DullahanD5Geo.fbx`, texture: `${M}/DullahanD5_Layer_Color.png`, creator: 'WBBA Works', edition: '18 / 117', accent: '#10a5ff' },
  { id: 'bb-585', name: 'Engaard E4', series: 'Burst', class: 'Defense', price: 2.68, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/EngaardE4Geo.fbx`, texture: `${M}/EngaardE4_EgisE4_Layer_Color.png`, creator: 'Burst Vault', edition: '09 / 138', accent: '#e11d2e' },
  { id: 'bb-586', name: 'Engaard E5', series: 'Burst', class: 'Defense', price: 2.67, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/EngaardE5Geo.fbx`, texture: `${M}/EngaardE5_Layer_Color.png`, creator: 'Beylocker', edition: '08 / 177', accent: '#06b6d4' },
  { id: 'bb-587', name: 'Evo Belfyre B7', series: 'Burst', class: 'Attack', price: 2.93, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/EvoBelfyreB7Geo.fbx`, creator: 'WBBA Works', edition: '34 / 163', accent: '#10a5ff' },
  { id: 'bb-588', name: 'Evo Belfyre B8', series: 'Burst', class: 'Attack', price: 2.28, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/EvoBelfyreB8Geo.fbx`, creator: 'Burst Vault', edition: '09 / 188', accent: '#e11d2e' },
  { id: 'bb-589', name: 'Evo Valtryek V8', series: 'Burst', class: 'Attack', price: 2.03, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/EvoValtryekV8Geo.fbx`, creator: 'Beylocker', edition: '24 / 183', accent: '#06b6d4' },
  { id: 'bb-590', name: 'Evo XBelfyre B8', series: 'Burst', class: 'Attack', price: 2.56, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/EvoXBelfyreB8Geo.fbx`, creator: 'Burst Vault', edition: '37 / 146', accent: '#8b5cf6' },
  { id: 'bb-591', name: 'Fafnir F4', series: 'Burst', class: 'Stamina', price: 2.73, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/FafnirF4Geo.fbx`, texture: `${M}/FafnirF4_Layer_Color.png`, creator: 'WBBA Works', edition: '14 / 153', accent: '#22c55e' },
  { id: 'bb-592', name: 'Fafnir F7', series: 'Burst', class: 'Stamina', price: 2.57, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/FafnirF7Geo_V2.fbx`, creator: 'WBBA Works', edition: '38 / 177', accent: '#22c55e' },
  { id: 'bb-593', name: 'Fengriff2', series: 'Burst', class: 'Balance', price: 1.68, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/Fengriff2Geo.fbx`, creator: 'Burst Vault', edition: '29 / 118', accent: '#8b5cf6' },
  { id: 'bb-594', name: 'Gaianon G6', series: 'Burst', class: 'Stamina', price: 2.89, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/GaianonG6Geo.fbx`, texture: `${M}/GaianonG6_Layer_Color.png`, creator: 'WBBA Works', edition: '30 / 139', accent: '#22c55e' },
  { id: 'bb-595', name: 'Gaianon2', series: 'Burst', class: 'Stamina', price: 2.44, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/Gaianon2Geo.fbx`, creator: 'Burst Vault', edition: '25 / 114', accent: '#e11d2e' },
  { id: 'bb-596', name: 'Gargoyle G4', series: 'Burst', class: 'Defense', price: 2.04, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/GargoyleG4Geo.fbx`, texture: `${M}/GargoyleG4_Layer_Color.png`, creator: 'Burst Vault', edition: '25 / 134', accent: '#e11d2e' },
  { id: 'bb-597', name: 'Gargoyle G5', series: 'Burst', class: 'Defense', price: 2.99, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/GargoyleG5Geo.fbx`, texture: `${M}/GargoyleG5_Layer_Color.png`, creator: 'Beylocker', edition: '40 / 159', accent: '#06b6d4' },
  { id: 'bb-598', name: 'Gianon G4', series: 'Burst', class: 'Stamina', price: 2.08, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/GianonG4Geo.fbx`, texture: `${M}/GianonG4_Layer_Color.png`, creator: 'Burst Vault', edition: '29 / 128', accent: '#8b5cf6' },
  { id: 'bb-599', name: 'Hades H4', series: 'Burst', class: 'Defense', price: 2.94, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/HadesH4Geo.fbx`, texture: `${M}/Hades_H4_Layer_Color.png`, creator: 'Rare Bey Club', edition: '35 / 124', accent: '#ffd21e' },
  { id: 'bb-600', name: 'Hercules H4', series: 'Burst', class: 'Balance', price: 2.68, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/HerculesH4Geo.fbx`, texture: `${M}/HerculesH4_Layer_Color.png`, creator: 'Burst Vault', edition: '09 / 178', accent: '#e11d2e' },
  { id: 'bb-601', name: 'Hollow Doomscizor D6', series: 'Burst', class: 'Attack', price: 2.85, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/HollowDoomscizorD6Geo.fbx`, texture: `${M}/HollowDoomscizorD6_Layer_Color.png`, creator: 'WBBA Works', edition: '26 / 145', accent: '#10a5ff' },
  { id: 'bb-602', name: 'Hyrus H4', series: 'Burst', class: 'Balance', price: 2.56, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/HyrusH4Geo.fbx`, creator: 'Burst Vault', edition: '37 / 176', accent: '#8b5cf6' },
  { id: 'bb-603', name: 'Jinnius J3', series: 'Burst', class: 'Balance', price: 2.50, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/JinniusJ3Geo.fbx`, texture: `${M}/JinniusJ3_Layer_Color.png`, creator: 'Rare Bey Club', edition: '31 / 120', accent: '#f97316' },
  { id: 'bb-604', name: 'Jormunter J4', series: 'Burst', class: 'Balance', price: 1.53, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/JormunterJ4Geo.fbx`, texture: `${M}/JormunterJ4_Layer_Color.png`, creator: 'WBBA Works', edition: '14 / 163', accent: '#22c55e' },
  { id: 'bb-605', name: 'Jormuntor J6', series: 'Burst', class: 'Balance', price: 1.61, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/JormuntorJ6Geo.fbx`, texture: `${M}/JormuntorJ6_Layer_Color.png`, creator: 'WBBA Works', edition: '22 / 161', accent: '#22c55e' },
  { id: 'bb-606', name: 'Jormuntor2', series: 'Burst', class: 'Balance', price: 2.15, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/Jormuntor2Geo.fbx`, creator: 'Beylocker', edition: '36 / 165', accent: '#c6ced8' },
  { id: 'bb-607', name: 'Knight K8', series: 'Burst', class: 'Attack', price: 2.73, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/KnightK8Geo.fbx`, creator: 'WBBA Works', edition: '14 / 153', accent: '#22c55e' },
  { id: 'bb-608', name: 'Left Astro A4', series: 'Burst', class: 'Balance', price: 2.24, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/LeftAstroA4Geo.fbx`, creator: 'Burst Vault', edition: '05 / 164', accent: '#8b5cf6' },
  { id: 'bb-609', name: 'Left Astro A5', series: 'Burst', class: 'Balance', price: 1.59, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/LeftAstroA5Geo.fbx`, creator: 'Beylocker', edition: '20 / 189', accent: '#c6ced8' },
  { id: 'bb-610', name: 'Leopard L4', series: 'Burst', class: 'Balance', price: 2.66, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/LeopardL4Geo.fbx`, texture: `${M}/LeopardL4_Layer_Color.png`, creator: 'Rare Bey Club', edition: '07 / 116', accent: '#f97316' },
  { id: 'bb-611', name: 'Linwyrm L7', series: 'Burst', class: 'Balance', price: 1.46, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/LinwyrmL7Geo.fbx`, creator: 'Rare Bey Club', edition: '07 / 116', accent: '#f97316' },
  { id: 'bb-612', name: 'Luinor2', series: 'Burst', class: 'Balance', price: 2.66, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/Luinor2Geo.fbx`, creator: 'Rare Bey Club', edition: '07 / 186', accent: '#f97316' },
  { id: 'bb-613', name: 'Morrigna M4', series: 'Burst', class: 'Balance', price: 2.41, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/MorrignaM4Geo.fbx`, texture: `${M}/MorrignaM4_Layer_Color.png`, creator: 'WBBA Works', edition: '22 / 161', accent: '#22c55e' },
  { id: 'bb-614', name: 'Morrigna M5', series: 'Burst', class: 'Balance', price: 1.76, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/MorrignaM5Geo.fbx`, texture: `${M}/MorrignaM5_Layer_Color.png`, creator: 'Burst Vault', edition: '37 / 186', accent: '#8b5cf6' },
  { id: 'bb-615', name: 'Muramasa M7', series: 'Burst', class: 'Balance', price: 2.32, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/MuramasaM7Geo.fbx`, creator: 'Burst Vault', edition: '13 / 132', accent: '#8b5cf6' },
  { id: 'bb-616', name: 'Nemesis N7', series: 'Burst', class: 'Balance', price: 2.76, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/NemesisN7Geo.fbx`, creator: 'Burst Vault', edition: '17 / 156', accent: '#e11d2e' },
  { id: 'bb-617', name: 'Nepstrius N4', series: 'Burst', class: 'Balance', price: 1.82, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/NepstriusN4Geo.fbx`, texture: `${M}/NepstriusN4_Layer_Color.png`, creator: 'Rare Bey Club', edition: '03 / 132', accent: '#ffd21e' },
  { id: 'bb-618', name: 'Nyddhog N8', series: 'Burst', class: 'Balance', price: 2.04, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/NyddhogN8Geo.fbx`, creator: 'Burst Vault', edition: '25 / 144', accent: '#e11d2e' },
  { id: 'bb-619', name: 'Odax O6', series: 'Burst', class: 'Balance', price: 2.16, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/OdaxO6Geo.fbx`, texture: `${M}/OdaxO6_Layer_Color.png`, creator: 'Burst Vault', edition: '37 / 186', accent: '#8b5cf6' },
  { id: 'bb-620', name: 'Ogre O4', series: 'Burst', class: 'Balance', price: 1.87, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/OgreO4Geo.fbx`, texture: `${M}/OgreO4_Layer_Color.png`, creator: 'Beylocker', edition: '08 / 137', accent: '#06b6d4' },
  { id: 'bb-621', name: 'Ogre O5', series: 'Burst', class: 'Balance', price: 1.86, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/OgreO5Geo.fbx`, creator: 'Rare Bey Club', edition: '07 / 176', accent: '#f97316' },
  { id: 'bb-622', name: 'Pandemonium P8', series: 'Burst', class: 'Balance', price: 2.40, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/PandemoniumP8Geo.fbx`, creator: 'Burst Vault', edition: '21 / 110', accent: '#8b5cf6' },
  { id: 'bb-623', name: 'Pandora Endless P8', series: 'Burst', class: 'Balance', price: 2.62, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/PandoraEndlessP8Geo.fbx`, creator: 'Rare Bey Club', edition: '03 / 162', accent: '#ffd21e' },
  { id: 'bb-624', name: 'Pandora Epic P8', series: 'Burst', class: 'Balance', price: 1.67, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/PandoraEpicP8Geo.fbx`, creator: 'Beylocker', edition: '28 / 147', accent: '#c6ced8' },
  { id: 'bb-625', name: 'Pandora Evasive P8', series: 'Burst', class: 'Balance', price: 1.97, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/PandoraEvasiveP8Geo.fbx`, creator: 'WBBA Works', edition: '18 / 107', accent: '#10a5ff' },
  { id: 'bb-626', name: 'Pandora Everlasting P8', series: 'Burst', class: 'Balance', price: 2.36, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/PandoraEverlastingP8Geo.fbx`, creator: 'Burst Vault', edition: '17 / 166', accent: '#e11d2e' },
  { id: 'bb-627', name: 'Perseus P7', series: 'Burst', class: 'Balance', price: 2.47, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/PerseusP7Geo.fbx`, creator: 'Beylocker', edition: '28 / 107', accent: '#c6ced8' },
  { id: 'bb-628', name: 'Phoenix P4', series: 'Burst', class: 'Balance', price: 2.80, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/PhoenixP4Geo.fbx`, creator: 'Burst Vault', edition: '21 / 150', accent: '#8b5cf6' },
  { id: 'bb-629', name: 'Poseidon P8', series: 'Burst', class: 'Balance', price: 1.84, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/PoseidonP8Geo.fbx`, creator: 'Burst Vault', edition: '05 / 104', accent: '#8b5cf6' },
  { id: 'bb-630', name: 'Quetziko2', series: 'Burst', class: 'Balance', price: 2.23, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/Quetziko2Geo.fbx`, creator: 'Beylocker', edition: '04 / 153', accent: '#c6ced8' },
  { id: 'bb-631', name: 'Regnar R7', series: 'Burst', class: 'Balance', price: 1.87, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/RegnarR7Geo.fbx`, creator: 'Beylocker', edition: '08 / 137', accent: '#06b6d4' },
  { id: 'bb-632', name: 'Regulus R3', series: 'Burst', class: 'Balance', price: 2.57, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/RegulusR3Geo.fbx`, texture: `${M}/RegulusR3_Layer_Color.png`, creator: 'WBBA Works', edition: '38 / 187', accent: '#22c55e' },
  { id: 'bb-633', name: 'Regulus R6', series: 'Burst', class: 'Balance', price: 2.86, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/RegulusR6Geo.fbx`, texture: `${M}/RegulusR6_Layer_Color.png`, creator: 'Rare Bey Club', edition: '27 / 186', accent: '#ffd21e' },
  { id: 'bb-634', name: 'Right Artemis A4', series: 'Burst', class: 'Balance', price: 1.91, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/RightArtemisA4Geo.fbx`, creator: 'Beylocker', edition: '12 / 101', accent: '#c6ced8' },
  { id: 'bb-635', name: 'Right Artemis A5', series: 'Burst', class: 'Balance', price: 2.86, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/RightArtemisA5Geo.fbx`, creator: 'Rare Bey Club', edition: '27 / 126', accent: '#ffd21e' },
  { id: 'bb-636', name: 'Rising Ragnaruk2', series: 'Burst', class: 'Balance', price: 1.56, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/RisingRagnaruk2Geo.fbx`, creator: 'Burst Vault', edition: '17 / 186', accent: '#e11d2e' },
  { id: 'bb-637', name: 'Rocktavor R4', series: 'Burst', class: 'Balance', price: 2.58, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/RocktavorR4Geo.fbx`, texture: `${M}/RocktavorR4_Layer_Color.png`, creator: 'Rare Bey Club', edition: '39 / 138', accent: '#f97316' },
  { id: 'bb-638', name: 'Rudr R4', series: 'Burst', class: 'Balance', price: 2.80, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/RudrR4Geo.fbx`, texture: `${M}/RudrR4_Layer_Color.png`, creator: 'Burst Vault', edition: '21 / 160', accent: '#8b5cf6' },
  { id: 'bb-639', name: 'Rudr R5', series: 'Burst', class: 'Balance', price: 2.79, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/RudrR5Geo.fbx`, creator: 'Beylocker', edition: '20 / 109', accent: '#c6ced8' },
  { id: 'bb-640', name: 'Salamander S4', series: 'Burst', class: 'Balance', price: 2.40, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/SalamanderS4Geo.fbx`, texture: `${M}/SalamanderS4_Layer_Color.png`, creator: 'Burst Vault', edition: '21 / 170', accent: '#8b5cf6' },
  { id: 'bb-641', name: 'Sphinx S4', series: 'Burst', class: 'Balance', price: 1.62, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/SphinxS4Geo.fbx`, texture: `${M}/SphinxS4_Layer_Color.png`, creator: 'Rare Bey Club', edition: '23 / 132', accent: '#f97316' },
  { id: 'bb-642', name: 'Sphinx S5', series: 'Burst', class: 'Balance', price: 2.57, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/SphinxS5Geo.fbx`, creator: 'WBBA Works', edition: '38 / 157', accent: '#22c55e' },
  { id: 'bb-643', name: 'Spryzen S7', series: 'Burst', class: 'Balance', price: 1.68, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/SpryzenS7Geo.fbx`, creator: 'Burst Vault', edition: '29 / 158', accent: '#8b5cf6' },
  { id: 'bb-644', name: 'Stone XQuetziko Q4', series: 'Burst', class: 'Balance', price: 2.39, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/StoneXQuetzikoQ4Geo.fbx`, creator: 'Beylocker', edition: '20 / 149', accent: '#c6ced8' },
  { id: 'bb-645', name: 'Surtr S4', series: 'Burst', class: 'Balance', price: 2.20, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/SurtrS4Geo.fbx`, texture: `${M}/SurtrS4_Color.png`, creator: 'Burst Vault', edition: '01 / 160', accent: '#e11d2e' },
  { id: 'bb-646', name: 'Tornado Yegdrion Y4', series: 'Burst', class: 'Balance', price: 1.88, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/TornadoYegdrionY4Geo.fbx`, creator: 'Burst Vault', edition: '09 / 188', accent: '#e11d2e' },
  { id: 'bb-647', name: 'Treptune T4', series: 'Burst', class: 'Balance', price: 2.66, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/TreptuneT4Geo.fbx`, texture: `${M}/TreptuneT4_Layer_Color.png`, creator: 'Rare Bey Club', edition: '07 / 166', accent: '#f97316' },
  { id: 'bb-648', name: 'Typhon T4', series: 'Burst', class: 'Balance', price: 2.71, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/TyphonT4Geo.fbx`, texture: `${M}/TyphonT4_Layer_Color.png`, creator: 'Beylocker', edition: '12 / 171', accent: '#c6ced8' },
  { id: 'bb-649', name: 'Typhon T5', series: 'Burst', class: 'Balance', price: 2.06, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/TyphonT5Geo.fbx`, texture: `${M}/TyphonT5_Layer_Color.png`, creator: 'Rare Bey Club', edition: '27 / 106', accent: '#ffd21e' },
  { id: 'bb-650', name: 'Tyros T6', series: 'Burst', class: 'Balance', price: 1.52, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/TyrosT6Geo.fbx`, texture: `${M}/TyrosT6_Layer_Color.png`, creator: 'Burst Vault', edition: '13 / 112', accent: '#8b5cf6' },
  { id: 'bb-651', name: 'Valtryek V5', series: 'Burst', class: 'Attack', price: 2.04, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ValtryekV5Geo.fbx`, texture: `${M}/Valtryek_V5_Layer_Color.png`, creator: 'Burst Vault', edition: '25 / 124', accent: '#e11d2e' },
  { id: 'bb-652', name: 'Valtryek V7', series: 'Burst', class: 'Attack', price: 2.98, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ValtryekV7Geo.fbx`, creator: 'Rare Bey Club', edition: '39 / 188', accent: '#f97316' },
  { id: 'bb-653', name: 'Vanguard V2', series: 'Burst', class: 'Defense', price: 1.73, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/VanguardV2Geo.fbx`, creator: 'WBBA Works', edition: '34 / 103', accent: '#10a5ff' },
  { id: 'bb-654', name: 'Venom Devolos D5', series: 'Burst', class: 'Balance', price: 2.25, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/VenomDevolosD5Geo.fbx`, creator: 'WBBA Works', edition: '06 / 175', accent: '#22c55e' },
  { id: 'bb-655', name: 'Vex Lucius L6', series: 'Burst', class: 'Balance', price: 1.71, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/VexLuciusL6Geo.fbx`, texture: `${M}/VexLuciusL6_Layer_Color.png`, creator: 'Beylocker', edition: '32 / 161', accent: '#06b6d4' },
  { id: 'bb-656', name: 'Viper Hydra H5Premium', series: 'Burst', class: 'Balance', price: 1.85, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ViperHydraH5PremiumGeo.fbx`, creator: 'WBBA Works', edition: '06 / 145', accent: '#22c55e' },
  { id: 'bb-657', name: 'Viper Hydrax H5', series: 'Burst', class: 'Balance', price: 2.86, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ViperHydraxH5Geo.fbx`, creator: 'Rare Bey Club', edition: '27 / 106', accent: '#ffd21e' },
  { id: 'bb-658', name: 'Wyvern2', series: 'Burst', class: 'Stamina', price: 2.94, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/Wyvern2Geo.fbx`, creator: 'Rare Bey Club', edition: '35 / 114', accent: '#ffd21e' },
  { id: 'bb-659', name: 'Xcalius X4', series: 'Burst', class: 'Balance', price: 1.58, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/XcaliusX4Geo.fbx`, texture: `${M}/Xcalius_X4_Layer_Color.png`, creator: 'Rare Bey Club', edition: '19 / 118', accent: '#ffd21e' },
  { id: 'bb-660', name: 'Xcalius X8', series: 'Burst', class: 'Balance', price: 1.86, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/XcaliusX8Geo.fbx`, creator: 'Rare Bey Club', edition: '07 / 156', accent: '#f97316' },
  { id: 'bb-661', name: 'Xcalius2', series: 'Burst', class: 'Balance', price: 2.66, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/Xcalius2Geo.fbx`, creator: 'Rare Bey Club', edition: '07 / 106', accent: '#f97316' },
  { id: 'bb-662', name: 'Yegdrion2', series: 'Burst', class: 'Balance', price: 1.52, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/Yegdrion2Geo.fbx`, creator: 'Burst Vault', edition: '13 / 122', accent: '#8b5cf6' },
  { id: 'bb-663', name: 'Zeutron2', series: 'Burst', class: 'Balance', price: 1.92, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/Zeutron2Geo.fbx`, creator: 'Burst Vault', edition: '13 / 142', accent: '#8b5cf6' },
  { id: 'bb-664', name: 'Zuetron Z4', series: 'Burst', class: 'Balance', price: 2.66, image: `${BC}/battle_menu_quick_battle_imagery.png`, model: `${M}/ZuetronZ4Geo.fbx`, creator: 'Rare Bey Club', edition: '07 / 116', accent: '#f97316' },
]

/** `valtryekcho-zredgeo.fbx` -> `valtryekchozred`, for exact build matching. */
const key = (s: string) => s.replace(/\.(fbx|obj)$/i, '').replace(/geo.*$/i, '').replace(/[^a-z0-9]/gi, '').toLowerCase()

type BurstBuild = {
  layer: { file: string; texture?: string | null }
  disk: { file: string; name: string }
  driver: { file: string; name: string }
}

const builds = burstBuilds as Record<string, BurstBuild>

const buildsByKey = new Map(Object.entries(builds).map(([name, build]) => [key(name), build]))

function buildForLayerFile(fileName: string): BurstBuild | undefined {
  const stem = fileName.replace(/_Layer\.obj$/i, '')
  return buildsByKey.get(key(stem))
}

/** The recovered component pools, for swapping parts in the Bey Lab. */
export const burstDiscs = burstParts.disks.map((d) => ({ name: d.name, src: `${M}/${d.file}` }))
export const burstDrivers = burstParts.drivers.map((d) => ({ name: d.name, src: `${M}/${d.file}` }))

const BADGES = '/assets/game/badges'
const badgeIndex = art.byBeast as { x: Record<string, string>; burst: Record<string, string> }

/**
 * Finds the chip art for a release by its beast word, within its own series.
 * `Dagger Dran 4-60R` and the badge named `Dran Dagger` only agree on `dran`,
 * so each word is tried — but only against that series' art, or a Burst bey
 * would happily claim an X badge that shares a prefix word.
 */
function badgeFor(name: string, series: 'X' | 'Burst') {
  const pool = series === 'X' ? badgeIndex.x : badgeIndex.burst
  const words = name
    .replace(/\s*\d[\w-]*$/, '')
    .split(/[\s()-]+/)
    .map((w) => w.replace(/[^a-z]/gi, '').toLowerCase())
    .filter((w) => w.length >= 4)
  // Longest word first: it is the most specific, so `Fafnir` beats `Wizard`.
  for (const w of [...words].sort((a, b) => b.length - a.length)) if (pool[w]) return pool[w]
  return undefined
}

type PartMapEntry = { ao?: Record<string, string>; decal?: string }
const xPartMaps = partMaps as Record<string, PartMapEntry>

/** Pull 3-60 / F from mesh AO names when the listing title omitted the code. */
function xCodeFromPartMap(model?: string) {
  if (!model) return undefined
  const file = model.split('/').pop() ?? ''
  const ao = xPartMaps[file]?.ao
  if (!ao) return undefined
  let ring: string | undefined
  let height: string | undefined
  let bit: string | undefined
  for (const mesh of Object.keys(ao)) {
    const r = mesh.match(/RatchetRing_(\d+)/i)
    const h = mesh.match(/RatchetBase_(\d+)/i)
    const b = mesh.match(/Bit_([A-Za-z0-9]+)/i)
    if (r) ring = r[1]
    if (h) height = h[1]
    if (b) bit = b[1].toUpperCase()
  }
  if (ring && height && bit) return { ratchet: `${ring}-${height}`, bit }
  return undefined
}

/** Product art filenames often encode the stock build: `…_3-60f.png`. */
function xCodeFromImage(image?: string) {
  if (!image) return undefined
  const m = image.match(/(\d)-(\d{2})([a-z]+)/i)
  if (!m) return undefined
  return { ratchet: `${m[1]}-${m[2]}`, bit: m[3].toUpperCase() }
}

for (const item of marketplaceListings) {
  if (!item.model || item.class === 'Arena') continue

  const verifiedRelease = item.series === 'X' ? VERIFIED_X_RELEASES[item.id] : undefined
  if (verifiedRelease) {
    item.name = verifiedRelease.name
    if (verifiedRelease.model) item.model = verifiedRelease.model
    if (verifiedRelease.image) item.image = verifiedRelease.image
    item.partsVerified = true
    item.verificationSource = OFFICIAL_X_SOURCE
  }

  const badge = badgeFor(item.name, item.series)
  if (badge) item.badge = `${BADGES}/${badge}`

  if (item.series === 'X') {
    // Prefer the title code (`3-60F` / `S6-60V`), then product art, then mesh AO.
    const code = item.name.match(/([A-Z]*\d-\d{2})([A-Z]+)$/i)
    const mapped = xCodeFromPartMap(item.model) ?? xCodeFromImage(item.image)
    const ratchet = code ? code[1].toUpperCase() : mapped?.ratchet ?? '—'
    const bit = code ? code[2].toUpperCase() : mapped?.bit ?? '—'
    const blade = item.name.replace(/\s+[A-Z]*\d-\d{2}[A-Z]+$/i, '').trim() || item.name
    item.parts = [
      { role: 'Blade', name: blade },
      { role: 'Ratchet', name: ratchet },
      { role: 'Bit', name: bit },
    ]
    item.combinationStatus = 'complete-mesh'
    if (!item.partsVerified) item.verificationSource = 'Recovered game export; release match not asserted'
    continue
  }

  // Only the standalone Burst layer exports are composable. The older FBX
  // exports are already complete models; adding a random disc and driver to
  // those makes every preview look like a malformed four-part toy.
  if (!/layer\.obj$/i.test(item.model)) {
    // Still label the three Burst roles from the recovered build when we have one
    // for the same beast, so the catalogue can show Layer / Disc / Driver names.
    const stem = (item.model.split('/').pop() ?? '').replace(/\.(fbx|obj)$/i, '').replace(/geo.*$/i, '')
    const labeled = buildForLayerFile(`${stem}_Layer.obj`)
    if (labeled) {
      item.parts = [
        { role: 'Layer', name: item.name },
        { role: 'Disc', name: labeled.disk.name },
        { role: 'Driver', name: labeled.driver.name },
      ]
    }
    item.combinationStatus = 'complete-mesh'
    item.verificationSource = labeled ? 'Recovered game build label' : 'Recovered game export; parts not asserted'
    continue
  }

  const fileName = item.model.split('/').pop() ?? ''
  const curated = buildForLayerFile(fileName)
  if (!curated) {
    item.combinationStatus = 'layer-only'
    item.verificationSource = 'Layer export only; no authoritative stack assigned'
    continue
  }

  if (curated?.layer.texture && !item.texture) {
    item.texture = `${M}/${curated.layer.texture}`
  }

  item.parts = [
    { role: 'Layer', name: item.name, src: item.model, texture: item.texture },
    { role: 'Disc', name: curated.disk.name, src: `${M}/${curated.disk.file}` },
    { role: 'Driver', name: curated.driver.name, src: `${M}/${curated.driver.file}` },
  ]
  item.assembly = 'burst'
  item.combinationStatus = 'verified'
  item.partsVerified = true
  item.verificationSource = 'Recovered game build / curated part files'
}
