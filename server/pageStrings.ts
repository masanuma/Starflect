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
  /**
   * キャラ別ページの<title>。従来は「『静かな火山』ってどんな人？」＝**自社造語のみで検索需要ゼロ**だった。
   * 実際に検索されるのは「太陽星座 月星座 組み合わせ」「性格」などなので、そちらを前に出す。
   */
  charTitleSeo: (name: string) => string
  /** 「この組み合わせに当てはまる星座」セクション。1キャラ＝太陽3星座×月3星座の9通りをカバーする */
  combosTitle: string
  combosLead: (name: string, sunWord: string, moonWord: string) => string
  /** 例: 「太陽おうし座 × 月しし座」 */
  comboItem: (sunSign: string, moonSign: string) => string
  otherTitle: string
  backToTop: string
  /** 10天体と12星座の説明ページ(/stars) */
  starsLink: string
  starsTitle: string
  starsLead: string
  /** 相性の紹介ページ(/pair)＝相性シェアの着地先 */
  pairTitle: string
  pairLead: string
  pairPoints: [string, string, string]
  pairCta: string
  pairNote: string
  planetsTitle: string
  planetsLead: string
  signsTitle: string
  signsLead: string
  howReadTitle: string
  howReadLead: string
  whoLabel: string
  howLabel: string
  /** 天体の分類(太陽を先頭に、自分→周り→時代とズームアウトする) */
  sunNote: string
  ascNote: string
  g1Lead: string
  g2Lead: string
  g3Lead: string
}

export const PAGE_STRINGS: Record<Lang, PageStrings> = {
  ja: {
    cta: 'ほしキャラ診断を開始する！',
    heroNote: '登録不要・生年月日だけ・30秒',
    howTo: '使い方',
    steps: [
      { t: '生年月日を入力', d: 'ニックネームと生年月日だけ。生まれた時刻・場所は任意（入れるとより詳しく）。' },
      { t: 'あなたのほしキャラが判明', d: '太陽と月の組み合わせで、16キャラのどれかに。裏では全10天体を計算しています。' },
      { t: 'ほしキャラに相談', d: '今日の運勢と、あなたの星を全部知ったほしキャラとのチャット。この先のことも、聞けば答えてくれます。' },
    ],
    charTitle: (n) => `「${n}」ってどんな人？`,
    charTitleSeo: (n) => `太陽星座と月星座の組み合わせ「${n}」の性格`,
    combosTitle: 'この組み合わせに当てはまる星座',
    combosLead: (n, sw, mw) => `「${n}」になるのは、太陽星座が${sw}のグループ・月星座が${mw}のグループの人です。次の9通りが当てはまります。`,
    comboItem: (ss, ms) => `太陽${ss} × 月${ms}`,
    otherTitle: 'ほかのほしキャラ',
    backToTop: '← ほしキャラ診断トップへ',
    starsLink: '10天体と12星座のこと',
    starsTitle: '10天体と12星座のこと',
    starsLead: '診断結果に出てくる「太陽星座」「月星座」、そしてあなたをかたちづくる10の星。それぞれが何を担当しているのかをまとめました。',
    pairTitle: 'ふたりの相性を占う',
    pairLead: '相手の生年月日だけで、ふたりの相性がわかります。太陽星座と月星座を掛け合わせた「ほしキャラ」同士の相性なので、雑誌の12星座占いより細かく出ます。',
    pairPoints: [
      '相手の生年月日を入れるだけ。名前はニックネームでもOKです。',
      '相性の%と、ふたりの呼び名（例：名コンビ）が出ます。組み合わせは16×16通り。',
      '「今日のふたり」と、ふたり専門の相談室つき。恋愛でも仕事でも聞けます。',
    ],
    pairCta: 'ふたりの相性を占う',
    pairNote: '登録不要・ふたりの生年月日だけ・1分',
    planetsTitle: 'あなたをかたちづくる星たち',
    planetsLead: '生まれた瞬間、それぞれの星がどの星座にいたか。星が「誰が」を、星座が「どんなふうに」を表します。上昇星座を入れて全11キャラです。',
    signsTitle: '12星座と4つのエレメント',
    signsLead: '星座は12種類。火・地・風・水の4つのエレメントに分かれ、性質のベースになります。',
    howReadTitle: '結果の読み方',
    howReadLead: '天体が「誰が」を、星座が「どんなふうに」を表します。ふたつを合わせて、こんな一文になります。',
    whoLabel: '天体 ＝ 誰が',
    howLabel: '星座 ＝ どんなふうに',
    sunNote: '雑誌やテレビの12星座占いでいう「あなたの星座」は、この太陽星座のことです。',
    ascNote: '※上昇星座は天体ではなく、生まれた瞬間に東の地平線と重なっていた点です。約2時間で変わるので、生まれた時刻がわかると精度が上がります。',
    g1Lead: '数日〜2か月ほどで次の星座へ移ります。動きが速いぶん人によって違い、あなたらしさがいちばん出るところです。',
    g2Lead: '1年〜2年半かけて次の星座へ移ります。社会の中での役回りや、鍛えられる場所を表します。',
    g3Lead: '7年〜30年かけてゆっくり移動します。だから同じ時代に生まれた人とは、ほぼ同じ。友だちと冥王星が同じなのは、このためです。',
  },
  en: {
    cta: 'Start your Hoshi-Kyara diagnosis!',
    heroNote: 'No signup · Just your birth date · 30 seconds',
    howTo: 'How it works',
    steps: [
      { t: 'Enter your birth date', d: 'Just a nickname and birth date. Birth time and place are optional (they add more detail).' },
      { t: 'Your Hoshi-Kyara is revealed', d: 'Your Sun and Moon decide which of the 16 you are. All ten planets are calculated behind the scenes.' },
      { t: 'Ask your Hoshi-Kyara', d: 'Today’s reading, plus a chat with the Hoshi-Kyara that knows every one of your stars. Ask about what’s ahead and it will tell you.' },
    ],
    charTitle: (n) => `What is “${n}” like?`,
    charTitleSeo: (n) => `Sun sign × Moon sign: the “${n}” personality`,
    combosTitle: 'Which signs this combination covers',
    combosLead: (n, sw, mw) => `You are a “${n}” if your Sun sign is in the ${sw} group and your Moon sign is in the ${mw} group. These nine pairings apply.`,
    comboItem: (ss, ms) => `Sun in ${ss} × Moon in ${ms}`,
    otherTitle: 'Other Hoshi-Kyara',
    backToTop: '← Back to Hoshi-Kyara home',
    starsLink: 'About the 10 planets and 12 signs',
    starsTitle: 'About the 10 planets and 12 signs',
    starsLead: 'Your Sun sign, your Moon sign, and the ten stars that shape you — here is what each one is in charge of.',
    pairTitle: 'See how you two match',
    pairLead: 'Just their birth date is enough. Because it matches Hoshi-Kyara — Sun sign blended with Moon sign — it goes finer than a magazine horoscope.',
    pairPoints: [
      'Just enter their birth date. A nickname works fine for the name.',
      'You get a match percentage and a name for the pair (like “great duo”). 16 × 16 combinations.',
      'Comes with “the two of you today” and a chat room just for your pair — love or work, ask anything.',
    ],
    pairCta: 'See how you two match',
    pairNote: 'No signup · Just two birth dates · 1 minute',
    planetsTitle: 'The stars that shape you',
    planetsLead: 'Where each star stood the moment you were born. The planet says "who", the sign says "in what way". With the Rising sign, that makes eleven characters.',
    signsTitle: 'The 12 signs and 4 elements',
    signsLead: 'There are twelve signs, grouped into four elements — fire, earth, air and water — which form the base of their nature.',
    howReadTitle: 'How to read your result',
    howReadLead: 'The planet tells you "who", the sign tells you "in what way". Put the two together and you get a sentence like this.',
    whoLabel: 'Planet = who',
    howLabel: 'Sign = in what way',
    sunNote: 'When a magazine or TV horoscope says "your sign", it means this Sun sign.',
    ascNote: 'Note: the Rising sign is not a planet — it is the point where the eastern horizon met the zodiac at your birth. It changes about every two hours, so knowing your birth time makes it more accurate.',
    g1Lead: 'These move to the next sign within days to a couple of months. Because they travel fast, they differ from person to person — this is where you are most yourself.',
    g2Lead: 'These take one to two and a half years to change signs. They describe your role in society and where life trains you.',
    g3Lead: 'These drift slowly, taking 7 to 30 years per sign. That is why people born around the same time share them — and why your friend often has the same Pluto as you.',
  },
  es: {
    cta: '¡Empieza tu diagnóstico Hoshi-Kyara!',
    heroNote: 'Sin registro · Solo tu fecha de nacimiento · 30 segundos',
    howTo: 'Cómo funciona',
    steps: [
      { t: 'Introduce tu fecha de nacimiento', d: 'Solo un apodo y la fecha. La hora y el lugar son opcionales (dan más detalle).' },
      { t: 'Se revela tu Hoshi-Kyara', d: 'Tu Sol y tu Luna deciden cuál de los 16 eres. Los diez astros se calculan por detrás.' },
      { t: 'Consulta a tu Hoshi-Kyara', d: 'La lectura de hoy y un chat con el Hoshi-Kyara que conoce todos tus astros. Pregúntale por lo que viene y te lo dirá.' },
    ],
    charTitle: (n) => `¿Cómo es «${n}»?`,
    charTitleSeo: (n) => `Signo solar × signo lunar: la personalidad de «${n}»`,
    combosTitle: 'Qué signos abarca esta combinación',
    combosLead: (n, sw, mw) => `Eres «${n}» si tu signo solar está en el grupo de ${sw} y tu signo lunar en el de ${mw}. Estas nueve parejas encajan.`,
    comboItem: (ss, ms) => `Sol en ${ss} × Luna en ${ms}`,
    otherTitle: 'Otros Hoshi-Kyara',
    backToTop: '← Volver al inicio de Hoshi-Kyara',
    starsLink: 'Sobre los 10 planetas y 12 signos',
    starsTitle: 'Sobre los 10 planetas y 12 signos',
    starsLead: 'Tu signo solar, tu signo lunar y los diez astros que te forman: esto es de lo que se encarga cada uno.',
    pairTitle: 'Ved vuestra compatibilidad',
    pairLead: 'Basta con su fecha de nacimiento. Al comparar Hoshi-Kyara —el signo solar combinado con el lunar— sale más fino que un horóscopo de revista.',
    pairPoints: [
      'Solo introduce su fecha de nacimiento. Un apodo sirve como nombre.',
      'Obtenéis un porcentaje y un nombre para la pareja (por ejemplo, «gran dúo»). 16 × 16 combinaciones.',
      'Incluye «vosotros dos hoy» y un consultorio solo para vosotros: amor o trabajo, lo que queráis.',
    ],
    pairCta: 'Ved vuestra compatibilidad',
    pairNote: 'Sin registro · Solo dos fechas de nacimiento · 1 minuto',
    planetsTitle: 'Los astros que te forman',
    planetsLead: 'Dónde estaba cada astro en el momento de tu nacimiento. El planeta dice "quién" y el signo dice "de qué manera". Con el Ascendente son once personajes.',
    signsTitle: 'Los 12 signos y los 4 elementos',
    signsLead: 'Hay doce signos, repartidos en cuatro elementos — fuego, tierra, aire y agua — que son la base de su carácter.',
    howReadTitle: 'Cómo leer tu resultado',
    howReadLead: 'El planeta dice "quién" y el signo dice "de qué manera". Al juntarlos, sale una frase así.',
    whoLabel: 'Planeta = quién',
    howLabel: 'Signo = de qué manera',
    sunNote: 'Cuando un horóscopo de revista o televisión dice "tu signo", se refiere a este signo solar.',
    ascNote: 'Nota: el Ascendente no es un planeta, sino el punto donde el horizonte este se cruzaba con el zodiaco al nacer. Cambia cada dos horas, así que saber tu hora de nacimiento lo hace más preciso.',
    g1Lead: 'Cambian de signo en días o un par de meses. Al moverse rápido, varían de persona a persona: aquí es donde más se nota tu carácter.',
    g2Lead: 'Tardan de uno a dos años y medio en cambiar de signo. Hablan de tu papel en la sociedad y de dónde la vida te pone a prueba.',
    g3Lead: 'Avanzan muy despacio: de 7 a 30 años por signo. Por eso quienes nacieron en la misma época los comparten, y tu amigo suele tener el mismo Plutón que tú.',
  },
  fr: {
    cta: 'Commencer le diagnostic Hoshi-Kyara !',
    heroNote: 'Sans inscription · Juste ta date de naissance · 30 secondes',
    howTo: 'Comment ça marche',
    steps: [
      { t: 'Saisis ta date de naissance', d: 'Juste un pseudo et la date. L’heure et le lieu sont facultatifs (plus de détails).' },
      { t: 'Ton Hoshi-Kyara se révèle', d: 'Ton Soleil et ta Lune décident lequel des 16 tu es. Les dix astres sont calculés en coulisses.' },
      { t: 'Demande à ton Hoshi-Kyara', d: 'La lecture du jour, et un échange avec le Hoshi-Kyara qui connaît tous tes astres. Demande-lui la suite, il te répondra.' },
    ],
    charTitle: (n) => `Qui est « ${n} » ?`,
    charTitleSeo: (n) => `Signe solaire × signe lunaire : la personnalité « ${n} »`,
    combosTitle: 'Quels signes cette combinaison couvre',
    combosLead: (n, sw, mw) => `Tu es « ${n} » si ton signe solaire est du groupe ${sw} et ton signe lunaire du groupe ${mw}. Ces neuf paires correspondent.`,
    comboItem: (ss, ms) => `Soleil en ${ss} × Lune en ${ms}`,
    otherTitle: 'Autres Hoshi-Kyara',
    backToTop: '← Retour à l’accueil Hoshi-Kyara',
    starsLink: 'À propos des 10 planètes et 12 signes',
    starsTitle: 'À propos des 10 planètes et 12 signes',
    starsLead: 'Ton signe solaire, ton signe lunaire et les dix astres qui te façonnent : voici ce dont chacun s’occupe.',
    pairTitle: 'Voyez votre compatibilité',
    pairLead: 'Sa date de naissance suffit. Comme on compare les Hoshi-Kyara — signe solaire croisé avec signe lunaire — c’est plus fin qu’un horoscope de magazine.',
    pairPoints: [
      'Entre simplement sa date de naissance. Un surnom suffit comme nom.',
      'Vous obtenez un pourcentage et un nom pour le duo (par exemple « super duo »). 16 × 16 combinaisons.',
      'Avec « vous deux aujourd’hui » et un salon réservé à votre duo : amour ou travail, demandez ce que vous voulez.',
    ],
    pairCta: 'Voir votre compatibilité',
    pairNote: 'Sans inscription · Deux dates de naissance · 1 minute',
    planetsTitle: 'Les astres qui te façonnent',
    planetsLead: 'Où se trouvait chaque astre à l’instant de ta naissance. La planète dit « qui », le signe dit « de quelle manière ». Avec l’Ascendant, cela fait onze personnages.',
    signsTitle: 'Les 12 signes et les 4 éléments',
    signsLead: 'Il y a douze signes, répartis en quatre éléments — feu, terre, air et eau — qui forment la base de leur nature.',
    howReadTitle: 'Comment lire ton résultat',
    howReadLead: 'La planète dit « qui », le signe dit « de quelle manière ». Ensemble, cela donne une phrase comme celle-ci.',
    whoLabel: 'Planète = qui',
    howLabel: 'Signe = de quelle manière',
    sunNote: 'Quand un horoscope de magazine ou de télévision parle de « ton signe », il s’agit de ce signe solaire.',
    ascNote: 'À noter : l’Ascendant n’est pas une planète, mais le point où l’horizon est croisait le zodiaque à ta naissance. Il change environ toutes les deux heures : connaître ton heure de naissance le rend plus précis.',
    g1Lead: 'Ils changent de signe en quelques jours à deux mois. Comme ils vont vite, ils diffèrent d’une personne à l’autre : c’est là que tu es le plus toi-même.',
    g2Lead: 'Ils mettent un an à deux ans et demi à changer de signe. Ils décrivent ton rôle dans la société et là où la vie t’entraîne.',
    g3Lead: 'Ils avancent lentement : de 7 à 30 ans par signe. Voilà pourquoi les personnes nées à la même époque les partagent, et pourquoi ton ami a souvent le même Pluton que toi.',
  },
  it: {
    cta: 'Inizia la tua diagnosi Hoshi-Kyara!',
    heroNote: 'Senza registrazione · Solo la data di nascita · 30 secondi',
    howTo: 'Come funziona',
    steps: [
      { t: 'Inserisci la data di nascita', d: 'Solo un nickname e la data. Ora e luogo sono facoltativi (più dettagli).' },
      { t: 'Si rivela il tuo Hoshi-Kyara', d: 'Sole e Luna decidono quale dei 16 sei. Tutti e dieci gli astri vengono calcolati dietro le quinte.' },
      { t: 'Chiedi al tuo Hoshi-Kyara', d: 'La lettura di oggi e una chat con l’Hoshi-Kyara che conosce tutti i tuoi astri. Chiedi cosa verrà e te lo dirà.' },
    ],
    charTitle: (n) => `Com’è «${n}»?`,
    charTitleSeo: (n) => `Segno solare × segno lunare: la personalità di «${n}»`,
    combosTitle: 'Quali segni copre questa combinazione',
    combosLead: (n, sw, mw) => `Sei «${n}» se il tuo segno solare è del gruppo ${sw} e quello lunare del gruppo ${mw}. Queste nove coppie corrispondono.`,
    comboItem: (ss, ms) => `Sole in ${ss} × Luna in ${ms}`,
    otherTitle: 'Altri Hoshi-Kyara',
    backToTop: '← Torna alla home di Hoshi-Kyara',
    starsLink: 'I 10 pianeti e i 12 segni',
    starsTitle: 'I 10 pianeti e i 12 segni',
    starsLead: 'Il tuo segno solare, il tuo segno lunare e i dieci astri che ti formano: ecco di cosa si occupa ognuno.',
    pairTitle: 'Scoprite la vostra affinità',
    pairLead: 'Basta la sua data di nascita. Confrontando gli Hoshi-Kyara — segno solare incrociato con quello lunare — è più preciso di un oroscopo da rivista.',
    pairPoints: [
      'Inserisci solo la sua data di nascita. Come nome va bene anche un soprannome.',
      'Ottenete una percentuale e un nome per la coppia (per esempio «gran duo»). 16 × 16 combinazioni.',
      'Con «voi due oggi» e uno spazio di consulenza solo per voi: amore o lavoro, chiedete quello che volete.',
    ],
    pairCta: 'Scoprite la vostra affinità',
    pairNote: 'Senza registrazione · Due date di nascita · 1 minuto',
    planetsTitle: 'Gli astri che ti formano',
    planetsLead: 'Dove si trovava ogni astro nell’istante della tua nascita. Il pianeta dice "chi", il segno dice "in che modo". Con l’Ascendente sono undici personaggi.',
    signsTitle: 'I 12 segni e i 4 elementi',
    signsLead: 'I segni sono dodici, divisi in quattro elementi — fuoco, terra, aria e acqua — che sono la base del loro carattere.',
    howReadTitle: 'Come leggere il risultato',
    howReadLead: 'Il pianeta dice "chi", il segno dice "in che modo". Insieme formano una frase come questa.',
    whoLabel: 'Pianeta = chi',
    howLabel: 'Segno = in che modo',
    sunNote: 'Quando un oroscopo di una rivista o della TV dice "il tuo segno", intende questo segno solare.',
    ascNote: 'Nota: l’Ascendente non è un pianeta, ma il punto in cui l’orizzonte a est incrociava lo zodiaco alla tua nascita. Cambia ogni due ore circa, quindi conoscere l’ora di nascita lo rende più preciso.',
    g1Lead: 'Cambiano segno nel giro di giorni o un paio di mesi. Muovendosi in fretta, variano da persona a persona: qui sei più te stesso/a.',
    g2Lead: 'Impiegano da uno a due anni e mezzo per cambiare segno. Raccontano il tuo ruolo nella società e dove la vita ti allena.',
    g3Lead: 'Si spostano lentamente: da 7 a 30 anni per segno. Per questo chi è nato nello stesso periodo li condivide, e il tuo amico spesso ha il tuo stesso Plutone.',
  },
  pt: {
    cta: 'Começar o diagnóstico Hoshi-Kyara!',
    heroNote: 'Sem cadastro · Só a data de nascimento · 30 segundos',
    howTo: 'Como funciona',
    steps: [
      { t: 'Digite sua data de nascimento', d: 'Só um apelido e a data. Hora e local são opcionais (mais detalhes).' },
      { t: 'Seu Hoshi-Kyara é revelado', d: 'Seu Sol e sua Lua decidem qual dos 16 você é. Os dez astros são calculados nos bastidores.' },
      { t: 'Pergunte ao seu Hoshi-Kyara', d: 'A leitura de hoje e uma conversa com o Hoshi-Kyara que conhece todos os seus astros. Pergunte o que vem aí e ele responde.' },
    ],
    charTitle: (n) => `Como é «${n}»?`,
    charTitleSeo: (n) => `Signo solar × signo lunar: a personalidade de «${n}»`,
    combosTitle: 'Quais signos esta combinação abrange',
    combosLead: (n, sw, mw) => `Você é «${n}» se o seu signo solar for do grupo ${sw} e o lunar do grupo ${mw}. Estes nove pares se aplicam.`,
    comboItem: (ss, ms) => `Sol em ${ss} × Lua em ${ms}`,
    otherTitle: 'Outros Hoshi-Kyara',
    backToTop: '← Voltar ao início de Hoshi-Kyara',
    starsLink: 'Sobre os 10 planetas e 12 signos',
    starsTitle: 'Sobre os 10 planetas e 12 signos',
    starsLead: 'O seu signo solar, o seu signo lunar e os dez astros que formam você: veja do que cada um cuida.',
    pairTitle: 'Vejam a combinação de vocês',
    pairLead: 'Basta a data de nascimento dela. Como comparamos os Hoshi-Kyara — signo solar cruzado com o lunar — sai mais fino que um horóscopo de revista.',
    pairPoints: [
      'Basta inserir a data de nascimento. Um apelido serve como nome.',
      'Vocês recebem uma porcentagem e um nome para a dupla (por exemplo, «grande dupla»). 16 × 16 combinações.',
      'Vem com «vocês dois hoje» e um espaço de consulta só para vocês: amor ou trabalho, pergunte o que quiser.',
    ],
    pairCta: 'Ver a combinação de vocês',
    pairNote: 'Sem cadastro · Só duas datas de nascimento · 1 minuto',
    planetsTitle: 'Os astros que formam você',
    planetsLead: 'Onde cada astro estava no instante do seu nascimento. O planeta diz "quem" e o signo diz "de que jeito". Com o Ascendente, são onze personagens.',
    signsTitle: 'Os 12 signos e os 4 elementos',
    signsLead: 'São doze signos, divididos em quatro elementos — fogo, terra, ar e água — que formam a base da sua natureza.',
    howReadTitle: 'Como ler o seu resultado',
    howReadLead: 'O planeta diz "quem" e o signo diz "de que jeito". Juntando os dois, sai uma frase assim.',
    whoLabel: 'Planeta = quem',
    howLabel: 'Signo = de que jeito',
    sunNote: 'Quando um horóscopo de revista ou TV fala do "seu signo", é deste signo solar que se trata.',
    ascNote: 'Observação: o Ascendente não é um planeta, e sim o ponto onde o horizonte leste cruzava o zodíaco no seu nascimento. Ele muda a cada duas horas, então saber a hora do nascimento deixa tudo mais preciso.',
    g1Lead: 'Mudam de signo em dias ou poucos meses. Como andam rápido, variam de pessoa para pessoa: é aqui que você é mais você.',
    g2Lead: 'Levam de um a dois anos e meio para mudar de signo. Falam do seu papel na sociedade e de onde a vida treina você.',
    g3Lead: 'Caminham devagar: de 7 a 30 anos por signo. Por isso quem nasceu na mesma época os compartilha, e o seu amigo costuma ter o mesmo Plutão que você.',
  },
  ko: {
    cta: '호시캐릭터 진단 시작하기!',
    heroNote: '가입 불필요 · 생년월일만 · 30초',
    howTo: '사용 방법',
    steps: [
      { t: '생년월일 입력', d: '닉네임과 생년월일만. 태어난 시각·장소는 선택(넣으면 더 자세히).' },
      { t: '당신의 호시캐릭터 판명', d: '태양과 달의 조합으로 16캐릭터 중 하나가 정해져요. 뒤에서는 10행성을 모두 계산하고 있어요.' },
      { t: '호시캐릭터에게 상담', d: '오늘의 운세와, 당신의 별을 전부 아는 호시캐릭터와의 채팅. 앞으로의 일도 물어보면 답해 줘요.' },
    ],
    charTitle: (n) => `「${n}」은 어떤 사람?`,
    charTitleSeo: (n) => `태양 별자리 × 달 별자리 ‘${n}’의 성격`,
    combosTitle: '이 조합에 해당하는 별자리',
    combosLead: (n, sw, mw) => `‘${n}’은 태양 별자리가 ${sw} 그룹, 달 별자리가 ${mw} 그룹인 사람이에요. 다음 9가지가 해당됩니다.`,
    comboItem: (ss, ms) => `태양 ${ss} × 달 ${ms}`,
    otherTitle: '다른 호시캐릭터',
    backToTop: '← 호시캐릭터 진단 홈으로',
    starsLink: '10행성과 12별자리 이야기',
    starsTitle: '10행성과 12별자리 이야기',
    starsLead: '진단 결과에 나오는 태양 별자리와 달 별자리, 그리고 당신을 이루는 10개의 별. 각자 무엇을 담당하는지 정리했어요.',
    pairTitle: '두 사람의 궁합 보기',
    pairLead: '상대의 생년월일만 있으면 됩니다. 태양 별자리와 달 별자리를 곱한 ‘호시캐릭터’끼리의 궁합이라, 잡지 별자리 운세보다 세밀하게 나와요.',
    pairPoints: [
      '상대의 생년월일만 넣으면 됩니다. 이름은 닉네임도 괜찮아요.',
      '궁합 %와 두 사람의 별칭(예: 명콤비)이 나와요. 조합은 16 × 16가지.',
      '‘오늘의 두 사람’과 두 사람 전용 상담실까지. 연애도 일도 물어볼 수 있어요.',
    ],
    pairCta: '두 사람의 궁합 보기',
    pairNote: '가입 불필요 · 두 사람의 생년월일만 · 1분',
    planetsTitle: '당신을 이루는 별들',
    planetsLead: '태어난 순간 각 별이 어느 별자리에 있었는지. 행성이 "누가"를, 별자리가 "어떤 식으로"를 나타내요. 상승궁까지 더해 모두 11캐릭터예요.',
    signsTitle: '12별자리와 4원소',
    signsLead: '별자리는 12가지. 불·흙·바람·물 네 원소로 나뉘며, 성질의 바탕이 돼요.',
    howReadTitle: '결과를 읽는 법',
    howReadLead: '행성이 "누가"를, 별자리가 "어떤 식으로"를 나타내요. 둘을 합치면 이런 한 문장이 돼요.',
    whoLabel: '행성 = 누가',
    howLabel: '별자리 = 어떤 식으로',
    sunNote: '잡지나 TV의 12별자리 운세에서 말하는 "당신의 별자리"가 바로 이 태양 별자리예요.',
    ascNote: '※ 상승궁은 행성이 아니라, 태어난 순간 동쪽 지평선과 만나던 지점이에요. 약 2시간마다 바뀌기 때문에 태어난 시각을 알면 더 정확해져요.',
    g1Lead: '며칠에서 두 달 정도면 다음 별자리로 옮겨 가요. 빠르게 움직이는 만큼 사람마다 달라서, 당신다움이 가장 잘 드러나는 곳이에요.',
    g2Lead: '1년에서 2년 반에 걸쳐 별자리를 옮겨요. 사회 속에서의 역할과, 단련되는 자리를 나타내요.',
    g3Lead: '7년에서 30년에 걸쳐 천천히 움직여요. 그래서 같은 시대에 태어난 사람과는 거의 같아요. 친구와 명왕성이 같은 건 이 때문이에요.',
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
