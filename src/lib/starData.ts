/**
 * 純データ(astro非依存)。星タイプ/エレメントの言語別テーブル。
 * client(signs/startypes)とserver(pages)の両方が参照する。astronomy-engine を読み込まないのが要点。
 */
import type { Lang } from './i18n'
import type { Element } from './signs'
export type { Element } from './signs'

export interface StarType {
  name: string
  emoji: string
  /** 一言キャッチ */
  copy: string
  /** 2〜3文の説明 */
  text: string
}

export type TypeTable = Record<Element, Record<Element, StarType>>

/** エレメントの言語別ラベル */
export const ELEMENT_LABEL: Record<Lang, Record<Element, string>> = {
  ja: { 火: '火', 地: '地', 風: '風', 水: '水' },
  en: { 火: 'Fire', 地: 'Earth', 風: 'Air', 水: 'Water' },
  es: { 火: 'Fuego', 地: 'Tierra', 風: 'Aire', 水: 'Agua' },
  fr: { 火: 'Feu', 地: 'Terre', 風: 'Air', 水: 'Eau' },
  it: { 火: 'Fuoco', 地: 'Terra', 風: 'Aria', 水: 'Acqua' },
  pt: { 火: 'Fogo', 地: 'Terra', 風: 'Ar', 水: 'Água' },
  ko: { 火: '불', 地: '흙', 風: '바람', 水: '물' },
}


/** エレメントの言語別ワード(情熱/現実/...) */
export const ELEMENT_WORD_L: Record<Lang, Record<Element, string>> = {
  ja: { 火: '情熱', 地: '現実', 風: '知性', 水: '感情' },
  en: { 火: 'passion', 地: 'grounding', 風: 'intellect', 水: 'emotion' },
  es: { 火: 'pasión', 地: 'realismo', 風: 'intelecto', 水: 'emoción' },
  fr: { 火: 'passion', 地: 'réalisme', 風: 'intellect', 水: 'émotion' },
  it: { 火: 'passione', 地: 'concretezza', 風: 'intelletto', 水: 'emozione' },
  pt: { 火: 'paixão', 地: 'realismo', 風: 'intelecto', 水: 'emoção' },
  ko: { 火: '열정', 地: '현실', 風: '지성', 水: '감정' },
}

/** 16星タイプ(言語別) */
export const STAR_TYPES: Record<Lang, TypeTable> = {
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
  fr: {
    火: {
      火: { name: 'Comète Fulgurante', emoji: '☄️', copy: 'Brûle sans hésiter : une âme animée par la passion', text: 'À fond dehors comme dedans. L’instant où tu décides est le coup de départ, et ton élan entraîne les autres. D’où vient ton énergie et où elle va, tout est fait de ce que tu aimes et de ce qui t’enthousiasme.' },
      地: { name: 'Flamme sur Terre Ferme', emoji: '🔥⛰️', copy: 'Semble éclatant, mais garde les pieds sur terre', text: 'Tu avances avec passion à l’extérieur, pourtant tu es étonnamment pragmatique à l’intérieur. Tu ne t’élances jamais sur le seul élan : tu calcules l’atterrissage. « Ardent mais fiable » est ton mélange imbattable.' },
      風: { name: 'Feu d’Artifice', emoji: '🎆', copy: 'Passionné, avec un cœur toujours léger', text: 'Tu fonces avec chaleur tout en cherchant sans cesse un vent nouveau au-dedans. Ton carburant, c’est une curiosité qui ne tient pas en place, et tu as le don d’illuminer n’importe quelle pièce.' },
      水: { name: 'Flamme qui Abrite une Mer', emoji: '🔥🌊', copy: 'Semble ardent, mais son cœur est très tendre', text: 'Tu brûles fièrement à l’extérieur, mais au-dedans s’étend une mer de sensibilité. Comme tu vibres si profondément avec les autres, ta passion porte toujours de la chaleur : force et douceur à la fois.' },
    },
    地: {
      火: { name: 'Volcan Silencieux', emoji: '🌋', copy: 'Calme au-dehors, magma au-dedans', text: 'Tu es d’ordinaire posé et solide, mais l’ambition et la passion bouillonnent en toi. Au moment décisif, ta force explosive surprend tout le monde, justement par contraste.' },
      地: { name: 'Montagne Inébranlable', emoji: '⛰️', copy: 'Solide dedans comme dehors : du vrai', text: 'Aussi fiable que tu en as l’air. Ce que tu bâtis ne s’effondre pas, et la confiance en toi est profonde. En prenant ton temps, tu atteins le sommet à coup sûr.' },
      風: { name: 'Grand Arbre qui Écoute le Vent', emoji: '🌳', copy: 'Semble enraciné, mais l’esprit vole libre', text: 'À l’extérieur, stable et digne de confiance ; à l’intérieur, débordant de curiosité et d’idées libres. Enraciné fermement tandis que tes branches jouent avec le vent : réalisme et souplesse en équilibre.' },
      水: { name: 'Forêt qui Cache une Source', emoji: '🌲💧', copy: 'Semble pragmatique, mais très tendre au fond', text: 'Calme et fiable en surface, tu caches en dessous une riche sensibilité et beaucoup d’empathie. La source profonde derrière cet extérieur paisible est ce qui apaise ceux que tu aimes.' },
    },
    風: {
      火: { name: 'Vent qui Porte la Chaleur', emoji: '🌬️🔥', copy: 'Semble léger, mais son cœur est une boule de feu', text: 'Derrière une allure sociable et vive brûle une passion combative. Tu fais bouger les gens en mettant de la chaleur dans tes mots et tes idées.' },
      地: { name: 'Voyageur à la Boussole', emoji: '🧭', copy: 'Semble libre, mais retombe toujours sur ses pieds', text: 'Tu peux aller partout d’un pas léger, pourtant un solide sens du réel vit en toi. Tu équilibres liberté et ancrage : on dit que tu obtiens des résultats tout en ayant l’air de t’amuser.' },
      風: { name: 'Oiseau Migrateur Libre', emoji: '🕊️', copy: 'Un esprit libre, léger jusqu’au cœur', text: 'Léger à l’extérieur comme à l’intérieur. Nourri par le savoir et la conversation, tu voles au-delà de toute frontière. Ta façon même de vivre, sans attaches, fait tout ton charme.' },
      水: { name: 'Brise d’une Nuit de Lune', emoji: '🌙', copy: 'Semble sociable, mais sensible au fond du cœur', text: 'Tu parles avec aisance à tout le monde, pourtant un poète délicat habite en toi. Tu saisis les moindres nuances du sentiment, et tes mots portent une chaleur mystérieuse.' },
    },
    水: {
      火: { name: 'Volcan Sous-Marin', emoji: '🌊🌋', copy: 'Semble calme, mais son cœur brûle plus que tout', text: 'Doux et empathique, tu abrites pourtant au plus profond une passion et une détermination ardentes. La flamme qui brûle au fond d’une mer paisible ne s’éteint pas facilement.' },
      地: { name: 'Crique Paisible', emoji: '⚓', copy: 'Doux, et étonnamment fiable', text: 'Au sein de ta tendresse enveloppante vit un sens du réel bien ancré. Sans te laisser emporter par l’émotion, tu sais être un « port sûr » pour ceux que tu aimes.' },
      風: { name: 'Eau qui Reflète le Vent', emoji: '🪞', copy: 'Très sensible, et l’esprit vif aussi', text: 'Tout en restant proche des sentiments des autres, tes pensées nagent librement au-dedans. Tu passes de l’empathie à l’objectivité : une intelligence souple et agile.' },
      水: { name: 'Lune des Grands Fonds', emoji: '🌊🌕', copy: 'Enfant de l’empathie : une âme qui ressent avec toi', text: 'Sensibilité de bout en bout. Une âme rare qui perçoit le non-dit et s’approche avec douceur. Cette profondeur est comme la lune reflétée au fond de la mer.' },
    },
  },
  it: {
    火: {
      火: { name: 'Cometa Sfrecciante', emoji: '☄️', copy: 'Brucia senza esitare: un’anima mossa dalla passione', text: 'A tutto gas dentro e fuori. L’istante in cui decidi è il via, e il tuo slancio trascina gli altri. Da dove nasce la tua energia e dove va sono entrambi ciò che ami e ciò che ti entusiasma.' },
      地: { name: 'Fiamma su Terra Salda', emoji: '🔥⛰️', copy: 'Sembra sgargiante, ma ha i piedi per terra', text: 'Fuori avanzi con passione, eppure dentro sei sorprendentemente concreto. Non salti solo per slancio: calcoli dove atterrare. «Ardente ma affidabile» è la tua miscela imbattibile.' },
      風: { name: 'Fuochi d’Artificio', emoji: '🎆', copy: 'Appassionato, con un cuore sempre leggero', text: 'Vai avanti con calore mentre cerchi sempre un’aria nuova dentro di te. Il tuo carburante è una curiosità che non sta mai ferma, e hai il dono naturale di illuminare qualsiasi luogo.' },
      水: { name: 'Fiamma che Racchiude un Mare', emoji: '🔥🌊', copy: 'Sembra di fuoco, ma il cuore è molto tenero', text: 'Fuori ardi con orgoglio, ma dentro c’è un mare di sensibilità. Poiché entri in sintonia così in profondità con gli altri, la tua passione porta sempre calore: forza e dolcezza insieme.' },
    },
    地: {
      火: { name: 'Vulcano Silenzioso', emoji: '🌋', copy: 'Calmo fuori, magma dentro', text: 'Di solito sei sereno e saldo, ma dentro ribollono ambizione e passione. Quando conta davvero, la tua forza esplosiva sorprende tutti proprio per il contrasto.' },
      地: { name: 'Montagna Incrollabile', emoji: '⛰️', copy: 'Solido dentro e fuori: quello vero', text: 'Affidabile quanto sembri. Ciò che costruisci non crolla e la fiducia in te è profonda. Con i tuoi tempi, raggiungi di sicuro la vetta.' },
      風: { name: 'Grande Albero che Ascolta il Vento', emoji: '🌳', copy: 'Sembra radicato, ma la mente vola libera', text: 'Fuori, stabile e affidabile; dentro, pieno di curiosità e idee libere. Radicato saldamente mentre i tuoi rami giocano con il vento: realismo e flessibilità in equilibrio.' },
      水: { name: 'Bosco che Nasconde una Sorgente', emoji: '🌲💧', copy: 'Sembra pratico, ma è molto tenero dentro', text: 'Calmo e affidabile in superficie, nascondi sotto una ricca sensibilità ed empatia. La sorgente profonda dietro quell’aspetto tranquillo è ciò che guarisce le persone che ami.' },
    },
    風: {
      火: { name: 'Vento che Porta Calore', emoji: '🌬️🔥', copy: 'Sembra leggero, ma il cuore è una palla di fuoco', text: 'Dietro un’aria socievole e brillante arde una passione combattiva. Muovi le persone mettendo calore nelle tue parole e nelle tue idee.' },
      地: { name: 'Viaggiatore con la Bussola', emoji: '🧭', copy: 'Sembra libero, ma atterra sempre in piedi', text: 'Puoi andare ovunque con passo leggero, eppure dentro vive un solido senso della realtà. Bilanci libertà e concretezza: dicono che ottieni risultati pur sembrando che ti stia solo divertendo.' },
      風: { name: 'Uccello Migratore Libero', emoji: '🕊️', copy: 'Uno spirito libero, leggero fino al cuore', text: 'Leggero fuori e dentro. Nutrito da conoscenza e conversazione, voli oltre ogni confine. Il tuo stesso modo di vivere, senza legami, è il tuo fascino.' },
      水: { name: 'Brezza di una Notte di Luna', emoji: '🌙', copy: 'Sembra socievole, ma dentro è sentimentale', text: 'Chiacchieri con facilità con chiunque, eppure dentro vive un poeta delicato. Cogli le sfumature più sottili del sentire, e le tue parole portano un calore misterioso.' },
    },
    水: {
      火: { name: 'Vulcano Sottomarino', emoji: '🌊🌋', copy: 'Sembra calmo, ma nel profondo arde più di tutti', text: 'Dai modi gentili ed empatico, eppure nel profondo dormono una passione e una determinazione intense. La fiamma che arde in fondo a un mare tranquillo non si spegne facilmente.' },
      地: { name: 'Insenatura Tranquilla', emoji: '⚓', copy: 'Gentile e, in fondo, molto affidabile', text: 'Dentro la tua tenerezza avvolgente vive un saldo senso della realtà. Senza farti travolgere dall’emozione, sai essere un «porto sicuro» per chi ami.' },
      風: { name: 'Acqua che Riflette il Vento', emoji: '🪞', copy: 'Molto sensibile e dalla mente pronta', text: 'Mentre resti vicino ai sentimenti degli altri, i tuoi pensieri nuotano liberi dentro di te. Vai e vieni tra empatia e obiettività: un’intelligenza duttile e flessibile.' },
      水: { name: 'Luna del Mare Profondo', emoji: '🌊🌕', copy: 'Figlio dell’empatia: un’anima che sente con te', text: 'Sensibilità dall’inizio alla fine. Un’anima rara che percepisce il non detto e si avvicina con dolcezza. Quella profondità è come la luna riflessa in fondo al mare.' },
    },
  },
  pt: {
    火: {
      火: { name: 'Cometa Veloz', emoji: '☄️', copy: 'Arde sem hesitar: uma alma movida pela paixão', text: 'A todo vapor por dentro e por fora. O instante em que você decide é o sinal de largada, e seu ímpeto arrasta os outros. A origem e o destino da sua energia são aquilo que você ama e o que te empolga.' },
      地: { name: 'Chama em Terra Firme', emoji: '🔥⛰️', copy: 'Parece chamativo, mas tem os pés no chão', text: 'Por fora você avança com paixão, mas por dentro é surpreendentemente prático. Você não salta só no ímpeto: calcula onde aterrissar. «Ardente, porém confiável» é a sua mistura imbatível.' },
      風: { name: 'Fogos de Artifício', emoji: '🎆', copy: 'Apaixonado, com um coração sempre leve', text: 'Você segue em frente com calor enquanto busca sempre um ar novo por dentro. Seu combustível é uma curiosidade que nunca fica parada, e você tem o dom natural de iluminar qualquer lugar.' },
      水: { name: 'Chama que Abriga um Mar', emoji: '🔥🌊', copy: 'Parece de fogo, mas seu coração é muito terno', text: 'Você arde com orgulho por fora, mas por dentro há um mar de sensibilidade. Como você sintoniza tão fundo com os outros, sua paixão sempre carrega calor: força e ternura ao mesmo tempo.' },
    },
    地: {
      火: { name: 'Vulcão Silencioso', emoji: '🌋', copy: 'Calmo por fora, magma por dentro', text: 'Você costuma ser tranquilo e firme, mas por dentro fervem ambição e paixão. Na hora que realmente importa, sua força explosiva surpreende a todos justamente pelo contraste.' },
      地: { name: 'Montanha Inabalável', emoji: '⛰️', copy: 'Sólido por dentro e por fora: o verdadeiro', text: 'Tão confiável quanto aparenta. O que você constrói não desmorona, e a confiança em você é profunda. No seu tempo, você chega ao topo com certeza.' },
      風: { name: 'Grande Árvore que Escuta o Vento', emoji: '🌳', copy: 'Parece enraizado, mas a mente voa livre', text: 'Por fora, estável e digno de confiança; por dentro, cheio de curiosidade e ideias livres. Enraizado com firmeza enquanto seus galhos brincam com o vento: realismo e flexibilidade em equilíbrio.' },
      水: { name: 'Floresta que Esconde uma Nascente', emoji: '🌲💧', copy: 'Parece prático, mas é muito terno por dentro', text: 'Calmo e confiável na superfície, você esconde por baixo uma rica sensibilidade e empatia. A nascente profunda por trás desse exterior sereno é o que cura as pessoas que você ama.' },
    },
    風: {
      火: { name: 'Vento que Leva Calor', emoji: '🌬️🔥', copy: 'Parece leve, mas seu coração é uma bola de fogo', text: 'Por trás de um jeito sociável e afiado arde uma paixão competitiva. Você move as pessoas colocando calor nas suas palavras e ideias.' },
      地: { name: 'Viajante com Bússola', emoji: '🧭', copy: 'Parece livre, mas sempre cai de pé', text: 'Você pode ir a qualquer lugar com passos leves, mas por dentro vive um sólido senso de realidade. Você equilibra liberdade e firmeza: dizem que você entrega resultados mesmo parecendo só estar brincando.' },
      風: { name: 'Ave Migratória Livre', emoji: '🕊️', copy: 'Um espírito livre, leve até o coração', text: 'Leve por fora e por dentro. Nutrido por conhecimento e conversa, você voa sem fronteiras. Seu próprio modo de viver, sem amarras, é o seu encanto.' },
      水: { name: 'Brisa de uma Noite de Lua', emoji: '🌙', copy: 'Parece sociável, mas é sentimental por dentro', text: 'Você conversa com facilidade com qualquer um, mas por dentro vive um poeta delicado. Você capta as nuances mais sutis do sentir, e suas palavras carregam um calor misterioso.' },
    },
    水: {
      火: { name: 'Vulcão Submarino', emoji: '🌊🌋', copy: 'Parece calmo, mas seu âmago arde mais que todos', text: 'De trato suave e empático, você guarda no fundo uma paixão e uma determinação intensas. A chama que arde no fundo de um mar tranquilo não se apaga com facilidade.' },
      地: { name: 'Enseada Tranquila', emoji: '⚓', copy: 'Gentil e, no fundo, muito confiável', text: 'Dentro da sua ternura acolhedora vive um firme senso de realidade. Sem se deixar levar pela emoção, você sabe ser um «porto seguro» para quem você ama.' },
      風: { name: 'Água que Reflete o Vento', emoji: '🪞', copy: 'Muito sensível e de raciocínio rápido', text: 'Enquanto acompanha os sentimentos dos outros, seus pensamentos nadam livres por dentro. Você transita entre a empatia e a objetividade: uma inteligência flexível e ágil.' },
      水: { name: 'Lua do Mar Profundo', emoji: '🌊🌕', copy: 'Filho da empatia: uma alma que sente com você', text: 'Sensibilidade do começo ao fim. Uma alma rara que percebe o não dito e se aproxima com suavidade. Essa profundidade é como a lua refletida no fundo do mar.' },
    },
  },
  ko: {
    火: {
      火: { name: '질주하는 혜성', emoji: '☄️', copy: '망설임 없이 타오르는, 타고난 열정파', text: '겉도 속도 전력 질주. 마음먹은 순간이 곧 출발 신호이고, 그 기세가 주변을 끌어들입니다. 에너지의 근원도 쓰임새도 모두 「좋아하는 것」과 「설렘」으로 이루어져 있습니다.' },
      地: { name: '대지에 선 불꽃', emoji: '🔥⛰️', copy: '화려해 보여도, 실은 두 발이 땅에 붙어 있다', text: '밖에서는 열정적으로 밀어붙이지만, 속마음은 놀랄 만큼 현실적입니다. 기세만으로 뛰어들지 않고 착지 지점을 계산하죠. 「뜨거운데 착실한」 최강의 조합입니다.' },
      風: { name: '피어오르는 불꽃놀이', emoji: '🎆', copy: '열정적이면서, 마음은 한없이 가볍다', text: '밖에서는 뜨겁게 나아가면서 안에서는 늘 새로운 바람을 찾습니다. 한곳에 머물지 않는 호기심이 연료. 자리를 환하게 밝히는 타고난 화사함이 있습니다.' },
      水: { name: '바다를 품은 불꽃', emoji: '🔥🌊', copy: '열정적인 사람 같지만, 마음은 무척 섬세하다', text: '밖에서는 당당히 타오르지만, 마음속은 감수성의 바다입니다. 남의 마음에 깊이 공명하기에, 그 열정에는 온기가 있죠. 강함과 다정함을 함께 지닌 사람입니다.' },
    },
    地: {
      火: { name: '고요한 화산', emoji: '🌋', copy: '차분해 보여도, 속은 마그마', text: '평소에는 온화하고 착실하지만, 마음속에는 뜨거운 야망과 열정이 끓고 있습니다. 결정적인 순간의 폭발력은 평소와의 낙차로 주변을 놀라게 하죠.' },
      地: { name: '흔들리지 않는 산', emoji: '⛰️', copy: '겉도 속도 든든하게 안정된 정통파', text: '보이는 그대로의 안정감. 쌓아 올린 것은 무너지지 않고, 신뢰는 한없이 두텁습니다. 시간을 들여 확실하게 정상에 다다르는 사람입니다.' },
      風: { name: '바람을 듣는 큰 나무', emoji: '🌳', copy: '든든해 보여도, 마음은 자유롭게 날고 있다', text: '밖에서는 안정과 신뢰의 사람. 하지만 마음속은 호기심과 자유로운 발상으로 가득합니다. 뿌리를 내린 채 가지는 바람과 노는—현실감과 유연함의 양립이 매력입니다.' },
      水: { name: '샘을 감춘 숲', emoji: '🌲💧', copy: '현실적으로 보여도, 마음은 깊고 다정하다', text: '밖에서는 냉정하고 믿음직한 존재. 그 안쪽에 풍부한 감수성과 공감력을 감추고 있습니다. 조용한 겉모습 속의 깊은 샘이 소중한 이를 치유합니다.' },
    },
    風: {
      火: { name: '열기를 나르는 바람', emoji: '🌬️🔥', copy: '가벼워 보여도, 마음은 불덩이', text: '사교적이고 스마트한 겉모습 안쪽에 지기 싫어하는 열정이 타오릅니다. 말과 아이디어에 열기를 실어 사람을 움직이는 타입입니다.' },
      地: { name: '나침반을 든 여행자', emoji: '🧭', copy: '자유로워 보여도, 제대로 착지한다', text: '가벼운 발걸음으로 어디든 갈 수 있으면서도, 마음속에는 확실한 현실 감각이 있습니다. 자유와 착실함의 조율사로, 「노는 듯하면서 결과를 내는 사람」이라 불립니다.' },
      風: { name: '자유로운 철새', emoji: '🕊️', copy: '타고난 자유인, 마음까지 통풍 만점', text: '겉도 속도 가볍습니다. 지식과 대화를 양분 삼아 경계 없이 날아다니죠. 얽매이지 않는 삶의 방식 자체가 매력입니다.' },
      水: { name: '달밤의 산들바람', emoji: '🌙', copy: '사교적으로 보여도, 마음은 정서의 사람', text: '누구와도 가볍게 이야기하면서도, 마음속은 섬세한 시인입니다. 사람 감정의 미묘함을 길어 올리는 힘이 있어, 그 말에는 신기하게도 온기가 깃듭니다.' },
    },
    水: {
      火: { name: '심해의 화산', emoji: '🌊🌋', copy: '온화해 보여도, 심지는 누구보다 뜨겁다', text: '몸가짐이 부드럽고 공감력이 있지만, 마음 깊은 곳에는 격렬한 열정과 결의가 잠들어 있습니다. 고요한 바다 밑에서 계속 타는 불꽃은 쉽게 꺼지지 않습니다.' },
      地: { name: '고요한 만', emoji: '⚓', copy: '다정하면서, 실은 야무진 사람', text: '감싸 안는 듯한 다정함 안쪽에, 두 발이 땅에 붙은 현실 감각이 있습니다. 감정에 휩쓸리지 않고 소중한 이의 「안전한 항구」가 되어 주는 사람입니다.' },
      風: { name: '바람을 비추는 수면', emoji: '🪞', copy: '감수성이 풍부하고, 머리 회전도 빠르다', text: '남의 마음에 다가서면서도, 마음속에서는 생각이 자유롭게 헤엄칩니다. 공감과 객관을 오갈 수 있는, 유연한 지성의 소유자입니다.' },
      水: { name: '심해의 달', emoji: '🌊🌕', copy: '느끼는 힘의 총아, 타고난 공감자', text: '겉도 속도 감수성 덩어리. 말로 표현되지 않는 것을 느끼고 살며시 다가서는 보기 드문 사람입니다. 그 깊이는 바다 밑에 비친 달과 같습니다.' },
    },
  },
}
