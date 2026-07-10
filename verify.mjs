import { Body, GeoVector, Ecliptic, SiderealTime, SearchRiseSet, Observer } from 'astronomy-engine'

const DEG = Math.PI / 180
const norm = (d) => ((d % 360) + 360) % 360
const SIGNS = ['牡羊座','牡牛座','双子座','蟹座','獅子座','乙女座','天秤座','蠍座','射手座','山羊座','水瓶座','魚座']
const sign = (lon) => SIGNS[Math.floor(norm(lon) / 30)]

const elon = (body, date) => norm(Ecliptic(GeoVector(body, date, true)).elon)

function ascendant(date, latDeg, lonDeg) {
  const ramc = norm(SiderealTime(date) * 15 + lonDeg) * DEG
  const eps = 23.4367 * DEG
  const phi = latDeg * DEG
  const y = -Math.cos(ramc)
  const x = Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)
  let asc = norm(Math.atan2(y, x) / DEG)
  const mc = norm(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) / DEG)
  if (norm(asc - mc) >= 180) asc = norm(asc + 180)
  return asc
}

let pass = 0, fail = 0
const check = (label, cond, detail) => {
  cond ? pass++ : fail++
  console.log(`${cond ? 'PASS' : 'FAIL'} ${label}${detail ? ' — ' + detail : ''}`)
}

// 1) 太陽星座の境界チェック
const sunCases = [
  ['1990-03-25T12:00:00+09:00', '牡羊座'],
  ['1985-05-10T12:00:00+09:00', '牡牛座'],
  ['2000-01-01T12:00:00+09:00', '山羊座'],
  ['1995-08-05T12:00:00+09:00', '獅子座'],
  ['1988-11-30T12:00:00+09:00', '射手座'],
  ['1992-02-25T12:00:00+09:00', '魚座'],
]
for (const [iso, expect] of sunCases) {
  const got = sign(elon(Body.Sun, new Date(iso)))
  check(`太陽 ${iso.slice(0, 10)} → ${got}`, got === expect, `期待: ${expect}`)
}

// 2) アセンダント: 日の出の瞬間、ASC ≒ 太陽黄経のはず
const tokyo = new Observer(35.69, 139.69, 40)
for (const day of ['2024-01-01', '2024-04-15', '2024-07-20', '2024-10-31']) {
  const rise = SearchRiseSet(Body.Sun, tokyo, +1, new Date(`${day}T00:00:00+09:00`), 1)
  const sunLon = elon(Body.Sun, rise.date)
  const asc = ascendant(rise.date, 35.69, 139.69)
  let diff = Math.abs(norm(asc - sunLon))
  if (diff > 180) diff = 360 - diff
  check(`日の出ASC ${day}`, diff < 2.0, `太陽 ${sunLon.toFixed(2)}° / ASC ${asc.toFixed(2)}° (差 ${diff.toFixed(2)}°)`)
}

// 3) ASCは24時間で一周する(2時間ごとに単調増加)
let prev = ascendant(new Date('2024-06-01T00:00:00+09:00'), 35.69, 139.69)
let monotonic = true
for (let h = 2; h <= 24; h += 2) {
  const cur = ascendant(new Date(`2024-06-01T00:00:00+09:00`).getTime() + h * 3600e3 ? new Date(new Date('2024-06-01T00:00:00+09:00').getTime() + h * 3600e3) : null, 35.69, 139.69)
  if (norm(cur - prev) <= 0 || norm(cur - prev) > 120) monotonic = false
  prev = cur
}
check('ASCが黄道順に進行(24h)', monotonic)

// 4) 月の黄経が1日で約12-14度進む
const m1 = elon(Body.Moon, new Date('2024-06-01T00:00:00Z'))
const m2 = elon(Body.Moon, new Date('2024-06-02T00:00:00Z'))
const md = norm(m2 - m1)
check('月の日運行 11-16°', md > 11 && md < 16, `${md.toFixed(2)}°`)

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
