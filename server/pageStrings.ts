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
  /** 10天体と12星座の説明ページ(/stars) */
  starsLink: string
  starsTitle: string
  starsLead: string
  planetsTitle: string
  planetsLead: string
  signsTitle: string
  signsLead: string
  howReadTitle: string
  howReadLead: string
  whoLabel: string
  howLabel: string
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
    starsLink: '10天体と12星座のこと',
    starsTitle: '10天体と12星座のこと',
    starsLead: '診断結果に出てくる「太陽星座」「月星座」、そしてあなたを構成する10天体のパーティ。それぞれが何を担当しているのかをまとめました。',
    planetsTitle: 'あなたをかたちづくる星たち',
    planetsLead: '生まれた瞬間、それぞれの星がどの星座にいたか。星が「誰が」を、星座が「どんなふうに」を表します。上昇星座を入れて全11キャラです。',
    signsTitle: '12星座と4つのエレメント',
    signsLead: '星座は12種類。火・地・風・水の4つのエレメントに分かれ、性質のベースになります。',
    howReadTitle: '結果の読み方',
    howReadLead: '天体が「誰が」を、星座が「どんなふうに」を表します。ふたつを合わせて、こんな一文になります。',
    whoLabel: '天体 ＝ 誰が',
    howLabel: '星座 ＝ どんなふうに',
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
    starsLink: 'About the 10 planets and 12 signs',
    starsTitle: 'About the 10 planets and 12 signs',
    starsLead: 'Your Sun sign, your Moon sign, and the party of ten planets that make you who you are — here is what each one is in charge of.',
    planetsTitle: 'The stars that shape you',
    planetsLead: 'Where each star stood the moment you were born. The planet says "who", the sign says "in what way". With the Rising sign, that makes eleven characters.',
    signsTitle: 'The 12 signs and 4 elements',
    signsLead: 'There are twelve signs, grouped into four elements — fire, earth, air and water — which form the base of their nature.',
    howReadTitle: 'How to read your result',
    howReadLead: 'The planet tells you "who", the sign tells you "in what way". Put the two together and you get a sentence like this.',
    whoLabel: 'Planet = who',
    howLabel: 'Sign = in what way',
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
    starsLink: 'Sobre los 10 planetas y 12 signos',
    starsTitle: 'Sobre los 10 planetas y 12 signos',
    starsLead: 'Tu signo solar, tu signo lunar y el grupo de diez planetas que te componen: esto es de lo que se encarga cada uno.',
    planetsTitle: 'Los astros que te forman',
    planetsLead: 'Dónde estaba cada astro en el momento de tu nacimiento. El planeta dice "quién" y el signo dice "de qué manera". Con el Ascendente son once personajes.',
    signsTitle: 'Los 12 signos y los 4 elementos',
    signsLead: 'Hay doce signos, repartidos en cuatro elementos — fuego, tierra, aire y agua — que son la base de su carácter.',
    howReadTitle: 'Cómo leer tu resultado',
    howReadLead: 'El planeta dice "quién" y el signo dice "de qué manera". Al juntarlos, sale una frase así.',
    whoLabel: 'Planeta = quién',
    howLabel: 'Signo = de qué manera',
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
    starsLink: 'À propos des 10 planètes et 12 signes',
    starsTitle: 'À propos des 10 planètes et 12 signes',
    starsLead: 'Ton signe solaire, ton signe lunaire et l’équipe de dix planètes qui te composent : voici ce dont chacun s’occupe.',
    planetsTitle: 'Les astres qui te façonnent',
    planetsLead: 'Où se trouvait chaque astre à l’instant de ta naissance. La planète dit « qui », le signe dit « de quelle manière ». Avec l’Ascendant, cela fait onze personnages.',
    signsTitle: 'Les 12 signes et les 4 éléments',
    signsLead: 'Il y a douze signes, répartis en quatre éléments — feu, terre, air et eau — qui forment la base de leur nature.',
    howReadTitle: 'Comment lire ton résultat',
    howReadLead: 'La planète dit « qui », le signe dit « de quelle manière ». Ensemble, cela donne une phrase comme celle-ci.',
    whoLabel: 'Planète = qui',
    howLabel: 'Signe = de quelle manière',
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
    starsLink: 'I 10 pianeti e i 12 segni',
    starsTitle: 'I 10 pianeti e i 12 segni',
    starsLead: 'Il tuo segno solare, il tuo segno lunare e il gruppo di dieci pianeti che ti compone: ecco di cosa si occupa ognuno.',
    planetsTitle: 'Gli astri che ti formano',
    planetsLead: 'Dove si trovava ogni astro nell’istante della tua nascita. Il pianeta dice "chi", il segno dice "in che modo". Con l’Ascendente sono undici personaggi.',
    signsTitle: 'I 12 segni e i 4 elementi',
    signsLead: 'I segni sono dodici, divisi in quattro elementi — fuoco, terra, aria e acqua — che sono la base del loro carattere.',
    howReadTitle: 'Come leggere il risultato',
    howReadLead: 'Il pianeta dice "chi", il segno dice "in che modo". Insieme formano una frase come questa.',
    whoLabel: 'Pianeta = chi',
    howLabel: 'Segno = in che modo',
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
    starsLink: 'Sobre os 10 planetas e 12 signos',
    starsTitle: 'Sobre os 10 planetas e 12 signos',
    starsLead: 'O seu signo solar, o seu signo lunar e o grupo de dez planetas que compõe você: veja do que cada um cuida.',
    planetsTitle: 'Os astros que formam você',
    planetsLead: 'Onde cada astro estava no instante do seu nascimento. O planeta diz "quem" e o signo diz "de que jeito". Com o Ascendente, são onze personagens.',
    signsTitle: 'Os 12 signos e os 4 elementos',
    signsLead: 'São doze signos, divididos em quatro elementos — fogo, terra, ar e água — que formam a base da sua natureza.',
    howReadTitle: 'Como ler o seu resultado',
    howReadLead: 'O planeta diz "quem" e o signo diz "de que jeito". Juntando os dois, sai uma frase assim.',
    whoLabel: 'Planeta = quem',
    howLabel: 'Signo = de que jeito',
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
    starsLink: '10행성과 12별자리 이야기',
    starsTitle: '10행성과 12별자리 이야기',
    starsLead: '진단 결과에 나오는 태양 별자리와 달 별자리, 그리고 당신을 이루는 10행성 파티. 각자 무엇을 담당하는지 정리했어요.',
    planetsTitle: '당신을 이루는 별들',
    planetsLead: '태어난 순간 각 별이 어느 별자리에 있었는지. 행성이 "누가"를, 별자리가 "어떤 식으로"를 나타내요. 상승궁까지 더해 모두 11캐릭터예요.',
    signsTitle: '12별자리와 4원소',
    signsLead: '별자리는 12가지. 불·흙·바람·물 네 원소로 나뉘며, 성질의 바탕이 돼요.',
    howReadTitle: '결과를 읽는 법',
    howReadLead: '행성이 "누가"를, 별자리가 "어떤 식으로"를 나타내요. 둘을 합치면 이런 한 문장이 돼요.',
    whoLabel: '행성 = 누가',
    howLabel: '별자리 = 어떤 식으로',
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
