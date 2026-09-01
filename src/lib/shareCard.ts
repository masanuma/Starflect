/**
 * 「今日の1枚」— 毎日の運勢を、シェアできる1枚の画像カードにする。
 *
 * **なぜ作ったか**：伸びるアプリには「切り取って人に見せられる最小単位」がある
 * （Co-Starの通知スクショ、BeRealの1枚）。Starflectの運勢は良い文章だが長文のプローズで、
 * スクショの形をしていなかった。シェアできるのは診断結果だけ＝一生に1回。
 * **毎日変わるものがシェアできて、はじめて日々の露出になる。**
 *
 * 載せるのは締めの1文（その日の行動）だけ。全文を載せると読まれないし、
 * 「私の今日の占い」を全公開したい人はいない。1文なら気軽に貼れる。
 * すべて端末内で描画する（サーバーには何も送らない）。
 */

/** 運勢の本文から、カードに載せる締めの1文を取り出す */
export function pickQuote(text: string): string {
  const parts = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[。．.!?！？])/)
    .map((s) => s.trim())
    .filter(Boolean)
  return parts[parts.length - 1] ?? text
}

/** CJKは文字単位・ラテンは単語単位で、canvas幅に収まるよう行に割る */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const hasSpaces = /\s/.test(text.trim())
  const tokens = hasSpaces ? text.split(/(\s+)/) : [...text]
  const lines: string[] = []
  let line = ''
  for (const tk of tokens) {
    const trial = line + tk
    if (ctx.measureText(trial).width > maxWidth && line.trim()) {
      lines.push(line.trim())
      line = tk.trimStart()
    } else {
      line = trial
    }
  }
  if (line.trim()) lines.push(line.trim())
  return lines
}

export interface ShareCardInput {
  /** ほしキャラのSVG(文字列)。クライアントで renderToStaticMarkup したもの */
  mascotSvg: string
  /** 表示用の日付(その言語で整形済み) */
  dateLabel: string
  /** キャラ名(括弧つき表示済み文字列) */
  typeName: string
  /** カードに載せる1文 */
  quote: string
}

const W = 1080
const H = 1350

/** カードを描いて PNG Blob を返す。フォント読み込みを待ってから描く */
export async function makeShareCard(input: ShareCardInput): Promise<Blob> {
  // canvasはdocumentに読み込まれたWebフォントを使えるが、読み込み完了を待つ必要がある
  try {
    await Promise.all([
      document.fonts.load('700 64px "Zen Maru Gothic"'),
      document.fonts.load('500 40px "Zen Kaku Gothic New"'),
      document.fonts.ready,
    ])
  } catch {
    /* フォントが来なくてもシステムフォントで描ける */
  }

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')

  // 背景: アプリと同じミルキーパステル
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#f3edfa')
  bg.addColorStop(1, '#ffffff')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  const tintPink = ctx.createRadialGradient(W * 0.85, 0, 0, W * 0.85, 0, W * 0.7)
  tintPink.addColorStop(0, 'rgba(234,101,150,0.20)')
  tintPink.addColorStop(1, 'rgba(234,101,150,0)')
  ctx.fillStyle = tintPink
  ctx.fillRect(0, 0, W, H)
  const tintViolet = ctx.createRadialGradient(W * 0.1, H * 0.05, 0, W * 0.1, H * 0.05, W * 0.8)
  tintViolet.addColorStop(0, 'rgba(138,99,221,0.18)')
  tintViolet.addColorStop(1, 'rgba(138,99,221,0)')
  ctx.fillStyle = tintViolet
  ctx.fillRect(0, 0, W, H)

  // 星(位置は固定＝同じ日は同じ見た目)
  ctx.fillStyle = 'rgba(171,147,226,0.5)'
  ctx.font = '28px serif'
  const stars: Array<[number, number, number]> = [
    [90, 180, 26], [980, 140, 20], [140, 1100, 20], [940, 1180, 26], [520, 90, 18], [860, 620, 16], [160, 640, 16],
  ]
  for (const [x, y, size] of stars) {
    ctx.font = `${size}px serif`
    ctx.fillText('✦', x, y)
  }

  // マスコット(SVG→Image)。失敗してもカード自体は成立させる
  try {
    // Reactの<svg>はxmlnsを持たないことがあり、無いとBlob経由のImageが描画されない
    const svg = input.mascotSvg.includes('xmlns')
      ? input.mascotSvg
      : input.mascotSvg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('svg load failed'))
      img.src = url
    })
    const size = 400
    ctx.drawImage(img, (W - size) / 2, 120, size, size)
    URL.revokeObjectURL(url)
  } catch {
    ctx.font = '200px serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#c9b6f0'
    ctx.fillText('✦', W / 2, 380)
  }

  ctx.textAlign = 'center'

  // キャラ名
  ctx.fillStyle = '#6a45c4'
  ctx.font = '700 52px "Zen Maru Gothic", sans-serif'
  ctx.fillText(input.typeName, W / 2, 610)

  // 日付
  ctx.fillStyle = '#5c4f82'
  ctx.font = '500 34px "Zen Kaku Gothic New", sans-serif'
  ctx.fillText(input.dateLabel, W / 2, 672)

  // 締めの1文(主役)。長さに応じて折り返す
  ctx.fillStyle = '#382e56'
  ctx.font = '700 46px "Zen Maru Gothic", sans-serif'
  const lines = wrapText(ctx, input.quote, W - 200)
  const lineH = 74
  const startY = 800
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    ctx.fillText(lines[i], W / 2, startY + i * lineH)
  }

  // フッター(アプリ名とURL)
  ctx.fillStyle = '#8a63dd'
  ctx.font = '700 30px "Zen Maru Gothic", sans-serif'
  ctx.fillText('Starflect', W / 2, H - 110)
  ctx.fillStyle = '#a294c6'
  ctx.font = '500 26px "Zen Kaku Gothic New", sans-serif'
  ctx.fillText('starflect.asanuma.works', W / 2, H - 66)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  })
}
