/**
 * キャラ別OGP画像(1200×630 PNG)を16種＋デフォルト、生成する。
 * 一度だけ実行して public/ogp/<slug>.png を作りコミットする(アプリ本体には画像ライブラリを積まない)。
 *   実行: npx tsx scripts/gen-ogp.tsx
 * マスコットはアプリのReactコンポーネントをSSRしてSVGを取り出す＝画面と完全一致。
 * 文字は Zen Maru Gothic(ブランドフォント)を resvg に読ませてラスタライズ。
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Resvg } from '@resvg/resvg-js'
import HoshiKyaraMascot from '../src/components/HoshiKyaraMascot'

type Element = '火' | '地' | '風' | '水'
const SLUG: Record<Element, string> = { 火: 'fire', 地: 'earth', 風: 'air', 水: 'water' }
const ORDER: Element[] = ['火', '地', '風', '水']

// 16キャラのJA名＋キャッチ(startypes.ts から転記。i18nのブラウザ依存を避けるためここに固定)
const T: Record<Element, Record<Element, { name: string; copy: string }>> = {
  火: {
    火: { name: '疾走する彗星', copy: '迷いなく燃える、生粋の情熱ドリブン' },
    地: { name: '大地に立つ炎', copy: '派手に見えて、実は地に足がついている' },
    風: { name: '舞い上がる花火', copy: '情熱的で、心はどこまでも軽やか' },
    水: { name: '内に海を抱く炎', copy: '情熱の人に見えて、心はとても繊細' },
  },
  地: {
    火: { name: '静かな火山', copy: '落ち着いて見えて、内側はマグマ' },
    地: { name: '揺るがない山', copy: '表も裏も、どっしり安定の本格派' },
    風: { name: '風を聴く大樹', copy: 'どっしり見えて、心は自由に飛んでいる' },
    水: { name: '泉を隠す森', copy: '現実的に見えて、心は深くやさしい' },
  },
  風: {
    火: { name: '熱を運ぶ風', copy: '軽やかに見えて、心は火の玉' },
    地: { name: '羅針盤を持つ旅人', copy: '自由に見えて、ちゃんと着地する' },
    風: { name: '自由な渡り鳥', copy: '生粋の自由人、心まで風通し良好' },
    水: { name: '月夜のそよ風', copy: '社交的に見えて、心は情緒の人' },
  },
  水: {
    火: { name: '海底の火山', copy: '穏やかに見えて、芯は誰より熱い' },
    地: { name: '静かな入り江', copy: 'やさしくて、実はしっかり者' },
    風: { name: '風をうつす水面', copy: '感受性豊かで、頭の回転も速い' },
    水: { name: '深海の月', copy: '感じる力の申し子、生粋の共感者' },
  },
}

// 太陽エレメントのやわらかい下地色(マスコットの円背景)
const TINT: Record<Element, string> = { 火: '#FFE1E9', 地: '#E9F1DA', 風: '#DEF0F8', 水: '#DDE7F8' }

const font = readFileSync(new URL('./assets/ZenMaruGothic-Bold.ttf', import.meta.url))

/** マスコットのSVG中身(<svg>を剥がした内側)を、id衝突しないようプレフィックス付きで返す */
function mascotInner(sun: Element, moon: Element, keyPrefix: string): string {
  const svg = renderToStaticMarkup(createElement(HoshiKyaraMascot, { sunElement: sun, moonElement: moon, size: 64 }))
  const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  // id="xxx" と url(#xxx) を同じプレフィックスで置換(複数マスコットを1枚に置くとき用)
  return inner.replace(/(id="|url\(#)([A-Za-z0-9]+)/g, (_m, p1, p2) => `${p1}${keyPrefix}${p2}`)
}

/** マスコットを cx,cy 中心・直径 d で配置する <g> */
function placeMascot(sun: Element, moon: Element, cx: number, cy: number, d: number, keyPrefix: string): string {
  const s = d / 64
  const tx = cx - d / 2
  const ty = cy - d / 2
  return `<g transform="translate(${tx} ${ty}) scale(${s})">${mascotInner(sun, moon, keyPrefix)}</g>`
}

/** 4方向のきらめき星(ブランドの装飾)。glyphに頼らずパスで描く */
function sparkPath(x: number, y: number, r: number, c: string): string {
  const a = r * 0.34
  const d = `M${x} ${y - r} L${x + a} ${y - a} L${x + r} ${y} L${x + a} ${y + a} L${x} ${y + r} L${x - a} ${y + a} L${x - r} ${y} L${x - a} ${y - a} Z`
  return `<path d="${d}" fill="${c}"/>`
}

const W = 1200
const H = 630

/** 名前の長さに応じて字サイズを決める(はみ出し防止) */
function nameSize(name: string): number {
  const n = [...name].length
  if (n >= 8) return 68
  if (n >= 6) return 80
  return 92
}

function cardSvg(sun: Element, moon: Element): string {
  const info = T[sun][moon]
  const ns = nameSize(info.name)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FF9EC4"/>
      <stop offset="100%" stop-color="#9B7BEA"/>
    </linearGradient>
    <linearGradient id="name" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#E85B96"/>
      <stop offset="100%" stop-color="#7A4FD0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="44" fill="#FFFFFF"/>

  <g transform="translate(490 108)">
    ${sparkPath(0, 0, 11, '#E8A93A')}
    <text x="20" y="8" font-family="Zen Maru Gothic" font-size="30" font-weight="700" fill="#B26A98">ほしキャラ診断</text>
  </g>

  <circle cx="600" cy="272" r="140" fill="${TINT[sun]}"/>
  ${placeMascot(sun, moon, 600, 272, 232, 'm')}

  <text x="600" y="470" text-anchor="middle" font-family="Zen Maru Gothic" font-size="${ns}" font-weight="700" fill="url(#name)">${info.name}</text>
  <text x="600" y="516" text-anchor="middle" font-family="Zen Maru Gothic" font-size="27" font-weight="700" fill="#6B5B95">${info.copy}</text>
  <text x="600" y="560" text-anchor="middle" font-family="Zen Maru Gothic" font-size="22" font-weight="700" fill="#AC9AC8">あなたは16キャラのどれ？ ・ starflect.asanuma.works</text>
</svg>`
}

function defaultSvg(): string {
  const row = ORDER.map((el, i) => placeMascot(el, el, 300 + i * 200, 300, 150, `d${i}`)).join('\n  ')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FF9EC4"/>
      <stop offset="100%" stop-color="#9B7BEA"/>
    </linearGradient>
    <linearGradient id="name" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#E85B96"/>
      <stop offset="100%" stop-color="#7A4FD0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="44" fill="#FFFFFF"/>
  <text x="600" y="150" text-anchor="middle" font-family="Zen Maru Gothic" font-size="66" font-weight="700" fill="url(#name)">ほしキャラ診断</text>
  <text x="600" y="205" text-anchor="middle" font-family="Zen Maru Gothic" font-size="30" font-weight="700" fill="#6B5B95">生まれた瞬間の星でわかる、16キャラ×本格星占い</text>
  ${row}
  <text x="600" y="500" text-anchor="middle" font-family="Zen Maru Gothic" font-size="40" font-weight="700" fill="#5B3FA6">あなたは、どのほしキャラ？</text>
  <text x="600" y="552" text-anchor="middle" font-family="Zen Maru Gothic" font-size="24" font-weight="700" fill="#AC9AC8">starflect.asanuma.works</text>
</svg>`
}

function rasterize(svg: string, out: string) {
  const r = new Resvg(svg, {
    font: { fontBuffers: [font], defaultFontFamily: 'Zen Maru Gothic', loadSystemFonts: false },
    fitTo: { mode: 'width', value: W },
  })
  writeFileSync(out, r.render().asPng())
}

mkdirSync(new URL('../public/ogp/', import.meta.url), { recursive: true })
let count = 0
for (const sun of ORDER) {
  for (const moon of ORDER) {
    const slug = `${SLUG[sun]}_${SLUG[moon]}`
    const out = new URL(`../public/ogp/${slug}.png`, import.meta.url)
    rasterize(cardSvg(sun, moon), out)
    count++
    console.log(`  ${slug}.png  (${T[sun][moon].name})`)
  }
}
rasterize(defaultSvg(), new URL('../public/ogp/default.png', import.meta.url))
console.log(`done: ${count} character cards + default.png`)
