export type PlanetKey =
  | 'sun'
  | 'moon'
  | 'asc'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto'

/** 占う対象の期間 */
export type PeriodKey = 'today' | 'tomorrow' | 'week' | 'month'

export interface PlanetPos {
  key: PlanetKey
  lon: number
  /** 逆行中か(太陽・月・上昇星座は常にfalse) */
  retro?: boolean
}

export interface ChartData {
  name: string
  dateLabel: string
  placeLabel?: string
  planets: PlanetPos[]
  period: PeriodKey
}
