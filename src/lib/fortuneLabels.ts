import type { Lang } from './i18n'

interface Labels {
  good: string; steady: string; careful: string; sky: string; night: string
  goodHint: string; steadyHint: string; carefulHint: string; caution: string; continue: string
}
export const fortuneLabels: Record<Lang, Labels> = {
  ja: { good: 'いい日', steady: '穏やかな日', careful: '少し注意の日', sky: '今日の星もよう', night: '今夜の星もよう',
    goodHint: '追い風を楽しんで', steadyHint: 'いつもの中に、小さな楽しみ', carefulHint: '急がず、心地よいほうへ', caution: 'ひとつ気をつけるなら', continue: '気になったら、この話の続きへ' },
  en: { good: 'A bright day', steady: 'A steady day', careful: 'A day for care', sky: 'Today’s stars', night: 'Tonight’s stars',
    goodHint: 'Enjoy the tailwind', steadyHint: 'Small joys in the familiar', carefulHint: 'Take things gently', caution: 'One thing to keep in mind', continue: 'Keep the conversation going' },
  es: { good: 'Un buen día', steady: 'Un día tranquilo', careful: 'Un día para ir con cuidado', sky: 'Las estrellas de hoy', night: 'Las estrellas de esta noche',
    goodHint: 'Disfruta del viento a favor', steadyHint: 'Pequeñas alegrías cotidianas', carefulHint: 'Ve con calma', caution: 'Algo que tener en cuenta', continue: 'Sigamos con esta conversación' },
  fr: { good: 'Une belle journée', steady: 'Une journée paisible', careful: 'Une journée de prudence', sky: 'Les étoiles du jour', night: 'Les étoiles de ce soir',
    goodHint: 'Profitez du vent favorable', steadyHint: 'Les petits plaisirs du quotidien', carefulHint: 'Allez-y doucement', caution: 'Un point à garder en tête', continue: 'Poursuivons cette conversation' },
  it: { good: 'Una bella giornata', steady: 'Una giornata tranquilla', careful: 'Una giornata di cautela', sky: 'Le stelle di oggi', night: 'Le stelle di stasera',
    goodHint: 'Goditi il vento a favore', steadyHint: 'Piccole gioie quotidiane', carefulHint: 'Procedi con calma', caution: 'Una cosa da tenere a mente', continue: 'Continuiamo a parlarne' },
  pt: { good: 'Um bom dia', steady: 'Um dia tranquilo', careful: 'Um dia de cautela', sky: 'As estrelas de hoje', night: 'As estrelas desta noite',
    goodHint: 'Aproveite o vento favorável', steadyHint: 'Pequenas alegrias do quotidiano', carefulHint: 'Avance com calma', caution: 'Algo a ter em conta', continue: 'Vamos continuar a conversa' },
  ko: { good: '좋은 날', steady: '평온한 날', careful: '조금 조심할 날', sky: '오늘의 별 흐름', night: '오늘 밤의 별 흐름',
    goodHint: '순풍을 즐겨 보세요', steadyHint: '익숙한 일상 속 작은 즐거움', carefulHint: '서두르지 말고 편안하게', caution: '한 가지 기억할 점', continue: '궁금하다면 이야기를 이어 가요' },
}
