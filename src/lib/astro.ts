import { Body, GeoVector, Ecliptic, SiderealTime } from 'astronomy-engine'

const DEG = Math.PI / 180

export const norm = (d: number) => ((d % 360) + 360) % 360
export const signIndex = (lon: number) => Math.floor(norm(lon) / 30)
export const degInSign = (lon: number) => norm(lon) % 30

/** JSTの日付・時刻文字列からDateを生成 */
export function jstDate(dateStr: string, timeStr = '12:00'): Date {
  return new Date(`${dateStr}T${timeStr}:00+09:00`)
}

/** 地心黄経(度) — トロピカル方式 */
export function eclipticLongitude(body: Body, date: Date): number {
  const vec = GeoVector(body, date, true)
  return norm(Ecliptic(vec).elon)
}

export const sunLongitude = (date: Date) => eclipticLongitude(Body.Sun, date)
export const moonLongitude = (date: Date) => eclipticLongitude(Body.Moon, date)

/** 黄経差を -180〜+180 に正規化 */
const signedDiff = (a: number, b: number) => ((a - b + 540) % 360) - 180

/** 逆行判定 — 翌日の黄経が手前に戻っていれば逆行中 */
export function isRetrograde(body: Body, date: Date): boolean {
  const next = new Date(date.getTime() + 86400_000)
  return signedDiff(eclipticLongitude(body, next), eclipticLongitude(body, date)) < 0
}

/**
 * アセンダント(上昇点)の黄経を計算
 * @param date 出生日時
 * @param latDeg 緯度(度・北緯+)
 * @param lonDeg 経度(度・東経+)
 */
export function ascendant(date: Date, latDeg: number, lonDeg: number): number {
  const gastHours = SiderealTime(date)
  const ramc = norm(gastHours * 15 + lonDeg) * DEG
  const eps = 23.4367 * DEG
  const phi = latDeg * DEG
  const y = -Math.cos(ramc)
  const x = Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)
  let asc = norm(Math.atan2(y, x) / DEG)
  // 上昇点は必ずMCから黄道順で180度以内(東の地平線)にある
  const mc = norm(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) / DEG)
  if (norm(asc - mc) >= 180) asc = norm(asc + 180)
  return asc
}
