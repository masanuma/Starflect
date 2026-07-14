import { elementOf, elementLabel } from './signs'
import type { Element } from './signs'
import { getLang } from './i18n'
import type { Lang } from './i18n'

export interface StarType {
  name: string
  emoji: string
  /** 一言キャッチ */
  copy: string
  /** 2〜3文の説明 */
  text: string
}

/** エレメントの日常語ラベル(言語別) */
const ELEMENT_WORD_L: Record<Lang, Record<Element, string>> = {
  ja: { 火: '情熱', 地: '現実', 風: '知性', 水: '感情' },
  en: { 火: 'passion', 地: 'grounding', 風: 'intellect', 水: 'emotion' },
  es: { 火: 'pasión', 地: 'realismo', 風: 'intelecto', 水: 'emoción' },
}

export const elementWord = (el: Element): string => ELEMENT_WORD_L[getLang()][el] ?? ELEMENT_WORD_L.ja[el]

/** 「火の情熱」/「Fire · passion」形式のエレメント表現(現在言語) */
export const elementPhrase = (el: Element): string => {
  const lang = getLang()
  return lang === 'ja' ? `${elementLabel(el)}の${elementWord(el)}` : `${elementLabel(el)} · ${elementWord(el)}`
}

type TypeTable = Record<Element, Record<Element, StarType>>

/** 16の星タイプ。第1キー=太陽のエレメント(表の顔)、第2キー=月のエレメント(心の中) */
const STAR_TYPES: Record<Lang, TypeTable> = {
  ja: {
    火: {
      火: { name: '疾走する彗星', emoji: '☄️', copy: '迷いなく燃える、生粋の情熱ドリブン', text: '見た目も中身も全力全開。思い立った瞬間がスタートの合図で、その勢いが周りを巻き込みます。エネルギーの出どころも使い道も「好き」と「ワクワク」でできています。' },
      地: { name: '大地に立つ炎', emoji: '🔥⛰️', copy: '派手に見えて、実は地に足がついている', text: '外では情熱的に攻めるのに、心の中は驚くほど現実的。勢いだけでは飛ばず、ちゃんと着地点を計算しています。「熱いのに堅実」という最強の配合です。' },
      風: { name: '舞い上がる花火', emoji: '🎆', copy: '情熱的で、心はどこまでも軽やか', text: '外では熱く突き進み、内側では常に新しい風を求めています。ひとつの場所に留まらない好奇心が燃料。場をパッと明るくする天性の華があります。' },
      水: { name: '内に海を抱く炎', emoji: '🔥🌊', copy: '情熱の人に見えて、心はとても繊細', text: '外では堂々と燃えているのに、心の中は感受性の海。人の気持ちに深く共鳴するからこそ、その情熱には温度があります。強さと優しさの二刀流です。' },
    },
    地: {
      火: { name: '静かな火山', emoji: '🌋', copy: '落ち着いて見えて、内側はマグマ', text: '普段は穏やかで堅実。でも心の中には熱い野心と情熱が煮えています。ここぞという時の爆発力は、普段とのギャップで周囲を驚かせます。' },
      地: { name: '揺るがない山', emoji: '⛰️', copy: '表も裏も、どっしり安定の本格派', text: '見た目どおりの安定感。積み上げたものは崩れず、信頼はどこまでも厚い。時間をかけて、確実に頂上へたどり着く人です。' },
      風: { name: '風を聴く大樹', emoji: '🌳', copy: 'どっしり見えて、心は自由に飛んでいる', text: '外では安定と信頼の人。でも心の中は好奇心と自由な発想でいっぱいです。根を張ったまま枝葉は風と遊ぶ——現実感と柔軟さの両立が持ち味。' },
      水: { name: '泉を隠す森', emoji: '🌲💧', copy: '現実的に見えて、心は深くやさしい', text: '外では冷静で頼れる存在。その奥に、豊かな感受性と共感力を隠しています。静かな見た目の中にある深い泉が、大切な人を癒やします。' },
    },
    風: {
      火: { name: '熱を運ぶ風', emoji: '🌬️🔥', copy: '軽やかに見えて、心は火の玉', text: '社交的でスマートな見た目の内側に、負けず嫌いの情熱が燃えています。言葉とアイデアに熱をのせて、人を動かすタイプです。' },
      地: { name: '羅針盤を持つ旅人', emoji: '🧭', copy: '自由に見えて、ちゃんと着地する', text: 'フットワーク軽くどこへでも行けるのに、心の中には確かな現実感覚。自由と堅実のバランサーで、「遊んでいるのに結果を出す人」と言われます。' },
      風: { name: '自由な渡り鳥', emoji: '🕊️', copy: '生粋の自由人、心まで風通し良好', text: '表も裏も軽やか。知識と会話を栄養に、境界線なく飛び回ります。しがらみに縛られない生き方そのものが魅力です。' },
      水: { name: '月夜のそよ風', emoji: '🌙', copy: '社交的に見えて、心は情緒の人', text: '誰とでも軽やかに話せるのに、心の中は繊細な詩人。人の感情の機微をすくい取る力があり、その言葉には不思議と温度が宿ります。' },
    },
    水: {
      火: { name: '海底の火山', emoji: '🌊🌋', copy: '穏やかに見えて、芯は誰より熱い', text: '物腰柔らかく共感的。でも心の奥には激しい情熱と決意が眠っています。静かな海の底で燃え続ける炎は、簡単には消えません。' },
      地: { name: '静かな入り江', emoji: '⚓', copy: 'やさしくて、実はしっかり者', text: '包み込むような優しさの内側に、地に足のついた現実感覚。感情に流されず、大切な人の「安全な港」になれる人です。' },
      風: { name: '風をうつす水面', emoji: '🪞', copy: '感受性豊かで、頭の回転も速い', text: '人の気持ちに寄り添いながら、心の中では自由に思考が泳いでいます。共感と客観を行き来できる、しなやかな知性の持ち主。' },
      水: { name: '深海の月', emoji: '🌊🌕', copy: '感じる力の申し子、生粋の共感者', text: '表も裏も感受性のかたまり。言葉にならないものを感じ取り、そっと寄り添える稀有な人。その深さは、海の底に映る月のようです。' },
    },
  },
  en: {
    火: {
      火: { name: 'Racing Comet', emoji: '☄️', copy: 'Burns without hesitation—a true passion-driven soul', text: 'Full throttle inside and out. The moment you decide is the starting gun, and your momentum sweeps others along. Where your energy comes from and where it goes are both what you love and what excites you.' },
      地: { name: 'Flame on Solid Ground', emoji: '🔥⛰️', copy: 'Looks flashy, but is truly grounded', text: 'You attack passionately on the outside, yet inside you are remarkably practical. You never leap on momentum alone—you calculate the landing. "Fiery yet reliable" is your unbeatable blend.' },
      風: { name: 'Soaring Fireworks', emoji: '🎆', copy: 'Passionate, with a heart that stays ever light', text: 'You push forward with heat while always chasing a fresh breeze inside. Curiosity that never stays put is your fuel, and you have a natural gift for lighting up any room.' },
      水: { name: 'Flame that Holds a Sea', emoji: '🔥🌊', copy: 'Looks fiery, but the heart is very tender', text: 'You blaze proudly on the outside, yet within lies a sea of sensitivity. Because you resonate so deeply with others, your passion always carries warmth—strength and gentleness in one.' },
    },
    地: {
      火: { name: 'Quiet Volcano', emoji: '🌋', copy: 'Calm on the outside, magma within', text: 'Usually calm and steady, yet ambition and passion simmer inside. When it truly counts, your explosive drive surprises everyone precisely because of the contrast.' },
      地: { name: 'Unshakable Mountain', emoji: '⛰️', copy: 'Steady through and through—the real deal', text: 'As dependable as you look. What you build does not crumble, and trust in you runs deep. Taking your time, you reach the summit for sure.' },
      風: { name: 'Great Tree that Hears the Wind', emoji: '🌳', copy: 'Looks grounded, but the mind flies free', text: 'On the outside, steady and trustworthy—yet inside you brim with curiosity and free ideas. Rooted firmly while your branches play with the wind: realism and flexibility in balance.' },
      水: { name: 'Forest Hiding a Spring', emoji: '🌲💧', copy: 'Looks practical, but is deeply kind at heart', text: 'Calm and reliable on the surface, hiding rich sensitivity and empathy beneath. The deep spring within that quiet exterior is what heals the people you love.' },
    },
    風: {
      火: { name: 'Wind that Carries Heat', emoji: '🌬️🔥', copy: 'Looks breezy, but the heart is a fireball', text: 'Behind a sociable, sharp exterior burns a competitive passion. You move people by putting heat into your words and ideas.' },
      地: { name: 'Traveler with a Compass', emoji: '🧭', copy: 'Looks free, yet always lands on their feet', text: 'You can go anywhere with light footwork, yet a solid sense of reality lives inside. A balancer of freedom and grounding—people say you get results while looking like you are just playing.' },
      風: { name: 'Free Migrating Bird', emoji: '🕊️', copy: 'A free spirit, airy all the way to the heart', text: 'Light on the outside and the inside. Fed by knowledge and conversation, you fly across every boundary. The very way you live—unbound by ties—is your charm.' },
      水: { name: 'Breeze on a Moonlit Night', emoji: '🌙', copy: 'Looks sociable, but is emotional at heart', text: 'You chat easily with anyone, yet a delicate poet lives within. You catch the subtlest shifts in feeling, and your words carry a mysterious warmth.' },
    },
    水: {
      火: { name: 'Undersea Volcano', emoji: '🌊🌋', copy: 'Looks calm, but the core burns hottest', text: 'Soft-spoken and empathetic, yet fierce passion and resolve sleep deep within. The flame burning at the bottom of a quiet sea does not go out easily.' },
      地: { name: 'Quiet Cove', emoji: '⚓', copy: 'Gentle, and surprisingly dependable', text: 'Within your enveloping kindness lives a grounded sense of reality. Not swept away by emotion, you can be a "safe harbor" for the people you love.' },
      風: { name: 'Water that Mirrors the Wind', emoji: '🪞', copy: 'Richly sensitive, and quick-witted too', text: 'While staying close to others’ feelings, your thoughts swim freely inside. You move between empathy and objectivity—a supple, flexible intelligence.' },
      水: { name: 'Moon of the Deep Sea', emoji: '🌊🌕', copy: 'A child of empathy—a true kindred heart', text: 'Sensitivity through and through. A rare soul who senses the unspoken and quietly draws near. That depth is like the moon reflected at the bottom of the sea.' },
    },
  },
  es: {
    火: {
      火: { name: 'Cometa Veloz', emoji: '☄️', copy: 'Arde sin dudar: un alma movida por la pasión', text: 'A todo gas por dentro y por fuera. El instante en que decides es la señal de salida, y tu impulso arrastra a los demás. El origen y el destino de tu energía son lo que amas y lo que te emociona.' },
      地: { name: 'Llama sobre Tierra Firme', emoji: '🔥⛰️', copy: 'Parece llamativo, pero tiene los pies en la tierra', text: 'Por fuera avanzas con pasión, pero por dentro eres sorprendentemente realista. No saltas solo por impulso: calculas dónde aterrizar. "Ardiente pero fiable" es tu mezcla imbatible.' },
      風: { name: 'Fuegos Artificiales', emoji: '🎆', copy: 'Apasionado, con un corazón siempre ligero', text: 'Avanzas con calor mientras buscas siempre un aire nuevo por dentro. Tu combustible es una curiosidad que nunca se queda quieta, y tienes el don natural de iluminar cualquier lugar.' },
      水: { name: 'Llama que Abraza un Mar', emoji: '🔥🌊', copy: 'Parece de fuego, pero su corazón es muy sensible', text: 'Ardes con orgullo por fuera, pero dentro hay un mar de sensibilidad. Como sintonizas tan hondo con los demás, tu pasión siempre lleva calidez: fuerza y ternura a la vez.' },
    },
    地: {
      火: { name: 'Volcán Silencioso', emoji: '🌋', copy: 'Tranquilo por fuera, magma por dentro', text: 'Sueles ser calmado y firme, pero dentro hierven la ambición y la pasión. Cuando de verdad importa, tu fuerza explosiva sorprende a todos justo por el contraste.' },
      地: { name: 'Montaña Inquebrantable', emoji: '⛰️', copy: 'Sólido por dentro y por fuera: auténtico', text: 'Tan fiable como aparentas. Lo que construyes no se derrumba y la confianza en ti es profunda. Con tu tiempo, llegas seguro a la cima.' },
      風: { name: 'Gran Árbol que Escucha el Viento', emoji: '🌳', copy: 'Parece firme, pero su mente vuela libre', text: 'Por fuera, firme y de fiar; por dentro, lleno de curiosidad e ideas libres. Con raíces firmes mientras tus ramas juegan con el viento: realismo y flexibilidad en equilibrio.' },
      水: { name: 'Bosque que Oculta un Manantial', emoji: '🌲💧', copy: 'Parece práctico, pero es muy tierno por dentro', text: 'Sereno y de confianza en la superficie, oculta debajo una rica sensibilidad y empatía. El manantial profundo tras ese exterior tranquilo es lo que sana a quienes amas.' },
    },
    風: {
      火: { name: 'Viento que Lleva Calor', emoji: '🌬️🔥', copy: 'Parece ligero, pero su corazón es una bola de fuego', text: 'Tras un exterior sociable y agudo arde una pasión competitiva. Mueves a la gente poniendo calor en tus palabras e ideas.' },
      地: { name: 'Viajero con Brújula', emoji: '🧭', copy: 'Parece libre, pero siempre aterriza bien', text: 'Puedes ir a cualquier parte con paso ligero, pero dentro vive un sólido sentido de la realidad. Equilibras libertad y firmeza: dicen que logras resultados aunque parezca que solo juegas.' },
      風: { name: 'Ave Migratoria Libre', emoji: '🕊️', copy: 'Un espíritu libre, ligero hasta el corazón', text: 'Ligero por fuera y por dentro. Nutrido por el conocimiento y la conversación, vuelas sin fronteras. Tu forma misma de vivir, sin ataduras, es tu encanto.' },
      水: { name: 'Brisa de Noche de Luna', emoji: '🌙', copy: 'Parece sociable, pero es sentimental por dentro', text: 'Charlas con facilidad con cualquiera, pero dentro vive un poeta delicado. Captas los matices más sutiles del sentir, y tus palabras llevan una calidez misteriosa.' },
    },
    水: {
      火: { name: 'Volcán Submarino', emoji: '🌊🌋', copy: 'Parece calmado, pero su núcleo arde más que nadie', text: 'De trato suave y empático, pero en lo hondo duermen una pasión y una determinación intensas. La llama que arde en el fondo de un mar tranquilo no se apaga fácilmente.' },
      地: { name: 'Ensenada Tranquila', emoji: '⚓', copy: 'Amable y, en el fondo, muy confiable', text: 'Dentro de tu ternura envolvente vive un sentido realista y firme. Sin dejarte llevar por la emoción, sabes ser un "puerto seguro" para quienes amas.' },
      風: { name: 'Agua que Refleja el Viento', emoji: '🪞', copy: 'Muy sensible y de mente ágil', text: 'Mientras acompañas los sentimientos de los demás, tus pensamientos nadan libres por dentro. Vas y vienes entre la empatía y la objetividad: una inteligencia flexible y ágil.' },
      水: { name: 'Luna del Mar Profundo', emoji: '🌊🌕', copy: 'Hijo de la empatía: un alma que siente contigo', text: 'Sensibilidad de principio a fin. Un alma rara que percibe lo no dicho y se acerca con suavidad. Esa hondura es como la luna reflejada en el fondo del mar.' },
    },
  },
}

export interface StarTypeResult {
  type: StarType
  sunElement: Element
  moonElement: Element
}

/** エレメントの並び順(火→地→風→水) */
export const ELEMENT_ORDER: Element[] = ['火', '地', '風', '水']

/** 太陽と月の黄経から星タイプを判定(現在言語で) */
export function starTypeOf(sunLon: number, moonLon: number): StarTypeResult {
  const sunElement = elementOf(sunLon)
  const moonElement = elementOf(moonLon)
  const table = STAR_TYPES[getLang()] ?? STAR_TYPES.ja
  return { type: table[sunElement][moonElement], sunElement, moonElement }
}

/** 全16タイプを表示順(太陽エレメント × 月エレメント)で返す(現在言語で) */
export function allStarTypes(): StarTypeResult[] {
  const table = STAR_TYPES[getLang()] ?? STAR_TYPES.ja
  const out: StarTypeResult[] = []
  for (const sunElement of ELEMENT_ORDER) {
    for (const moonElement of ELEMENT_ORDER) {
      out.push({ type: table[sunElement][moonElement], sunElement, moonElement })
    }
  }
  return out
}
