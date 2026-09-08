import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
const dir = resolve('docs/experiments/2026-09-08')
const read = file => JSON.parse(readFileSync(resolve(dir, file), 'utf8'))
const inputs = read('inputs.json')
const raw = read('raw-generations.json')
const edited = read('edited-new.json')
if (raw.length !== 14 || edited.length !== 7) throw new Error('Expected 14 original generations and 7 edited readings')
for (const day of inputs.days) {
  for (const version of ['old','new']) {
    if (raw.filter(r => r.date === day.date && r.version === version).length !== 1) throw new Error('Missing/duplicate generation')
  }
  const e = edited.find(e => e.date === day.date)
  if (!e || !day.context.periods[0].items[e.anchorIndex]) throw new Error('Invalid edited reading/evidence')
}
const labels = { old: '旧版：現行ルール・初回生成そのまま', new: '新版：新方針の初回生成そのまま' }
const header = `# 七日分の読み比べ — 今日が少し楽しみになる占い\n\n2026年9月9日（水）〜15日（火）／架空人物「揺るがない山」\n\n## 最初に\n\nまずは見出しを眺め、気になる日から読んでみてください。新しい方が好みでなくても構いません。「どちらも違う」も大切な感想です。最後に短いメモ欄を置きました。\n\nこの資料は**旧版の実際のAI出力**と、**新方針を目指してCodexが編集した文章**の比較です。新版を自動生成だけでここまで出せたという意味ではありません。同じモデルで旧版・新版を一回ずつ生成した結果は、[自動生成だけの比較](RAW-COMPARISON.md)に全件保存しています。今回の編集案は、目指す読み味を相談するための見本です。\n\n[新方針の設計メモ](DIRECTION.md) · [生成方法・所見・限界](METHOD.md)\n\n## 比較条件\n\n- 架空の生年月日：1990年5月15日。出生時刻不明のため現行仕様どおり正午JSTで近似。上昇星座なし。本人や実在の利用者のデータではありません。\n- 太陽おうし座／月やぎ座。「揺るがない山」。火星うお座、金星おひつじ座など、10天体を使用。\n- 各日08:00 JSTの運行を既存の天体計算で取得。両版に同じ出生の性質・上位四配置を使用。\n- 会話・気分の架空履歴は追加しない。初日のみ旧版の初対面の結びを有効にする。\n- 日付別の材料は固定。毎日の本文は独立生成。新版の編集案のみ、七日分を見渡して編集した。\n\n## 七日間の入口\n\n| 日付 | 新版の見出し |\n| --- | --- |\n${edited.map(e => `| ${e.date.slice(5).replace('-', '/')} | ${e.title} |`).join('\n')}\n`
let document = header
let rawDocument = '# 同じモデルによる旧版・新版の初回生成\n\nモデル：`' + inputs.metadata.model + '`。同じ天体データ、max_tokens=1500、adaptive thinking、effort=low。一日・一方式につき一回。下記本文は未編集です。\n\n新方針の追加説明・見出し・相談導線も含むため、変更は文体だけではありません。これは小規模な試作であり、統計的な優劣判定ではありません。モデルは前日の出力を見ていません。\n\n[編集案との比較へ戻る](COMPARISON.md)\n'
for (const day of inputs.days) {
  const e = edited.find(e => e.date === day.date)
  const old = raw.find(r => r.date === day.date && r.version === 'old')
  const dateLabel = new Intl.DateTimeFormat('ja-JP', {month:'long',day:'numeric',weekday:'short',timeZone:'Asia/Tokyo'}).format(new Date(day.evaluatedAt))
  document += `\n---\n\n## ${dateLabel}\n\n### 旧版 — 現行ルールの出力\n\n${old.text}\n\n### 新版 — 編集案\n\n**${e.title}**\n\n${e.body}\n${e.caution ? `\n**ひとつ気をつけるなら**\n\n${e.caution}\n` : ''}\n**この話の続きに聞けること**\n\n${e.questions.map(q=>`- ${q}`).join('\n')}\n\n### 編集の根拠（比較用・利用画面には出さない）\n\n主軸：${day.context.periods[0].items[e.anchorIndex]}\n\n${e.rationale}\n`
  rawDocument += `\n---\n\n## ${dateLabel}\n`
  for (const version of ['old','new']) rawDocument += `\n### ${labels[version]}\n\n${raw.find(r => r.date === day.date && r.version === version).text}\n`
}
document += '\n---\n\n## 読んだあとに残しておきたいこと\n\n点数を埋める必要はありません。気になったところだけで十分です。\n\n- 一番読みたくなった日・覚えている一文：\n- 旧版の方が好きだったところ：\n- 新版でも退屈だった／作り物に感じたところ：\n- 9月13日の注意寄りの日に、少し楽になる余地はあったか：\n- 明日も読みたいか。それとも、まだ何か足りないか：\n\n自動生成の課題と、今回まだ確かめられていないことは [生成方法・所見・限界](METHOD.md) にまとめています。\n'
writeFileSync(resolve(dir,'COMPARISON.md'), document)
writeFileSync(resolve(dir,'RAW-COMPARISON.md'), rawDocument)
console.log(JSON.stringify({days:edited.length,rawReadings:raw.length,bodyLengths:edited.map(e=>({date:e.date,characters:e.body.replace(/\s/g,'').length})),inputTokens:raw.reduce((n,r)=>n+r.usage.input_tokens,0),outputTokens:raw.reduce((n,r)=>n+r.usage.output_tokens,0)},null,2))
