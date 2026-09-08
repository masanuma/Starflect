import type { ChartData } from './types'
import type { Lang } from './i18n'
import { readFortune } from './fortune'
import { todayKey, loadCompanion, saveCompanion } from './companion'

/** Calendar week in the reader's local timezone; noon avoids DST midnight edges. */
export function calendarWeek(now = new Date()) {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() + 6) % 7, 12)
  const dates = Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i, 12))
  return { start: todayKey(dates[0]), end: todayKey(dates[6]), dates }
}

export function weeklyMaterials(chart: ChartData, now = new Date()) {
  const week = calendarWeek(now)
  return { start: week.start, end: week.end, days: week.dates.map(date => {
    const fortune = readFortune(chart.planets, 'today', date)
    return { label: todayKey(date), sky: fortune.skyNote, tone: fortune.toneLabel, items: fortune.items.map(i => i.title) }
  }) }
}

const chartKey = (chart: ChartData) => JSON.stringify([chart.name, chart.dateLabel, chart.placeLabel, chart.planets])

export function loadWeekly(chart: ChartData, start: string, lang: Lang): string | undefined {
  const saved = loadCompanion()
  const value = saved?.weekly?.[lang]
  return saved && chartKey(saved.chart) === chartKey(chart) && value?.weekStart === start &&
    value.chartKey === chartKey(chart) && typeof value.text === 'string' && value.text.trim() ? value.text : undefined
}

export function saveWeekly(chart: ChartData, start: string, lang: Lang, text: string) {
  const saved = loadCompanion()
  if (!saved || chartKey(saved.chart) !== chartKey(chart) || loadWeekly(chart, start, lang)) return
  saveCompanion({ ...saved, weekly: { ...saved.weekly, [lang]: {weekStart: start, chartKey: chartKey(chart), text} } })
}

export function parseWeekly(text: string): string {
  const value = JSON.parse(text.replace(/^\s*```(?:json)?\s*/, '').replace(/\s*```\s*$/, ''))
  if (value?.version !== 1 || typeof value.text !== 'string' || !value.text.trim() || value.text.length > 2000) throw new Error('Invalid weekly reading')
  return value.text.trim()
}

interface WeeklyLabels { title: string; loading: string; error: string; retry: string; more: string; question: string }
export const weeklyLabels: Record<Lang, WeeklyLabels> = {
  ja: {title:'今週、楽しみにしていいこと', loading:'今週の星を読んでいます…', error:'今週の見通しを読み込めませんでした。', retry:'もう一度読む', more:'この話をもう少し', question:'今週の楽しみについて、もう少し詳しく教えてください。'},
  en: {title:'Something to look forward to this week', loading:'Reading this week’s stars…', error:'This week’s reading could not be loaded.', retry:'Try again', more:'Tell me more', question:'Tell me more about what I can look forward to this week.'},
  es: {title:'Algo que esperar con ilusión esta semana', loading:'Leyendo las estrellas de esta semana…', error:'No se pudo cargar la lectura semanal.', retry:'Reintentar', more:'Cuéntame más', question:'Cuéntame más sobre lo que puedo esperar con ilusión esta semana.'},
  fr: {title:'Un plaisir à attendre cette semaine', loading:'Lecture des étoiles de la semaine…', error:'La lecture de la semaine est indisponible.', retry:'Réessayer', more:'En savoir un peu plus', question:'Dites-m’en plus sur ce que je peux attendre avec plaisir cette semaine.'},
  it: {title:'Qualcosa di bello da aspettare questa settimana', loading:'Leggo le stelle della settimana…', error:'La lettura settimanale non è disponibile.', retry:'Riprova', more:'Dimmi di più', question:'Dimmi di più su cosa posso aspettare con piacere questa settimana.'},
  pt: {title:'Algo por que ansiar esta semana', loading:'A ler as estrelas desta semana…', error:'Não foi possível carregar a leitura semanal.', retry:'Tentar novamente', more:'Conte-me mais', question:'Conte-me mais sobre o que posso esperar com alegria esta semana.'},
  ko: {title:'이번 주 기대해도 좋은 것', loading:'이번 주 별을 읽고 있어요…', error:'이번 주 운세를 불러오지 못했어요.', retry:'다시 읽기', more:'조금 더 알고 싶어요', question:'이번 주 기대할 만한 것에 대해 조금 더 자세히 알려 주세요.'},
}
