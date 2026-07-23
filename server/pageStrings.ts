/**
 * 紹介LP / キャラ別ページ専用の新規文言(7言語)。
 * 説明・4エレメント・FAQ・16キャラ名などの本文は ui()/allStarTypes() を流用するので、
 * ここにはページ固有の追加文言(CTA・使い方・注記・キャラpage見出し)だけを持つ。
 */
import type { Lang } from '../src/lib/i18n'
import type { Element } from '../src/lib/signs'

export interface Step {
  t: string
  d: string
}
export interface PageStrings {
  cta: string
  heroNote: string
  howTo: string
  steps: [Step, Step, Step]
  charTitle: (name: string) => string
  otherTitle: string
  backToTop: string
}

export const PAGE_STRINGS: Record<Lang, PageStrings> = {
  ja: {
    cta: 'ほしキャラ診断を開始する！',
    heroNote: '登録不要・生年月日だけ・30秒',
    howTo: '使い方',
    steps: [
      { t: '生年月日を入力', d: 'ニックネームと生年月日だけ。生まれた時刻・場所は任意（入れるとより詳しく）。' },
      { t: 'あなたのほしキャラが判明', d: '16キャラのどれか＋あなたを構成する10天体のキャラたちを表示。' },
      { t: '毎日の運勢＆相談', d: '今日〜来月の運勢、そしてあなたのほしキャラ本人にチャットで相談できます。' },
    ],
    charTitle: (n) => `「${n}」ってどんな人？`,
    otherTitle: 'ほかのほしキャラ',
    backToTop: '← ほしキャラ診断トップへ',
  },
  en: {
    cta: 'Start your Hoshi-Kyara diagnosis!',
    heroNote: 'No signup · Just your birth date · 30 seconds',
    howTo: 'How it works',
    steps: [
      { t: 'Enter your birth date', d: 'Just a nickname and birth date. Birth time and place are optional (they add more detail).' },
      { t: 'Your Hoshi-Kyara is revealed', d: 'See which of the 16 you are, plus the 10 planet characters that make you up.' },
      { t: 'Daily fortune & chat', d: 'Fortunes from today to next month, and chat with your Hoshi-Kyara itself.' },
    ],
    charTitle: (n) => `What is “${n}” like?`,
    otherTitle: 'Other Hoshi-Kyara',
    backToTop: '← Back to Hoshi-Kyara home',
  },
  es: {
    cta: '¡Empieza tu diagnóstico Hoshi-Kyara!',
    heroNote: 'Sin registro · Solo tu fecha de nacimiento · 30 segundos',
    howTo: 'Cómo funciona',
    steps: [
      { t: 'Introduce tu fecha de nacimiento', d: 'Solo un apodo y la fecha. La hora y el lugar son opcionales (dan más detalle).' },
      { t: 'Se revela tu Hoshi-Kyara', d: 'Descubre cuál de los 16 eres, y los 10 personajes planetarios que te forman.' },
      { t: 'Fortuna diaria y consulta', d: 'Pronósticos de hoy al próximo mes, y chatea con tu propio Hoshi-Kyara.' },
    ],
    charTitle: (n) => `¿Cómo es «${n}»?`,
    otherTitle: 'Otros Hoshi-Kyara',
    backToTop: '← Volver al inicio de Hoshi-Kyara',
  },
  fr: {
    cta: 'Commencer le diagnostic Hoshi-Kyara !',
    heroNote: 'Sans inscription · Juste ta date de naissance · 30 secondes',
    howTo: 'Comment ça marche',
    steps: [
      { t: 'Saisis ta date de naissance', d: 'Juste un pseudo et la date. L’heure et le lieu sont facultatifs (plus de détails).' },
      { t: 'Ton Hoshi-Kyara se révèle', d: 'Découvre lequel des 16 tu es, et les 10 personnages planétaires qui te composent.' },
      { t: 'Horoscope quotidien & échange', d: 'Prévisions d’aujourd’hui au mois prochain, et discute avec ton Hoshi-Kyara.' },
    ],
    charTitle: (n) => `Qui est « ${n} » ?`,
    otherTitle: 'Autres Hoshi-Kyara',
    backToTop: '← Retour à l’accueil Hoshi-Kyara',
  },
  it: {
    cta: 'Inizia la tua diagnosi Hoshi-Kyara!',
    heroNote: 'Senza registrazione · Solo la data di nascita · 30 secondi',
    howTo: 'Come funziona',
    steps: [
      { t: 'Inserisci la data di nascita', d: 'Solo un nickname e la data. Ora e luogo sono facoltativi (più dettagli).' },
      { t: 'Si rivela il tuo Hoshi-Kyara', d: 'Scopri quale dei 16 sei, e i 10 personaggi planetari che ti compongono.' },
      { t: 'Oroscopo quotidiano & chat', d: 'Previsioni da oggi al mese prossimo, e chatta con il tuo Hoshi-Kyara.' },
    ],
    charTitle: (n) => `Com’è «${n}»?`,
    otherTitle: 'Altri Hoshi-Kyara',
    backToTop: '← Torna alla home di Hoshi-Kyara',
  },
  pt: {
    cta: 'Começar o diagnóstico Hoshi-Kyara!',
    heroNote: 'Sem cadastro · Só a data de nascimento · 30 segundos',
    howTo: 'Como funciona',
    steps: [
      { t: 'Digite sua data de nascimento', d: 'Só um apelido e a data. Hora e local são opcionais (mais detalhes).' },
      { t: 'Seu Hoshi-Kyara é revelado', d: 'Veja qual dos 16 você é, e os 10 personagens planetários que te formam.' },
      { t: 'Previsão diária & conversa', d: 'Previsões de hoje ao próximo mês, e converse com o seu Hoshi-Kyara.' },
    ],
    charTitle: (n) => `Como é «${n}»?`,
    otherTitle: 'Outros Hoshi-Kyara',
    backToTop: '← Voltar ao início de Hoshi-Kyara',
  },
  ko: {
    cta: '호시캐릭터 진단 시작하기!',
    heroNote: '가입 불필요 · 생년월일만 · 30초',
    howTo: '사용 방법',
    steps: [
      { t: '생년월일 입력', d: '닉네임과 생년월일만. 태어난 시각·장소는 선택(넣으면 더 자세히).' },
      { t: '당신의 호시캐릭터 판명', d: '16캐릭터 중 누구인지 + 당신을 이루는 10천체 캐릭터를 표시.' },
      { t: '매일의 운세 & 상담', d: '오늘~다음 달 운세, 그리고 당신의 호시캐릭터와 채팅으로 상담할 수 있어요.' },
    ],
    charTitle: (n) => `「${n}」은 어떤 사람?`,
    otherTitle: '다른 호시캐릭터',
    backToTop: '← 호시캐릭터 진단 홈으로',
  },
}

/** エレメントのマーク(白アイコン)。About の ElementIcon を移植。viewBox 0 0 24 24。 */
export const ELEMENT_ICON: Record<Element, string> = {
  火: '<path d="M12 3 C15 8 17 10.5 17 15 A5 5 0 0 1 7 15 C7 12 9 10 10.5 7.5 C11.3 11 12.5 11 13.5 10.5 C12 7.5 11.5 5.5 12 3 Z" fill="#fff"/>',
  地: '<path d="M2.5 19 L9 7.5 L13 13.5 L16 9 L21.5 19 Z" fill="#fff"/>',
  風: '<g fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round"><path d="M3 9 h10 a3 3 0 1 0 -3 -3"/><path d="M4 14.5 h12 a3 3 0 1 1 -3 3"/></g>',
  水: '<path d="M12 3 C16 9 18 12 18 15.5 A6 6 0 0 1 6 15.5 C6 12 8 9 12 3 Z" fill="#fff"/>',
}

/** エレメントの下地色 */
export const ELEMENT_COLOR: Record<Element, string> = {
  火: '#FF8A4B',
  地: '#6FB05A',
  風: '#4FB6C9',
  水: '#6FA0D8',
}
