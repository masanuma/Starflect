/**
 * 紹介LP と キャラ別ページ の静的HTMLを、7言語で生成する。
 * setLang(lang) を呼んでから ui()/allStarTypes()/elementLabel()/elementPhrase() を使うと、
 * その言語のデータで返る(アプリと同じ翻訳資産をそのまま流用)。
 * URL: ja は / と /c/<slug>、他言語は /<lang> と /<lang>/c/<slug>。
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import HoshiKyaraMascot from '../src/components/HoshiKyaraMascot'
import BrandMascot from '../src/components/BrandMascot'
import PlanetMascot, { MASCOT_COLOR } from '../src/components/PlanetMascot'
import { setLang, getLang, LANGS } from '../src/lib/i18n'
import type { Lang } from '../src/lib/i18n'
import { ui, quoted } from '../src/lib/ui'
// astro非依存の純データのみ参照(signs/startypes を読み込まない＝サーバーは astronomy-engine を読まない)
import { STAR_TYPES, ELEMENT_LABEL, ELEMENT_WORD_L } from '../src/lib/starData'
import type { StarType, Element } from '../src/lib/starData'
import type { PlanetKey } from '../src/lib/types'
import { PAGE_STRINGS, ELEMENT_ICON, ELEMENT_COLOR } from './pageStrings'
import { SLUG, ELEMENT_ORDER } from './characters'
import { pairSummary } from '../src/lib/compatCore'
import {
  PLANET_ORDER, PLANET_SYMBOL, PLANET_NAME, PLANET_ROLE, PLANET_DOMAIN,
  SIGN_NAMES, SIGN_SYMBOLS, SIGN_KEYWORDS, SIGN_ELEMENTS,
} from '../src/lib/astroText'

const ORIGIN = 'https://starflect.asanuma.works'
export const CONTENT_LANGS: Lang[] = ['ja', 'en', 'es', 'fr', 'it', 'pt', 'ko']

const slugOf = (sun: Element, moon: Element) => `${SLUG[sun]}_${SLUG[moon]}`
const lpHref = (l: Lang) => (l === 'ja' ? '/' : `/${l}`)
const charHref = (l: Lang, slug: string) => (l === 'ja' ? `/c/${slug}` : `/${l}/c/${slug}`)
const lpUrl = (l: Lang) => ORIGIN + (l === 'ja' ? '/' : `/${l}`)
const charUrl = (l: Lang, slug: string) => ORIGIN + (l === 'ja' ? `/c/${slug}` : `/${l}/c/${slug}`)
const starsHref = (l: Lang) => (l === 'ja' ? '/stars' : `/${l}/stars`)
const starsUrl = (l: Lang) => ORIGIN + starsHref(l)
const pairHref = (l: Lang) => (l === 'ja' ? '/pair' : `/${l}/pair`)
const pairUrl = (l: Lang) => ORIGIN + pairHref(l)

// signs/startypes と同じ挙動を純データで再実装(getLang() 参照。setLang(lang) 後に呼ぶ)
const elementLabel = (el: Element): string => (ELEMENT_LABEL[getLang()] ?? ELEMENT_LABEL.ja)[el]
const elementWord = (el: Element): string => (ELEMENT_WORD_L[getLang()] ?? ELEMENT_WORD_L.ja)[el]
const elementPhrase = (el: Element): string =>
  getLang() === 'ja' ? `${elementLabel(el)}の${elementWord(el)}` : `${elementLabel(el)} · ${elementWord(el)}`

interface STItem {
  type: StarType
  sunElement: Element
  moonElement: Element
}
function allStarTypes(): STItem[] {
  const table = STAR_TYPES[getLang()] ?? STAR_TYPES.ja
  const out: STItem[] = []
  for (const sun of ELEMENT_ORDER) for (const moon of ELEMENT_ORDER) out.push({ type: table[sun][moon], sunElement: sun, moonElement: moon })
  return out
}

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /><link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700&family=Zen+Maru+Gothic:wght@500;700;900&display=swap" rel="stylesheet" />`

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
:root{--pink:#EA6596;--violet:#8A63DD;--ink:#3a2f57;--ink-sub:#7a6f96;--bg:#F8F5FD;--card:#fff;--line:#ece4f7}
body{font-family:'Zen Kaku Gothic New','Hiragino Sans',sans-serif;color:var(--ink);background:var(--bg);line-height:1.8;-webkit-font-smoothing:antialiased}
.wrap{max-width:760px;margin:0 auto;padding:0 20px}
a{color:var(--violet);text-decoration:none}
h1,h2,h3{font-family:'Zen Maru Gothic',sans-serif}
.topbar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 0;flex-wrap:wrap}
.brand{display:inline-flex;align-items:center;gap:7px}
.brand-ic{flex:none;width:30px;height:30px}
.brand-ic svg{display:block}
.brand-tx{font-family:'Zen Maru Gothic';font-weight:800;font-size:18px;background:linear-gradient(120deg,var(--pink),var(--violet));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.langsw{display:flex;flex-wrap:wrap;gap:3px}
.langsw a{font-size:11.5px;font-weight:700;color:var(--ink-sub);padding:4px 8px;border-radius:999px;border:1px solid var(--line)}
.langsw a[aria-current]{background:linear-gradient(120deg,var(--pink),var(--violet));color:#fff;border-color:transparent}
.hero{text-align:center;padding:24px 0 28px}
.hero-mascot{width:116px;margin:0 auto 10px;filter:drop-shadow(0 10px 20px rgba(138,99,221,.28))}
.hero-mascot svg{display:block}
.hero h1{font-size:30px;font-weight:800;line-height:1.4;margin-bottom:12px}
.hero .grad{background:linear-gradient(120deg,var(--pink),var(--violet));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.hero p{color:var(--ink-sub);font-size:15px;margin-bottom:22px}
.cta{display:inline-block;padding:15px 30px;border-radius:999px;background:linear-gradient(120deg,var(--pink),var(--violet));color:#fff;font-family:'Zen Maru Gothic';font-weight:800;font-size:16px;box-shadow:0 10px 24px rgba(138,99,221,.28)}
.note{font-size:12px;color:var(--ink-sub);margin-top:12px}
section{margin:36px 0}
section h2{font-size:20px;font-weight:800;text-align:center;margin-bottom:8px}
section .lead{text-align:left;color:var(--ink-sub);font-size:14px;margin-bottom:20px;line-height:1.9}
.prose{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px;font-size:15px}
.prose p{margin-bottom:12px}.prose p:last-child{margin-bottom:0}
.tgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.tcard{display:flex;flex-direction:column;align-items:center;text-align:center;gap:3px;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:16px 12px;transition:transform .12s,box-shadow .12s}
.tcard:hover{transform:translateY(-3px);box-shadow:0 10px 22px rgba(138,99,221,.16)}
.tav{width:64px;height:64px;border-radius:50%;background:#f3eefb;display:flex;align-items:center;justify-content:center;margin-bottom:3px}
.tcombo{font-size:11px;color:var(--ink-sub)}
.tname{font-family:'Zen Maru Gothic';font-weight:800;font-size:14.5px;color:var(--ink)}
.tcopy{font-size:11.5px;color:var(--ink-sub);line-height:1.55}
.formula{display:flex;gap:10px;justify-content:center;margin:18px 0}
.fbox{flex:1;max-width:240px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;text-align:center}
.fbox .lb{font-size:11px;color:var(--ink-sub)}
.fbox .el{font-family:'Zen Maru Gothic';font-weight:800;font-size:15px;margin-top:4px;display:flex;align-items:center;justify-content:center;gap:6px}
.els{display:grid;gap:8px;margin-top:14px}
.elrow{display:flex;align-items:center;gap:11px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:11px 14px;font-size:13px;color:var(--ink-sub)}
.elrow b{font-family:'Zen Maru Gothic';color:var(--ink);margin-right:6px}
.elmark{flex:none;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.steps{display:grid;gap:12px}
.step{display:flex;gap:14px;align-items:flex-start;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px}
.step .n{flex:none;width:30px;height:30px;border-radius:50%;background:linear-gradient(120deg,var(--pink),var(--violet));color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:15px}
.step b{font-family:'Zen Maru Gothic'}
.cta-block{text-align:center;margin:32px 0}
.faq details{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin-bottom:10px}
.faq summary{font-family:'Zen Maru Gothic';font-weight:700;cursor:pointer;font-size:14.5px}
.faq p{margin-top:8px;font-size:13.5px;color:var(--ink-sub)}
.chero{text-align:center;padding:20px 0 8px}
.chero .av{width:150px;height:150px;border-radius:50%;margin:0 auto 14px;display:flex;align-items:center;justify-content:center}
.chero h1{font-size:30px;font-weight:900}
.chero .cp{color:var(--ink-sub);font-size:15px;margin-top:6px}
.chero .cp.left{text-align:left;line-height:1.9;margin-top:12px}
.back{display:inline-block;margin:8px 0;font-size:13px}
.pgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
.pcard{display:flex;flex-direction:column;align-items:center;text-align:center;gap:3px;border:1.5px solid;border-radius:16px;padding:14px 12px}
.pav{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:2px}
.pname{font-family:'Zen Maru Gothic';font-size:15px}
.prole{font-size:12.5px;font-weight:700}
.pdom{font-size:12px;color:var(--ink-sub);line-height:1.6}
.suncard{display:flex;gap:14px;align-items:flex-start;border:1.5px solid;border-radius:20px;padding:16px;margin-top:14px}
.sunav{flex:none;width:96px;height:96px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.sunbody{display:flex;flex-direction:column;gap:3px;text-align:left;min-width:0}
.sunname{font-family:'Zen Maru Gothic';font-size:19px}
.sunrole{font-size:13.5px;font-weight:800}
.sundom{font-size:13px;color:var(--ink-sub)}
.sunnote{font-size:12.5px;color:var(--ink-sub);line-height:1.8;margin-top:6px;border-top:1px dashed var(--line);padding-top:8px}
.pairnote{font-size:13px;color:var(--ink-sub);line-height:1.9;text-align:left;margin-top:10px}
.pgroup{margin-top:26px}
.pgroup h3{font-family:'Zen Maru Gothic';font-size:17px;font-weight:800;margin-bottom:6px}
.glead{font-size:13.5px;color:var(--ink-sub);line-height:1.9;text-align:left}
.gnote{font-size:12px;color:var(--ink-sub);line-height:1.8;text-align:left;margin-top:10px}
.egroup{border:1.5px solid;border-radius:18px;padding:14px 15px;margin-top:12px;background:var(--card)}
.ehead{display:flex;align-items:center;gap:11px;margin-bottom:10px}
.ehead b{font-family:'Zen Maru Gothic';font-size:15px;display:block}
.edesc{font-size:12.5px;color:var(--ink-sub)}
.schips{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.schip{background:#faf7ff;border:1px solid var(--line);border-radius:12px;padding:9px 8px;text-align:center}
.schip b{font-family:'Zen Maru Gothic';font-size:13.5px;display:block;margin-bottom:2px}
.schip span{font-size:10.5px;color:var(--ink-sub);line-height:1.5;display:block}
.exline{text-align:center;margin-top:14px;font-size:15px;font-family:'Zen Maru Gothic';background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px}
.ex-role{color:var(--pink-strong);font-weight:800}
.ex-planet{font-weight:700}
.ex-sign{color:var(--violet);font-weight:800}
@media(max-width:380px){.schips{grid-template-columns:1fr 1fr}}
.starslink{display:block;text-align:center;margin:8px 0 0;font-size:13.5px}
.footer{text-align:center;color:var(--ink-sub);font-size:12px;padding:32px 0;border-top:1px solid var(--line);margin-top:40px;line-height:1.9}
@media(max-width:400px){.tgrid{grid-template-columns:1fr}}
.combos{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:8px}.combos li{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:9px 11px;font-size:13px;text-align:center}@media(max-width:380px){.combos{grid-template-columns:1fr}}.cscope{text-align:center;font-size:12.5px;color:var(--ink-sub);margin:8px 0 0;font-weight:700;line-height:1.9}
.pairhero{display:flex;align-items:center;justify-content:center;gap:14px;margin:18px 0 6px}
.pairhero .pax{font-size:26px;color:var(--ink-sub);font-weight:700}
.plist{list-style:none;padding:0;margin:0;display:grid;gap:10px}
.pairres{margin:6px 0 10px;text-align:center}.pairres-names{font-family:'Zen Maru Gothic';font-size:15px;font-weight:700;margin:0 0 2px}.pairres-pct{font-family:'Zen Maru Gothic';font-size:52px;font-weight:900;line-height:1.1;margin:0;background:linear-gradient(90deg,#E85B96,#7A4FD0);-webkit-background-clip:text;background-clip:text;color:transparent}.pairres-unit{font-size:24px}.pairres-nick{font-family:'Zen Maru Gothic';font-size:17px;font-weight:700;color:var(--violet);margin:2px 0 0}
.plist li{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;font-size:14.5px;line-height:1.85}
.hk-m{transform-box:fill-box;transform-origin:center}.hk-glow{animation:hk-glow 3.4s ease-in-out infinite alternate}@keyframes hk-glow{from{opacity:.5}to{opacity:1}}.hk-m-fire{animation:hk-fire 4.2s ease-in-out infinite alternate}@keyframes hk-fire{from{transform:translateY(.6px) scale(.99)}to{transform:translateY(-.6px) scale(1.012)}}.hk-m-earth{animation:hk-earth 7s ease-in-out infinite alternate}@keyframes hk-earth{from{transform:scale(.996)}to{transform:scale(1.008)}}.hk-m-air{animation:hk-air 5.4s ease-in-out infinite alternate}@keyframes hk-air{from{transform:translateX(-.9px) rotate(-1.2deg)}to{transform:translateX(.9px) rotate(1.2deg)}}.hk-m-water{animation:hk-water 6.2s ease-in-out infinite alternate}@keyframes hk-water{from{transform:translateY(-.8px)}to{transform:translateY(.8px)}}@media(prefers-reduced-motion:reduce){.hk-m,.hk-glow{animation:none}}
`

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/**
 * マスコットは1体ずつ renderToStaticMarkup するため、React の useId() が毎回同じ値になる。
 * 同じキャラを1ページに2回置いても衝突しないよう、ここで毎回ユニークな接頭辞に付け替える。
 * (gen-ogp.tsx が複数体を1枚に載せるときと同じやり方)
 */
let mascotSeq = 0
const mascot = (sun: Element, moon: Element, size: number) => {
  const p = `hk${mascotSeq++}`
  return renderToStaticMarkup(createElement(HoshiKyaraMascot, { sunElement: sun, moonElement: moon, size })).replace(
    /(id="|url\(#)([A-Za-z0-9]+)/g,
    (_m, head, id) => `${head}${p}${id}`,
  )
}
// ブランドマスコットも1ページに複数置くので同じ理由で付け替える
let brandSeq = 0
const brand = (size: number) => {
  const p = `br${brandSeq++}`
  return renderToStaticMarkup(createElement(BrandMascot, { size })).replace(
    /(id="|url\(#)([A-Za-z0-9]+)/g,
    (_m, head, id) => `${head}${p}${id}`,
  )
}
const planetMascot = (key: PlanetKey, size: number) =>
  renderToStaticMarkup(createElement(PlanetMascot, { planetKey: key, size }))
const elMark = (el: Element) =>
  `<span class="elmark" style="background:${ELEMENT_COLOR[el]}"><svg width="18" height="18" viewBox="0 0 24 24">${ELEMENT_ICON[el]}</svg></span>`

interface LayoutOpts {
  lang: Lang
  title: string
  description: string
  ogTitle: string
  ogImage: string
  body: string
  kind: 'lp' | 'char' | 'stars' | 'pair'
  slug?: string
  redirectIfCompanion?: boolean
}

function layout(o: LayoutOpts): string {
  const urlOf = (l: Lang) =>
    o.kind === 'lp' ? lpUrl(l) : o.kind === 'stars' ? starsUrl(l) : o.kind === 'pair' ? pairUrl(l) : charUrl(l, o.slug!)
  const hrefOf = (l: Lang) =>
    o.kind === 'lp' ? lpHref(l) : o.kind === 'stars' ? starsHref(l) : o.kind === 'pair' ? pairHref(l) : charHref(l, o.slug!)
  const canonical = urlOf(o.lang)
  const alt = urlOf
  const href = hrefOf
  const alternates =
    CONTENT_LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${alt(l)}"/>`).join('') +
    `<link rel="alternate" hreflang="x-default" href="${alt('ja')}"/>`
  const switcher = LANGS.map(
    (x) => `<a href="${href(x.code)}"${x.code === o.lang ? ' aria-current="true"' : ''}>${x.label}</a>`,
  ).join('')
  const redirect = o.redirectIfCompanion
    ? `<script>try{if(localStorage.getItem('starflect-companion:v1')&&!/[?&]stay/.test(location.search))location.replace('/app')}catch(e){}</script>`
    : ''
  const t = ui()
  return `<!doctype html><html lang="${o.lang}"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="theme-color" content="#F8F5FD"/>
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}"/>
<link rel="canonical" href="${canonical}"/>
<meta name="robots" content="index, follow, max-image-preview:large"/>
<link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
${alternates}
<meta property="og:type" content="website"/><meta property="og:site_name" content="ほしキャラ診断 〜Starflect〜"/>
<meta property="og:title" content="${esc(o.ogTitle)}"/><meta property="og:description" content="${esc(o.description)}"/>
<meta property="og:url" content="${canonical}"/><meta property="og:image" content="${o.ogImage}"/>
<meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/>
<meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${esc(o.ogTitle)}"/><meta name="twitter:image" content="${o.ogImage}"/>
${FONTS}${redirect}<style>${CSS}</style></head>
<body><div class="wrap">
<div class="topbar"><a href="${lpHref(o.lang)}" class="brand"><span class="brand-ic">${brand(30)}</span><span class="brand-tx">${esc(t.home.appTitle)}</span></a><nav class="langsw">${switcher}</nav></div>
${o.body}
<div class="footer">© ${esc(t.home.appTitle)} 〜Starflect〜</div></div></body></html>`
}

type ST = ReturnType<typeof allStarTypes>[number]
function tcard(lang: Lang, r: ST): string {
  const slug = slugOf(r.sunElement, r.moonElement)
  return `<a class="tcard" href="${charHref(lang, slug)}"><span class="tav">${mascot(r.sunElement, r.moonElement, 58)}</span><span class="tcombo">${elementLabel(r.sunElement)} × ${elementLabel(r.moonElement)}</span><span class="tname">${esc(quoted(r.type.name))}</span><span class="tcopy">${esc(r.type.copy)}</span></a>`
}

/** 紹介LP */
export function renderLP(lang: Lang): string {
  setLang(lang)
  const t = ui()
  const P = PAGE_STRINGS[lang]
  const types = allStarTypes()
  const grid = types.map((r) => tcard(lang, r)).join('')
  const elements = ELEMENT_ORDER.map(
    (el) => `<div class="elrow">${elMark(el)}<span><b>${esc(elementLabel(el))}</b>${esc(t.about.elements[el])}</span></div>`,
  ).join('')
  const steps = P.steps
    .map((s, i) => `<div class="step"><span class="n">${i + 1}</span><span><b>${esc(s.t)}</b><br/>${esc(s.d)}</span></div>`)
    .join('')
  const faq = t.faq.items
    .map((q) => `<details><summary>${esc(q.q)}</summary><p>${esc(q.a)}</p></details>`)
    .join('')

  const body = `
<div class="hero">
  <div class="hero-mascot">${brand(116)}</div>
  <h1>${esc(t.home.tagline1)}</h1>
  <p>${esc(t.home.tagline2)}</p>
  <a class="cta" href="/app?lang=${lang}">${esc(P.cta)}</a>
  <p class="note">${esc(P.heroNote)}</p>
</div>

<section>
  <h2>${esc(t.about.title)}</h2>
  <div class="prose">${t.about.what.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
  <div class="formula">
    <div class="fbox"><div class="lb">☉ ${esc(t.about.sunElement)}</div><div class="el">4</div></div>
    <div class="fbox"><div class="lb">☽ ${esc(t.about.moonElement)}</div><div class="el">4</div></div>
  </div>
  <p class="lead">${esc(t.about.howTitle)} — 4 × 4 = 16</p>
  <p class="lead" style="font-weight:700;color:var(--ink);margin-bottom:8px">${esc(t.about.elementsTitle)}</p>
  <div class="els">${elements}</div>
</section>

<section>
  <h2>${esc(t.about.listTitle)}</h2>
  <p class="lead">${esc(t.about.listSub)}</p>
  <div class="tgrid">${grid}</div>
</section>

<section>
  <h2>${esc(P.howTo)}</h2>
  <div class="steps">${steps}</div>
  <div class="cta-block"><a class="cta" href="/app?lang=${lang}">${esc(P.cta)}</a></div>
  <a class="starslink" href="${starsHref(lang)}">${esc(P.starsLink)} →</a>
</section>

<section class="faq">
  <h2>${esc(t.faq.title)}</h2>
  ${faq}
</section>
`
  return layout({
    lang,
    title: `${t.home.appTitle}｜${t.home.tagline2}`,
    description: `${t.home.tagline1} ${t.home.tagline2}`,
    ogTitle: `${t.home.appTitle} 〜Starflect〜`,
    ogImage: `${ORIGIN}/ogp/default.png`,
    body,
    kind: 'lp',
    redirectIfCompanion: true,
  })
}

/** キャラ別ページ。無効な slug は null */
export function renderCharPage(lang: Lang, slug: string): string | null {
  setLang(lang)
  const t = ui()
  const P = PAGE_STRINGS[lang]
  const types = allStarTypes()
  const r = types.find((x) => slugOf(x.sunElement, x.moonElement) === slug)
  if (!r) return null
  const others = types.filter((x) => x !== r).map((x) => tcard(lang, x)).join('')
  const qname = quoted(r.type.name)

  /**
   * このキャラに当てはまる星座の一覧。
   *
   * キャラはエレメントで決まるので **1キャラ＝太陽3星座 × 月3星座＝9通り**をカバーする。
   * 従来このページには星座名が1つも無く、実際に検索される語（「太陽おうし座 月しし座」など）と
   * 接点がゼロだった。9通りを明記することで、造語の名前を保ったまま検索意図に当たる。
   */
  const signNames = SIGN_NAMES[lang] ?? SIGN_NAMES.ja
  const signsOf = (el: Element) => SIGN_ELEMENTS.map((e, i) => (e === el ? i : -1)).filter((i) => i >= 0)
  const sunSigns = signsOf(r.sunElement)
  const moonSigns = signsOf(r.moonElement)
  const comboChips = sunSigns
    .flatMap((si) => moonSigns.map((mi) => P.comboItem(signNames[si], signNames[mi])))
    .map((x) => `<li>${esc(x)}</li>`)
    .join('')
  /**
   * ヒーロー直下の一行。**このページが誰のためのページか**を星座名で示す。
   * 検索語（星座名）がページ上部に来るので、`combos` セクションと合わせて検索意図に当たる。
   * ※エレメント名（地・火）だけだと「太陽地 × 月火」のような意味の取れない表記になる。
   */
  const nm = PLANET_NAME[lang] ?? PLANET_NAME.ja
  const listOf = (idx: number[]) => idx.map((i) => signNames[i]).join(' · ')
  const scopeLine =
    `${PLANET_SYMBOL.sun} ${esc(nm.sun)}: ${esc(listOf(sunSigns))}` +
    ` &nbsp;/&nbsp; ${PLANET_SYMBOL.moon} ${esc(nm.moon)}: ${esc(listOf(moonSigns))}`

  const combos = `
<section>
  <h2>${esc(P.combosTitle)}</h2>
  <p class="lead">${esc(P.combosLead(r.type.name, elementLabel(r.sunElement), elementLabel(r.moonElement)))}</p>
  <ul class="combos">${comboChips}</ul>
</section>
`
  const body = `
<div class="chero">
  <div class="av" style="background:#f3eefb">${mascot(r.sunElement, r.moonElement, 118)}</div>
  <h1><span class="grad">${esc(qname)}</span></h1>
  <p class="cp">${esc(r.type.copy)}</p>
  <p class="cscope">${scopeLine}</p>
</div>

<div class="prose"><p>${esc(r.type.text)}</p></div>

<div class="formula">
  <div class="fbox"><div class="lb">☉ ${esc(t.about.outer)}</div><div class="el">${elMark(r.sunElement)} ${esc(elementPhrase(r.sunElement))}</div></div>
  <div class="fbox"><div class="lb">☽ ${esc(t.about.inner)}</div><div class="el">${elMark(r.moonElement)} ${esc(elementPhrase(r.moonElement))}</div></div>
</div>

${combos}

<div class="cta-block">
  <a class="cta" href="/app?lang=${lang}">${esc(P.cta)}</a>
  <p class="note">${esc(P.heroNote)}</p>
  <a class="starslink" href="${starsHref(lang)}">${esc(P.starsLink)} →</a>
</div>

<section>
  <h2>${esc(P.otherTitle)}</h2>
  <p class="lead">${esc(t.about.listSub)}</p>
  <div class="tgrid">${others}</div>
</section>

<a class="back" href="${lpHref(lang)}">${esc(P.backToTop)}</a>
`
  return layout({
    lang,
    // <title> は検索語を前に、造語は後ろに(ブランド価値は残す)。og:title はSNS用なのでキャラ名のまま
    title: `${P.charTitleSeo(r.type.name)}｜${t.home.appTitle}`,
    description: `${qname}: ${r.type.copy} ${P.combosLead(r.type.name, elementLabel(r.sunElement), elementLabel(r.moonElement))}`,
    ogTitle: `${qname}｜${t.home.appTitle}`,
    ogImage: `${ORIGIN}/ogp/${slug}.png`,
    body,
    kind: 'char',
    slug,
  })
}

/** 10天体と12星座の説明ページ(/stars)。アプリで突然出てくる用語の受け皿 */
/**
 * 相性の紹介ページ(/pair)。**相性シェアの着地先**。
 *
 * 相性結果を受け取った人がまず知りたいのは「自分もやってみたい」の一点なので、
 * 説明は3つに絞り、すぐCTAに落とす。CTAは `?mode=pair` を付けて相性フォームを直接ひらく
 * (トップに落とすと、相性を見たくて来た人がひとり用の診断に迷い込む)。
 */
/** スラッグから太陽・月のエレメントを引く。不正なら null */
export function elementsOfSlug(slug: string): { sun: Element; moon: Element } | null {
  const [a, b] = slug.split('_')
  const rev = Object.fromEntries(ELEMENT_ORDER.map((e) => [SLUG[e], e])) as Record<string, Element>
  if (!rev[a] || !rev[b]) return null
  return { sun: rev[a], moon: rev[b] }
}

/**
 * 相性の紹介ページ(/pair)。**相性シェアの着地先**。
 *
 * 相性結果を受け取った人がまず知りたいのは「自分もやってみたい」の一点なので、
 * 説明は3つに絞り、すぐCTAに落とす。CTAは `?mode=pair` を付けて相性フォームを直接ひらく
 * (トップに落とすと、相性を見たくて来た人がひとり用の診断に迷い込む)。
 *
 * `pair` を渡すと「そのふたりの結果」を見出しとOGPに出す。**LINEは本文を送れずURLだけ**なので、
 * カードに%と呼び名が出ないと「72%だった」という肝心の中身が相手に伝わらない。
 * 相性は太陽・月のエレメントだけで決まるため、スラッグ2つから正しい値を再計算できる。
 */
export function renderPairPage(lang: Lang, pair?: { a: string; b: string }): string {
  setLang(lang)
  const t = ui()
  const P = PAGE_STRINGS[lang]

  const ea = pair ? elementsOfSlug(pair.a) : null
  const eb = pair ? elementsOfSlug(pair.b) : null
  const types = STAR_TYPES[lang] ?? STAR_TYPES.ja
  const result =
    ea && eb
      ? {
          ...pairSummary(lang, ea.sun, ea.moon, eb.sun, eb.moon),
          nameA: types[ea.sun][ea.moon].name,
          nameB: types[eb.sun][eb.moon].name,
          ea,
          eb,
        }
      : null

  // 結果つきなら本人たちのキャラを、無ければ見本として対照的な2キャラを並べる
  const left = result ? result.ea : { sun: '火' as Element, moon: '火' as Element }
  const right = result ? result.eb : { sun: '水' as Element, moon: '水' as Element }
  const sample =
    `<div class="pairhero">` +
    `<span class="pav">${mascot(left.sun, left.moon, 88)}</span>` +
    `<span class="pax" aria-hidden="true">×</span>` +
    `<span class="pav">${mascot(right.sun, right.moon, 88)}</span>` +
    `</div>`

  const resultBlock = result
    ? `<div class="pairres">` +
      `<p class="pairres-names">${esc(quoted(result.nameA))} × ${esc(quoted(result.nameB))}</p>` +
      `<p class="pairres-pct">${result.percent}<span class="pairres-unit">%</span></p>` +
      `<p class="pairres-nick">${result.emoji} ${esc(result.nickname)}</p>` +
      `</div>`
    : ''

  const points = P.pairPoints.map((x) => `<li>${esc(x)}</li>`).join('')

  const body = `
<section class="chero">
  <h1>${esc(P.pairTitle)}</h1>
  ${sample}
  ${resultBlock}
  <p class="lead">${esc(P.pairLead)}</p>
</section>

<section>
  <ul class="plist">${points}</ul>
</section>

<div class="cta-block">
  <a class="cta" href="/app?lang=${lang}&amp;mode=pair">${esc(P.pairCta)}</a>
  <p class="note">${esc(P.pairNote)}</p>
</div>

<a class="starslink" href="${starsHref(lang)}">${esc(P.starsLink)} →</a>
<a class="back" href="${lpHref(lang)}">${esc(P.backToTop)}</a>
`
  // 結果つきのときは、カードの見出しを「そのふたりの結果」にする(LINEはこれしか伝わらない)
  const ogTitle = result
    ? `${quoted(result.nameA)} × ${quoted(result.nameB)} = ${result.percent}% ${result.nickname}`
    : `${P.pairTitle}｜${t.home.appTitle}`

  return layout({
    lang,
    title: `${P.pairTitle}｜${t.home.appTitle}`,
    description: P.pairLead,
    ogTitle,
    ogImage: `${ORIGIN}/ogp/pair.png`,
    body,
    kind: 'pair',
  })
}

export function renderStarsPage(lang: Lang): string {
  setLang(lang)
  const t = ui()
  const P = PAGE_STRINGS[lang]
  const nm = PLANET_NAME[lang] ?? PLANET_NAME.ja
  const role = PLANET_ROLE[lang] ?? PLANET_ROLE.ja
  const dom = PLANET_DOMAIN[lang] ?? PLANET_DOMAIN.ja
  const signNames = SIGN_NAMES[lang] ?? SIGN_NAMES.ja
  const signKw = SIGN_KEYWORDS[lang] ?? SIGN_KEYWORDS.ja

  // 読み方の例: アプリの星の行と同じ組み立て(太陽 × しし座)を見せて、結果画面の読み方を教える
  const exIdx = 4 // しし座
  const ex = t.result.roleSign(role.sun, nm.sun, signNames[exIdx], false)
  const example =
    `<p class="exline">` +
    `<span class="ex-role">${esc(PLANET_SYMBOL.sun)} ${esc(ex.role)}</span>${esc(ex.sep1)}` +
    `<span class="ex-planet">${esc(ex.planetLabel)}</span>${esc(ex.sep2)}` +
    `<span class="ex-sign">${esc(SIGN_SYMBOLS[exIdx])} ${esc(ex.sign)}</span></p>`

  // 天体カード(アプリで会うキャラと同じ顔にする)
  const pcard = (k: PlanetKey) => {
    const c = MASCOT_COLOR[k]
    return (
      `<div class="pcard" style="background:${c}12;border-color:${c}44">` +
      `<span class="pav" style="background:${c}2e">${planetMascot(k, 52)}</span>` +
      `<b class="pname">${esc(nm[k])}</b>` +
      `<span class="prole" style="color:${c}">${esc(role[k])}</span>` +
      `<span class="pdom">${esc(dom[k])}</span>` +
      `</div>`
    )
  }

  // 太陽と月はほしキャラの生成理由なので、同じ大きさの横並びカードで対に見せる
  const bigCard = (k: PlanetKey, note?: string) => {
    const c = MASCOT_COLOR[k]
    return (
      `<div class="suncard" style="background:${c}14;border-color:${c}55">` +
      `<span class="sunav" style="background:${c}2e">${planetMascot(k, 84)}</span>` +
      `<div class="sunbody"><b class="sunname">${esc(PLANET_SYMBOL[k])} ${esc(nm[k])}</b>` +
      `<span class="sunrole" style="color:${c}">${esc(role[k])}</span>` +
      `<span class="sundom">${esc(dom[k])}</span>` +
      (note ? `<span class="sunnote">${esc(note)}</span>` : '') +
      `</div></div>`
    )
  }
  // 太陽は誰もが知っている入口なので先頭に置く
  const sunBlock = bigCard('sun', P.sunNote)
  // 太陽×月＝ほしキャラの生成理由。ここまでを先に見せると「よくある12星座占い」との違いが伝わる
  const pairBlock = bigCard('moon') + `<p class="pairnote">${esc(t.result.partyPairNote)}</p>`

  // 自分 → 周り → 時代 とズームアウトする3グループ(公転の速さが分類の根拠)
  const GROUPS: { title: string; lead: string; keys: PlanetKey[]; note?: string }[] = [
    { title: t.result.partyGroup1, lead: P.g1Lead, keys: ['asc', 'mercury', 'venus', 'mars'], note: P.ascNote },
    { title: t.result.partyGroup2, lead: P.g2Lead, keys: ['jupiter', 'saturn'] },
    { title: t.result.partyGroup3, lead: P.g3Lead, keys: ['uranus', 'neptune', 'pluto'] },
  ]
  const planetGroups = GROUPS.map(
    (g) =>
      `<section class="pgroup"><h3>${esc(g.title)}</h3><p class="glead">${esc(g.lead)}</p>` +
      `<div class="pgrid">${g.keys.map(pcard).join('')}</div>` +
      (g.note ? `<p class="gnote">${esc(g.note)}</p>` : '') +
      `</section>`,
  ).join('')

  // 12星座はエレメントごとに3つずつまとめる(4×3の関係が一目で分かる)
  const groups = ELEMENT_ORDER.map((el) => {
    const chips = signNames
      .map((n, i) => ({ n, i }))
      .filter(({ i }) => SIGN_ELEMENTS[i] === el)
      .map(
        ({ n, i }) =>
          `<div class="schip"><b>${esc(SIGN_SYMBOLS[i])} ${esc(n)}</b><span>${esc(signKw[i].join(' · '))}</span></div>`,
      )
      .join('')
    return (
      `<section class="egroup" style="border-color:${ELEMENT_COLOR[el]}55">` +
      `<div class="ehead">${elMark(el)}<span><b>${esc(elementPhrase(el))}</b><span class="edesc">${esc(t.about.elements[el])}</span></span></div>` +
      `<div class="schips">${chips}</div></section>`
    )
  }).join('')

  const body = `
<div class="chero">
  <h1><span class="grad">${esc(P.starsTitle)}</span></h1>
  <p class="cp left">${esc(P.starsLead)}</p>
</div>

<section>
  <h2>${esc(P.howReadTitle)}</h2>
  <p class="lead">${esc(P.howReadLead)}</p>
  <div class="formula">
    <div class="fbox"><div class="lb">${esc(P.whoLabel)}</div><div class="el">${planetMascot('sun', 44)}</div></div>
    <div class="fbox"><div class="lb">${esc(P.howLabel)}</div><div class="el">${esc(SIGN_SYMBOLS[exIdx])}</div></div>
  </div>
  ${example}
</section>

<section>
  <h2>${esc(P.planetsTitle)}</h2>
  <p class="lead">${esc(P.planetsLead)}</p>
  ${sunBlock}
  ${pairBlock}
  ${planetGroups}
</section>

<section>
  <h2>${esc(P.signsTitle)}</h2>
  <p class="lead">${esc(P.signsLead)}</p>
  ${groups}
</section>

<div class="cta-block">
  <a class="cta" href="/app?lang=${lang}">${esc(P.cta)}</a>
  <p class="note">${esc(P.heroNote)}</p>
</div>

<a class="back" href="${lpHref(lang)}">${esc(P.backToTop)}</a>
`
  return layout({
    lang,
    title: `${P.starsTitle}｜${t.home.appTitle}`,
    description: P.starsLead,
    ogTitle: `${P.starsTitle}｜${t.home.appTitle}`,
    ogImage: `${ORIGIN}/ogp/default.png`,
    body,
    kind: 'stars',
  })
}
