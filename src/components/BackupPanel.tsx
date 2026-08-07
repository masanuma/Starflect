import { useRef, useState } from 'react'
import { exportBackup, importBackup } from '../lib/backup'
import { useUI } from '../lib/ui'

/**
 * 引き継ぎ（機種変え・データ消去への備え）。
 *
 * クラウドではなくファイルなのは、LPで「入力した生年月日そのものを送信することはありません」と
 * **公開で約束している**から。詳しい理由は `src/lib/backup.ts` の冒頭に書いてある。
 *
 * 毎日使うものではないのでフッターに畳んで置く（表に出す量は増やさない＝憲法）。
 */
export default function BackupPanel() {
  const t = useUI()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<'done' | 'fail' | null>(null)

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // 同じファイルを続けて選び直せるように、読む前に入力をクリアしておく
    e.target.value = ''
    if (!file) return
    // 復元は現在の記録を消す。取り返しがつかないので必ず確認を取る
    if (!confirm(t.backup.confirm)) return
    const reader = new FileReader()
    reader.onload = () => {
      const ok = importBackup(String(reader.result ?? ''))
      setMsg(ok ? 'done' : 'fail')
      // 復元後はアプリ全体が古い状態を握ったままなので、読み込み直す
      if (ok) setTimeout(() => location.reload(), 800)
    }
    reader.onerror = () => setMsg('fail')
    reader.readAsText(file)
  }

  return (
    <details className="backup">
      <summary className="consent-link">{t.backup.title}</summary>
      <div className="backup-body">
        <p className="backup-note">{t.backup.note}</p>
        <div className="backup-btns">
          <button className="ghost" onClick={() => exportBackup()}>
            {t.backup.save}
          </button>
          <button className="ghost" onClick={() => fileRef.current?.click()}>
            {t.backup.load}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />
        {msg && <p className="backup-msg">{msg === 'done' ? t.backup.done : t.backup.fail}</p>}
      </div>
    </details>
  )
}
