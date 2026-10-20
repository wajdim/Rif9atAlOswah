/* ======================================================================
   رِفقة الأُسوة — محاور الرسالة (Facets)
   ----------------------------------------------------------------------
   حين يذكر المستخدم أكثر من مجال من حياته صراحةً («التعامل مع زوجتي والأبناء في الغربة»)،
   يجمع المحرك المجالات بألفاظه هو (RAG.understand → facets)، ويرتّب COMPOSE الإجابة في فصول:
   فصل لكل محور (قراءته القرآنية النبوية، وآية وحديث من المكتبة الموثقة، وخطوات، وموقف من السيرة)،
   ثم ما يجمع بينها.
   - domains: المجال ← موضوعه في THEMES، ونوعه: relation (علاقة) أو setting (إطار يحيط بالباقي) أو issue.
   - byTheme / byRel: الموضوعات وأطراف العلاقة (RELATION_LEXICON) التي تدل على كل مجال.
   - link: كيف يتصل الإطار بالباقي · pair: سطر عملي لعلاقة داخل إطار (الغربة × الأبناء…).
   نصوص تأملية عملية فقط، بلا أي نص شرعي (النصوص تأتي من المكتبة بمعرّفاتها).
   ar / en (بقية اللغات: الإنجليزية إلى أن تُترجم).
   ====================================================================== */
var FACETS = {
  domains: {
    spouse:    {theme:"marriage", kind:"relation", ar:{name:"العلاقة الزوجية", phrase:"علاقتك بشريك حياتك"}, en:{name:"Your marriage", phrase:"your relationship with your spouse"}},
    children:  {theme:"parenting", kind:"relation", ar:{name:"الأبناء وتربيتهم", phrase:"تربية أبنائك ورعايتهم"}, en:{name:"Your children", phrase:"raising and caring for your children"}},
    parents:   {theme:"parents", kind:"relation", ar:{name:"الوالدان", phrase:"علاقتك بوالديك وبرّهما"}, en:{name:"Your parents", phrase:"your relationship with your parents"}},
    siblings:  {theme:"siblings", kind:"relation", ar:{name:"الإخوة", phrase:"علاقتك بإخوتك"}, en:{name:"Your siblings", phrase:"your relationship with your siblings"}},
    kin:       {theme:"kin", kind:"relation", ar:{name:"الأقارب وصلة الرحم", phrase:"صلتك بأقاربك"}, en:{name:"Your relatives", phrase:"your ties with your relatives"}},
    friends:   {theme:"friends", kind:"relation", ar:{name:"الأصدقاء", phrase:"صداقاتك"}, en:{name:"Your friends", phrase:"your friendships"}},
    neighbors: {theme:"neighbors", kind:"relation", ar:{name:"الجيران", phrase:"علاقتك بجيرانك"}, en:{name:"Your neighbours", phrase:"your relationship with your neighbours"}},
    seeking:   {theme:"marriage_seek", kind:"relation", ar:{name:"البحث عن الزواج", phrase:"رغبتك في الزواج"}, en:{name:"Seeking marriage", phrase:"your wish to marry"}},
    work:      {theme:"work", kind:"setting", ar:{name:"العمل", phrase:"عملك وما فيه من ضغوط وعلاقات"}, en:{name:"Your work", phrase:"your work, its pressures and relationships"}},
    money:     {theme:"rizq", kind:"setting", ar:{name:"الرزق والوضع المادي", phrase:"وضعك المادي ورزقك"}, en:{name:"Money and provision", phrase:"your finances and provision"}},
    health:    {theme:"illness", kind:"setting", ar:{name:"الصحة", phrase:"صحتك أو صحة من تحب"}, en:{name:"Health", phrase:"your health or the health of someone you love"}},
    study:     {theme:"study", kind:"setting", ar:{name:"الدراسة", phrase:"دراستك"}, en:{name:"Your studies", phrase:"your studies"}},
    ghurba:    {theme:"ghurba", kind:"setting", ar:{name:"الغربة", phrase:"حياتك في الغربة بعيدًا عن وطنك"}, en:{name:"Living abroad", phrase:"your life abroad, far from home"}},
    transition:{theme:"transition", kind:"setting", ar:{name:"مرحلة التغيير", phrase:"مرحلة التغيير التي تمر بها"}, en:{name:"A time of change", phrase:"the change you are going through"}},
    addiction: {theme:"addiction", kind:"issue", ar:{name:"الإدمان", phrase:"معركتك مع إدمان أو عادة تسيطر عليك"}, en:{name:"Addiction", phrase:"your struggle with an addiction or a habit that controls you"}},
    digital:   {theme:"digital", kind:"issue", ar:{name:"الشاشات والعالم الرقمي", phrase:"علاقتك بالهاتف والشاشات"}, en:{name:"Screens and the digital world", phrase:"your relationship with your phone and screens"}}
  },
  // أصول كل باب من المكتبة الموثقة (بمعرّفاتها)، تُقدَّم في فصل المحور قبل غيرها
  lead: {spouse:["q30-21","q4-19","h-khayrukum-ahlih","h-la-yafrak"], children:["q66-6","q31-13","h-kullukum-rai","h-adl-awlad"],
         parents:["q17-23","q46-15","h-rughm","h-rida-walid"], kin:["q47-22","q4-1","h-sila-rizq","h-mal"], siblings:["q12-100","h-adl-awlad"],
         friends:["q49-10","q43-67","h-khayr-ashab","h-jalis"], neighbors:["q4-36","h-maraqa","h-khayr-ashab"],
         work:["q28-26","q9-105","h-ajir","h-ihsan"], money:["q65-2","q2-280","h-tawakkul-tayr","h-ada-dayn"],
         health:["q26-80","q21-83","h-tadawaw","h-nasab"], ghurba:["q28-24","q9-40","h-tawakkul-tayr","h-sila-rizq"],
         study:["q39-9","q20-114","h-muamin-qawi"], seeking:["q30-21","q24-33","h-dhat-din","h-tardawna"]},
  // ألفاظ لا تكفي وحدها لإثبات المحور («قطيعة» مع صديق ليست صلة رحم، و«مال» أمانةٌ عند صديق ليس همّ الرزق)
  weak: {kin:["قطيعه","القطيعه","قاطعني","قطعني","هجرني"], money:["مال","المال","مالا","فلوس","الفلوس","money"], friends:["صاحب"]},
  byTheme: {marriage:"spouse", jealousy_spouse:"spouse", parenting:"children", parents:"parents", siblings:"siblings", kin:"kin",
            friends:"friends", neighbors:"neighbors", marriage_seek:"seeking", work:"work", leadership:"work",
            rizq:"money", debt:"money", poverty:"money", illness:"health", study:"study", ghurba:"ghurba",
            transition:"transition", addiction:"addiction", digital:"digital"},
  byRel: {spouse:"spouse", child:"children", parent:"parents", sibling:"siblings", relative:"kin", boss:"work", colleague:"work",
          friend:"friends", neighbor:"neighbors"},
  link: {
    ghurba:{ar:"والغربة هنا ليست محورًا منفصلًا، بل الإطار الذي يحيط بالباقي: فهي تقلّل من حولك من سند، وتضاعف حاجة من معك إليك، فيصير بيتك وطنكم الصغير.",
            en:"Living abroad is not a separate matter here but the frame around the rest: it leaves you with less support around you and makes those with you need you more, so your home becomes your small homeland."},
    work:{ar:"والعمل يتقاطع مع الباقي: ضغوطه وساعاته تأخذ من وقتك وطاقتك اللذين يحتاجهما غيره، وما يثقلك فيه قد ينعكس على من حولك.",
          en:"Your work cuts across the rest: its pressure and hours take time and energy the others need, and what weighs on you there can spill over onto those around you."},
    money:{ar:"والضيق المادي يلقي بظله على كل ما سواه: يجعل القلق أكبر والخلاف أسرع، وتدبيره بحكمة يخفف عن الجميع.",
           en:"Financial strain casts a shadow over everything else: it makes worry bigger and arguments quicker, and handling it wisely eases things for everyone."},
    health:{ar:"والصحة أساس يتأثر به كل ما سواه: حين يتعب الجسد يقلّ الصبر وتثقل المسؤوليات، فالعناية بها ليست أنانية بل حفظ للأمانة.",
            en:"Health is a foundation everything else rests on: when the body is tired, patience runs short and responsibilities feel heavier, so caring for it is not selfishness but keeping a trust."},
    study:{ar:"والدراسة تأخذ من وقتك وتركيزك، وتتأثر بما يحدث في بقية حياتك، فالتوازن بينها وبين غيرها جزء من الحل.",
           en:"Your studies take time and focus and are affected by what happens in the rest of your life, so balancing them with everything else is part of the answer."},
    transition:{ar:"وأنت في مرحلة تغيير، والتغيير يهزّ العلاقات والعادات معًا، فامنح نفسك ومن معك وقتًا للتكيّف.",
                en:"You are in a time of change, and change shakes relationships and habits at once, so give yourself and those with you time to adjust."},
    relations:{ar:"وهي علاقات متداخلة: ما يحدث في إحداها يمتد إلى الأخرى، وما تصلحه في واحدة يخفف عنك في البقية.",
               en:"These relationships are intertwined: what happens in one spills over into the others, and what you mend in one eases the rest."},
    other:{ar:"وهي محاور متصلة: ما يثقل أحدها يمتد إلى غيره، وما تصلحه في أحدها يخفف الآخر.",
           en:"These matters are connected: what weighs on one spreads to the others, and what you mend in one eases the rest."}
  },
  pair: {
    "ghurba|spouse":{ar:"في الغربة يصير كلٌّ من الزوجين أهلَ الآخر وسنده الأول؛ فاحرصا على وقت يومي بينكما، ولا تتركا ضغوط الإقامة والعمل تتحول إلى خلاف بينكما.",
                     en:"Abroad, each spouse becomes the other's family and first support; protect a daily time together, and do not let the pressures of residence and work turn into conflict between you."},
    "ghurba|children":{ar:"أبناؤك في الغربة يعيشون بين ثقافتين؛ فاجعل البيت مكانًا يحبون فيه دينهم ولغتهم بالقدوة والصحبة الطيبة، لا بالتخويف من المجتمع حولهم.",
                       en:"Your children abroad live between two cultures; make your home a place where they come to love their faith and language through example and good company, not through fear of the society around them."},
    "ghurba|parents":{ar:"بُعدك عن والديك لا يُسقط برّهما؛ فالاتصال المنتظم والسؤال عن حاجاتهما والدعاء لهما برٌّ تقدر عليه من بعيد.",
                      en:"Being far from your parents does not cancel your duty to honour them: regular calls, asking about their needs and praying for them are kindness you can show from afar."},
    "ghurba|work":{ar:"العمل في الغربة يحمل ضغطًا مضاعفًا من الأوراق واللغة والبعد؛ فرتّب أولوياتك واستشر من سبقك في البلد نفسه.",
                   en:"Working abroad brings double pressure from paperwork, language and distance; set your priorities and seek advice from those who came before you in the same country."},
    "work|spouse":{ar:"لا تجعل تعب العمل يأخذ كل طاقتك فلا يبقى لبيتك إلا آخرها؛ خصّص وقتًا لشريك حياتك لا يدخله العمل.",
                   en:"Don't let work take all your energy and leave your home only what's left; set aside time for your spouse that work does not enter."},
    "work|children":{ar:"أبناؤك يحتاجون حضورك أكثر من هداياك؛ ولو وقتًا قصيرًا ثابتًا كل يوم بلا هاتف ولا عمل.",
                     en:"Your children need your presence more than your gifts: even a short, fixed time each day without phone or work."},
    "work|parents":{ar:"انشغالك بالعمل لا يُغني عن برّ والديك؛ فاجعل لهما نصيبًا ثابتًا من وقتك ولو كان قليلًا.",
                    en:"Being busy at work is no substitute for honouring your parents; give them a fixed share of your time, even if small."},
    "money|spouse":{ar:"الضيق المادي يضغط على الزوجين معًا؛ فتشاورا في المال بصراحة وهدوء، واجعلا خطة الإنفاق قرارًا مشتركًا لا سببًا للّوم.",
                    en:"Money worries press on both spouses; talk about money openly and calmly, and make the budget a shared decision, not a reason for blame."},
    "money|children":{ar:"صارح أبناءك بقدر أعمارهم بأن الأسرة تمر بمرحلة تدبير؛ فذلك يعلّمهم القناعة والمسؤولية بدل أن يقلقوا دون أن يفهموا.",
                      en:"Tell your children, as suits their age, that the family is going through a careful time; it teaches them contentment and responsibility instead of leaving them anxious without understanding."},
    "health|spouse":{ar:"المرض يغيّر الأدوار داخل البيت؛ فتكلّما بصراحة عما يحتاجه كل منكما، ولا يحمل أحدكما العبء وحده.",
                     en:"Illness changes roles at home; talk openly about what each of you needs, and don't let one of you carry the load alone."},
    "health|children":{ar:"اشرح لأبنائك ما يحدث بكلمات بسيطة صادقة تناسب أعمارهم؛ فالصمت يتركهم لخيالهم ومخاوفهم.",
                       en:"Explain what is happening to your children in simple, honest words suited to their age; silence leaves them to their imagination and fears."},
    "health|parents":{ar:"رعاية والد مريض برٌّ عظيم، لكنها تحتاج عونًا وتقسيمًا للأعباء مع غيرك حتى لا تُنهَك فتعجز.",
                      en:"Caring for a sick parent is great kindness, but it needs help and a sharing of the load with others so that you do not burn out."},
    "health|work":{ar:"لا تحمّل جسدك فوق طاقته من أجل العمل؛ فحفظ الصحة من الأمانة، ومعرفة حدودك تحفظ عملك على المدى البعيد.",
                   en:"Do not push your body beyond its strength for work; keeping your health is part of the trust, and knowing your limits protects your work in the long run."}
  },
  text: {
    ar:{count:{2:"محورين مترابطين", 3:"ثلاثة محاور مترابطة", 4:"أربعة محاور مترابطة"}, intro:"فهمتُ من كلامك {0}: {1}.",
        sep:"، ", last:"، و", two:" و", order:"لذلك رتّبتُ لك الإجابة في فصول: فصل لكل محور بقراءته وأدلته وخطواته، ثم ما يجمع بينها."},
    en:{count:{2:"two connected matters", 3:"three connected matters", 4:"four connected matters"}, intro:"From what you wrote, I understood {0}: {1}.",
        sep:", ", last:", and ", two:" and ", order:"So I have organised the answer in chapters: one for each matter, with its reading, evidence and steps, then what ties them together."}
  }
};
