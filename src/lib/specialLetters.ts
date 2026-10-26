import { Body } from 'astronomy-engine'
import { eclipticLongitude } from './astro'
import type { ChartData, PlanetPos } from './types'
import type { Lang } from './i18n'
import { loadCompanion, saveCompanion, todayKey } from './companion'

export interface StarMoment {
  id: string; date: string; from: string; until: string
  transit: 'venus' | 'jupiter'; natal: string; angle: number; offset: number
}
export interface SpecialLetter { moment: StarMoment; texts: Partial<Record<Lang,string>> }
const dateAt = (year:number, month:number, day:number) => new Date(year,month,day,12)
const separation = (a:number,b:number) => Math.abs(((a-b+540)%360)-180)

/** One selected close, supportive personal transit per calendar month, if any.
 * Daily noon samples find a local minimum, not an exact time prediction.
 * Month-wide selection stays identical across revisits; no random rewards.
 */
export function monthlyMoment(natal: PlanetPos[], year:number, month:number): StarMoment | undefined {
  const candidates: StarMoment[] = []
  const last = dateAt(year,month+1,0).getDate()
  for (const transit of ['venus','jupiter'] as const) {
    const body = transit === 'venus' ? Body.Venus : Body.Jupiter
    const lons = Array.from({length:last+2},(_,d)=>eclipticLongitude(body,dateAt(year,month,d)))
    for (const n of natal.filter(p=>['sun','moon','venus'].includes(p.key))) {
      for (const angle of [60,120]) {
        const offsets = lons.map(lon=>Math.abs(separation(lon,n.lon)-angle))
        for (let d=1;d<=last;d++) {
          if(offsets[d]>0.6 || offsets[d]>=offsets[d-1] || offsets[d]>offsets[d+1]) continue
          const date = todayKey(dateAt(year,month,d))
          candidates.push({id:`${date}:${transit}:${n.key}:${angle}`,date,
            from:todayKey(dateAt(year,month,d-3)),until:todayKey(dateAt(year,month,d+3)),
            transit,natal:n.key,angle,offset:offsets[d]})
        }
      }
    }
  }
  return candidates.sort((a,b)=>a.date.localeCompare(b.date)||a.offset-b.offset||a.id.localeCompare(b.id))[0]
}
export function arrivingMoments(chart:ChartData, now=new Date()): StarMoment[] {
  const key=todayKey(now)
  return [-1,0,1].map(delta=>{
    const date=dateAt(now.getFullYear(),now.getMonth()+delta,1)
    return monthlyMoment(chart.planets,date.getFullYear(),date.getMonth())
  }).filter((m):m is StarMoment=>!!m && m.from<=key && key<=m.until)
}
const same = (a:ChartData,b:ChartData) => JSON.stringify([a.name,a.dateLabel,a.placeLabel,a.planets])===JSON.stringify([b.name,b.dateLabel,b.placeLabel,b.planets])
export function loadLetters(chart:ChartData):SpecialLetter[] {
  const saved=loadCompanion()
  return saved && same(saved.chart,chart) ? saved.specialLetters ?? [] : []
}
export function deliverLetters(chart:ChartData,moments:StarMoment[]):SpecialLetter[] {
  const saved=loadCompanion()
  if(!saved || !same(saved.chart,chart)) return []
  const letters=[...(saved.specialLetters ?? [])]
  for(const moment of moments) if(!letters.some(l=>l.moment.id===moment.id)) letters.push({moment,texts:{}})
  letters.sort((a,b)=>b.moment.date.localeCompare(a.moment.date))
  if(letters.length !== (saved.specialLetters ?? []).length) saveCompanion({...saved,specialLetters:letters})
  return letters
}
export function saveLetter(chart:ChartData,id:string,lang:Lang,text:string) {
  const saved=loadCompanion()
  if(!saved || !same(saved.chart,chart)) return
  const letters=saved.specialLetters?.map(l=>l.moment.id===id && !l.texts[lang] ? {...l,texts:{...l.texts,[lang]:text}} : l)
  if(letters) saveCompanion({...saved,specialLetters:letters})
}

export const letterLabels: Record<Lang,{title:string;open:string;loading:string;error:string;retry:string;around:string;past:string;basis:string}> = {
  ja:{title:'あなたの星から、特別便',open:'お便りを開く',loading:'ほしキャラが手紙を書いています…',error:'手紙を読み込めませんでした。',retry:'もう一度開く',around:'ごろの楽しみ',past:'届いた特別便',basis:'このお便りの星の根拠'},
  en:{title:'A special letter from your stars',open:'Open your letter',loading:'Your Star Character is writing…',error:'Could not load the letter.',retry:'Try again',around:'A little joy around',past:'Delivered letters',basis:'The stars behind this letter'},
  es:{title:'Una carta especial de tus estrellas',open:'Abrir la carta',loading:'Tu Star Character está escribiendo…',error:'No se pudo cargar la carta.',retry:'Reintentar',around:'Una pequeña alegría hacia',past:'Cartas recibidas',basis:'Las estrellas detrás de esta carta'},
  fr:{title:'Une lettre spéciale de vos étoiles',open:'Ouvrir la lettre',loading:'Votre Star Character écrit…',error:'Impossible de charger la lettre.',retry:'Réessayer',around:'Un petit plaisir vers le',past:'Lettres reçues',basis:'Les étoiles derrière cette lettre'},
  it:{title:'Una lettera speciale dalle tue stelle',open:'Apri la lettera',loading:'Il tuo Star Character sta scrivendo…',error:'Impossibile caricare la lettera.',retry:'Riprova',around:'Una piccola gioia intorno al',past:'Lettere ricevute',basis:'Le stelle dietro questa lettera'},
  pt:{title:'Uma carta especial das suas estrelas',open:'Abrir a carta',loading:'O seu Star Character está a escrever…',error:'Não foi possível carregar a carta.',retry:'Tentar novamente',around:'Uma pequena alegria por volta de',past:'Cartas recebidas',basis:'As estrelas por trás desta carta'},
  ko:{title:'나의 별이 보내는 특별한 편지',open:'편지 열기',loading:'Star Character가 편지를 쓰고 있어요…',error:'편지를 불러오지 못했어요.',retry:'다시 열기',around:'무렵의 작은 즐거움',past:'도착한 편지',basis:'이 편지의 별 근거'},
}
