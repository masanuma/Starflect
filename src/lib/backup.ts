/**
 * 引き継ぎ（機種変更・データ消去への備え）。
 *
 * **なぜ「クラウド」ではなくファイルなのか。**
 * 相棒の状態には出生データ（`chart.dateLabel`）が含まれる。ところが紹介LPで
 * 「入力した生年月日そのものを送信することはありません」と**公開で約束している**ので、
 * サーバーに預ける方式はこの約束を破る。サーバー側にユーザーを識別する仕組みもDBも無い
 * （依存は express / SDK / react だけ）。
 *
 * ファイル書き出し・読み込みなら、約束を守ったまま「機種変で相棒が消える」を防げる。
 * STEP3/4と人となりで**記憶そのものが売り**になった以上、ここが抜けていると
 * 「記録が消える」ではなく「関係が消える」事故になる。
 */

/** 引き継ぐキー。前方一致で拾うものと、完全一致のものがある */
const EXACT_KEYS = ['starflect-companion:v1', 'starflect-input', 'starflect-pair', 'starflect-pair-revealed', 'starflect-lang']
const PREFIX_KEYS = ['starflect-chat:', 'starflect-report:']

/**
 * 計測の同意は**引き継がない**。同意は端末ごとに取り直すもので、
 * 別の端末に持ち込んで「同意済み」にしてしまうのは筋が悪い。
 */
const EXCLUDED = 'starflect-analytics-consent'

export interface BackupFile {
  app: 'starflect'
  v: 1
  exportedAt: string
  data: Record<string, string>
}

function collect(): Record<string, string> {
  const data: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || key === EXCLUDED) continue
    const wanted = EXACT_KEYS.includes(key) || PREFIX_KEYS.some((p) => key.startsWith(p))
    if (!wanted) continue
    const value = localStorage.getItem(key)
    if (value !== null) data[key] = value
  }
  return data
}

/** いまの記録をJSONファイルとして端末に保存する（サーバーには送らない） */
export function exportBackup(now: Date = new Date()): void {
  const file: BackupFile = { app: 'starflect', v: 1, exportedAt: now.toISOString(), data: collect() }
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const url = URL.createObjectURL(new Blob([JSON.stringify(file)], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `starflect-${stamp}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * ファイルの中身で記録を置きかえる。**呼ぶ前に必ず確認を取ること**（現在の記録が消える）。
 * 中身が壊れていれば false を返し、**何も書き換えない**（途中まで書いて壊れた状態にしない）。
 */
export function importBackup(text: string): boolean {
  let file: BackupFile
  try {
    file = JSON.parse(text) as BackupFile
  } catch {
    return false
  }
  if (file?.app !== 'starflect' || !file.data || typeof file.data !== 'object') return false
  const entries = Object.entries(file.data).filter(
    ([k, v]) =>
      typeof v === 'string' &&
      k !== EXCLUDED &&
      (EXACT_KEYS.includes(k) || PREFIX_KEYS.some((p) => k.startsWith(p))),
  )
  if (!entries.length) return false
  // 相棒の状態が読めるJSONかどうかだけは見る。ここが壊れていると起動できなくなる
  const companion = entries.find(([k]) => k === 'starflect-companion:v1')?.[1]
  if (companion) {
    try {
      const parsed = JSON.parse(companion) as { chart?: unknown }
      if (!parsed?.chart) return false
    } catch {
      return false
    }
  }
  try {
    // 古い相棒・古い会話が混ざらないよう、引き継ぎ対象のキーは一度きれいにしてから書く
    const stale: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || key === EXCLUDED) continue
      if (EXACT_KEYS.includes(key) || PREFIX_KEYS.some((p) => key.startsWith(p))) stale.push(key)
    }
    for (const key of stale) localStorage.removeItem(key)
    for (const [k, v] of entries) localStorage.setItem(k, v)
    return true
  } catch {
    return false
  }
}
