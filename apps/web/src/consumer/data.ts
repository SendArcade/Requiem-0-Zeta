export const XC = '/assets/game/x-chrome'
export const BC = '/assets/game/burst-chrome'
export const BEY = '/assets/game/beys'
/** Bey render sprites decoded from the X app's own UI atlas. */
export const XS = '/assets/game/x-sprites'

/**
 * Only beys the app ships a clean colour render for. Two traps in the decode:
 * the greyscale files in `beys/` sharing these names are AO bakes, and some
 * sprites have the in-game "custom paint" badge composited into the corner.
 */
const M = '/assets/models'

export const xBeys = [
  { name: 'Dagger Dran 4-60R', type: 'Attack', pts: 2210, img: `${XS}/DaggerDran_Product.png`, model: `${M}/dagger_dran.fbx`, tint: '#139ade' },
  { name: 'Horn Rhino 3-80S', type: 'Defense', pts: 2050, img: `${XS}/HornRhino_Product.png`, model: `${M}/horn_rhino.fbx`, tint: '#7b30a6' },
  { name: 'Tail Viper 5-80O', type: 'Stamina', pts: 1980, img: `${XS}/TailViper.png`, model: `${M}/tail_viper.fbx`, tint: '#0583d1' },
  { name: 'Lance Knight 4-80HN', type: 'Defense', pts: 1960, img: `${XS}/LanceKnight_1954.png`, model: `${M}/lance_knight.fbx`, tint: '#adcc10' },
  { name: 'Yell Kong 3-60GB', type: 'Attack', pts: 1875, img: `${XS}/YellKong.png`, model: `${M}/yell_kong.fbx`, tint: '#10c660' },
  { name: 'Tusk Mammoth 3-60T', type: 'Defense', pts: 2115, img: `${XS}/TuskMammoth.png`, model: `${M}/mammo_tusk.fbx`, tint: '#edd550' },
  { name: 'Chain Incendio 5-60HT', type: 'Balance', pts: 1930, img: `${XS}/ChainIncendio_567.png`, model: `${M}/chain_incendio.fbx`, tint: '#d7081f' },
  { name: 'Talon Ptera 3-80B', type: 'Attack', pts: 1840, img: `${XS}/TalonPteraorange.png`, model: `${M}/talon_ptera.fbx`, tint: '#4dbcef' },
  { name: 'Helm Knight 3-80N', type: 'Defense', pts: 1820, img: `${XS}/HelmKnightgreen.png`, model: `${M}/helm_knight.fbx`, tint: '#14c283' },
  { name: 'Scythe Incendio 3-80B', type: 'Attack', pts: 2050, img: `${XS}/ScytheIncendioFull.png`, model: `${M}/scythe_incendio.fbx`, tint: '#ff5520' },
  // Renders only — the app ships no mesh for these releases.
  { name: 'Cowl Sphinx 9-80GN', type: 'Stamina', pts: 2240, img: `${XS}/CowlSphinxFull.png` },
  { name: 'Claw Leon 5-60P', type: 'Attack', pts: 2160, img: `${XS}/ClawLeon.png` },
  { name: 'Circle Ghost 0-80GB', type: 'Stamina', pts: 2350, img: `${XS}/CircleGhost0-80GB.png` },
  { name: 'Scarlet Garuda 4-70TP', type: 'Stamina', pts: 2265, img: `${XS}/ScarletGaruda4-70TP.png` },
  { name: 'Draciel Shield 7-60D', type: 'Defense', pts: 2400, img: `${XS}/DracielShield7-60D.png` },
  { name: 'Buster Dran 5-70DB', type: 'Attack', pts: 2480, img: `${XS}/BusterDranFull.png` },
] as { name: string; type: string; pts: number; img: string; model?: string; tint?: string }[]

/** Class badge art from the same atlas. */
export const xTypeIcon: Record<string, string> = {
  Attack: `${XS}/BBX-AttackType.png`,
  Defense: `${XS}/BBX-DefenseType.png`,
  Stamina: `${XS}/BBX-StaminaType.png`,
  Balance: `${XS}/BBX-BalanceType.png`,
}

export const burstShop = [
  { name: 'Berserk Balderov B7', kind: 'Digital Beyblade', img: `${BC}/battle_menu_imagery_custom_opponent.png` },
  { name: 'Avatar Attack', kind: 'Digital Beystadium', img: `${BC}/ArenaThumb_Quadstrike.png` },
  { name: 'TS01', kind: 'Skin', img: `${BC}/battle_menu_toy_battle_imagery.png` },
  { name: 'Spryzen', kind: 'Skin', img: `${BC}/battle_menu_imagery_battle_friend.png` },
  { name: 'D08 Rose', kind: 'Skin', img: `${BC}/ArenaThumb_HyperSphere.png` },
  { name: 'D06 Azure', kind: 'Skin', img: `${BC}/ArenaThumb_QuadstrikeThunderEdge.png` },
  { name: 'D08 Gold', kind: 'Skin', img: `${BC}/ArenaThumb_QuadstrikeLightIgnite.png` },
  { name: 'TB01', kind: 'Skin', img: `${BC}/ArenaThumb_QuadstrikeCreature.png` },
]

export const battleTiles = [
  { name: 'Quick Battle', img: `${BC}/battle_menu_quick_battle_imagery.png`, icon: `${BC}/battle_menu_quick_battle_icon.png`, to: '/burst/battle/go' },
  { name: 'Battle League', img: `${BC}/battle_menu_battle_league_imagery.png`, icon: `${BC}/battle_menu_battle_league_icon.png`, to: '/burst/league' },
  { name: 'Toy Battle', img: `${BC}/battle_menu_toy_battle_imagery.png`, icon: `${BC}/battle_menu_toy_battle_icon.png`, to: '/burst/customize' },
  { name: 'Friend Battle', img: `${BC}/battle_menu_imagery_battle_friend.png`, icon: `${BC}/battle_menu_battle_friend_icon.png`, to: '/burst/battle/go' },
  { name: 'WBBA', img: `${BC}/battle_menu_wbba_imagery.png`, icon: `${BC}/battle_menu_wbba_icon.png`, to: '/burst/profile' },
  { name: 'My League', img: `${BC}/battle_menu_my_league_imagery.png`, icon: `${BC}/battle_menu_my_league_icon.png`, to: '/burst/league' },
]

export const burstParts = {
  layers: ['Ace Dragon', 'Abyss Fafnir F6', 'Achilles A5', 'Spryzen'],
  disks: ['0', '00', '10', '12'],
  drivers: ['Attack', 'Defense', 'Stamina', 'Balance'],
}

export const rivals = [
  { name: 'Free De La Hoya', rank: 'Ace' },
  { name: 'Aiger Akabane', rank: 'Champion' },
  { name: 'Valt Aoi', rank: 'Legend' },
  { name: 'Shu Kurenai', rank: 'Rival' },
]
