/**
 * Listing quality patterns — learned from fleet v5/v6 comp audit.
 *
 * Garbage clusters: bare BB## collisions (Honda/Shimano/nav/bags), accessories
 * (stadium/random booster), car parts, fashion, magazines, watches.
 *
 * Best-match clusters: bey signal + hyphen code + product_code method,
 * Takara/Tomy, スターター, character names, Mercari おもちゃ category.
 */

/** Known non-Beyblade categories that reuse catalog-like tokens in titles. */
export const NON_BEYBLADE_JUNK_RE =
  /フジミ|プラモデル|トヨタ|toyota|\bbmw\b|ベンツ|mercedes|ヘッドランプ|headlamp|リーバイス|levis|levi'?s|denso|デンソー|\bosg\b|ルアー|\blure\b|ミラー|mirror|釣具|tackle|フィギュア(?!.*ベイ)|\bjeans\b|デニム|denim|シャツ|shirt|Masterworks|マスターワークス|パナソニック|panasonic|ストラーダ|メモリーナビ|カロッツェリア|carrozzeria|ホンダ|honda|シマノ|shimano|sram|baobao|バオバオ|isseymiyake|イッセイミヤケ|dickies|ディッキーズ|ミラジーノ|ソニカ|フィット|ムーヴ|三菱|mitsubishi|日産|nissan|給油キャップ|ボトムブラケット|bottom bracket|クランク|crankset|ワークパンツ|チノパン|古着|ミリタリー|フィールドジャケット|ユーロ|雑誌切抜|プーリー|リアホイール|ドラムブレーキ|イグニッション|Panini|NFLカード|トレーディングカード|腕時計|QUARTZ|カシオ|CASIO|ドライブレコーダー|ドラレコ|HDDレコーダー|ミートスライサー|厨房|業務用|エレキバイオリン|弦楽器|パーツリスト|サービスマニュアル|配線図|純正部品|実働外し|検\)AF/i;

export const BEYBLADE_SIGNAL_RE =
  /ベイ(?:ブレード|)|バースト|beyblade\s*x?|beybladex|takara|タカラ|戰鬥陀螺|战斗陀螺|爆旋陀螺|メタルファイト|metal fight|爆転シュート/i;

export const HYPHEN_CATALOG_CODE_RE =
  /\b(BX-\d{2}|UX-\d{2}|CX-\d{2}|BB-\d{2}[A-Z]?|A-\d{2}|D-\d+|DS-\d+|MD-\d+|WD-[A-Z0-9]+|BB105|WF2|R2F|WD)\b/i;

export const BARE_BB_CODE_RE = /\bBB\d{2}[A-Z]?\b/i;

export const HYPHEN_BB_CODE_RE = /\bBB-\d{2}[A-Z]?\b/i;

export const BURST_B_CODE_RE = /\bB-\d{2,3}\b/i;

/** Stadium, random booster packs, launcher-only — not whole-SKU comps. */
export const BEYBLADE_ACCESSORY_RE =
  /スタジアム|ベイスタジアム|beystadium|extreme beystadium|エクストリームベイスタジアム|ベイブレードスタジアム|ランチャー(?:のみ|単品)|launcher only|グリップのみ|ツールセット|tool set/i;

/** Random booster volume — accessory SKU unless title also names a complete top. */
export const RANDOM_BOOSTER_PACK_RE =
  /ランダムブースター|random booster|ランダム ブースター/i;

/** Mercari / Yahoo toy-category prefixes seen on best matches. */
export const MERCARI_TOY_CATEGORY_RE =
  /【中古】おもちゃ|おもちゃ\s+(BX-|UX-|CX-|B-|BB-|A-)|「BEYBLADE|BEYBLADE X「/i;

export const TAKARA_TOMY_RE = /タカラトミー|TAKARA TOMY|タカラ|TAKARA/i;

export const STARTER_MARKER_RE =
  /スターター|starter|ブースター|booster|スタートダッシュ|entry set|デッキセット|deck set/i;

export const CHARACTER_NAME_RE =
  /ヴァルキリー|valkyrie|スプリガン|spriggan|ペガサス|pegasus|ドラゴン|dragon|ロンギヌス|longinus|アキレス|achilles|ドラグーン|dragoon|フェニックス|phoenix|レオーネ|leone|リブラ|libra|ペガサス|pegasus|ソード|sword|ウルフ|wolf|mirage|ミラージュ/i;

export const METAL_PLASTIC_COMBO_RE =
  /\b\d{2,3}[A-Z]{1,3}\b|\b[A-Z]{1,2}\d{2,3}[A-Z]{0,3}\b/;

export const X_COMBO_SUFFIX_RE = /\d-\d{2}\s*[a-z]{1,3}\b/i;

export function isNonBeybladeJunk(title: string): boolean {
  return NON_BEYBLADE_JUNK_RE.test(title);
}

/** Stadium / random booster / launcher-only — never a whole-bey comp. */
export function isBeybladeAccessoryListing(title: string): boolean {
  if (BEYBLADE_ACCESSORY_RE.test(title)) return true;
  if (RANDOM_BOOSTER_PACK_RE.test(title)) {
    if (/完成品|\bcomplete\b|未開封|sealed|nib|スターターセット/i.test(title)) return false;
    return true;
  }
  return false;
}

export function hasHyphenatedCatalogCode(title: string): boolean {
  return HYPHEN_CATALOG_CODE_RE.test(title) || HYPHEN_BB_CODE_RE.test(title);
}

/** Positive signals from best-match audit — higher = more likely real Bey listing. */
export function countStrongBeyMatchSignals(title: string): number {
  let n = 0;
  if (BEYBLADE_SIGNAL_RE.test(title)) n++;
  if (hasHyphenatedCatalogCode(title)) n++;
  if (TAKARA_TOMY_RE.test(title)) n++;
  if (STARTER_MARKER_RE.test(title)) n++;
  if (CHARACTER_NAME_RE.test(title)) n++;
  if (MERCARI_TOY_CATEGORY_RE.test(title)) n++;
  if (X_COMBO_SUFFIX_RE.test(title) && hasHyphenatedCatalogCode(title)) n++;
  if (
    BARE_BB_CODE_RE.test(title) &&
    BEYBLADE_SIGNAL_RE.test(title) &&
    METAL_PLASTIC_COMBO_RE.test(title)
  ) {
    n++; // Metal Fight "BB30 ロックレオーネ 145WB" style
  }
  return n;
}

/** Minimum positive signals for bare legacy BB## to count as complete bey. */
export function bareLegacyBbHasContext(title: string): boolean {
  return (
    /メタルファイト|metal fight|爆転シュート|ベイブレード|beyblade|タカラ|takara|完成品|スターター|starter/i.test(
      title
    ) ||
    STARTER_MARKER_RE.test(title) ||
    (CHARACTER_NAME_RE.test(title) && METAL_PLASTIC_COMBO_RE.test(title))
  );
}
