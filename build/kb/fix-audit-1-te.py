# Translations of the 4 texts changed by fix-audit-1.py (English in build/i18n/content, others in build/i18n/<lang>/te-*.tsv).
import io, os, json, glob
H = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "i18n")
T = {
 "lib:h-barrakt": {
  "en": "Why would one of you kill his brother? Why did you not invoke blessing?",
  "fr": "Pourquoi l'un de vous tuerait-il son frère ? Pourquoi n'as-tu pas invoqué la bénédiction ?",
  "nl": "Waarom zou een van jullie zijn broeder doden? Waarom heb je geen zegen gevraagd?",
  "es": "¿Por qué ha de matar uno de vosotros a su hermano? ¿Por qué no pediste la bendición?",
  "pt": "Porque haveria um de vós de matar o seu irmão? Porque não invocaste a bênção?",
  "ur": "تم میں سے کوئی اپنے بھائی کو کیوں قتل کرتا ہے؟ تم نے برکت کی دعا کیوں نہ کی؟",
  "id": "Mengapa salah seorang dari kalian membunuh saudaranya? Mengapa engkau tidak mendoakan keberkahan?",
  "tr": "Biriniz kardeşini neden öldürür? Bereket duası etseydin ya!",
  "de": "Warum sollte einer von euch seinen Bruder töten? Warum hast du nicht um Segen gebeten?",
  "ms": "Mengapa salah seorang daripada kamu membunuh saudaranya? Mengapa engkau tidak mendoakan keberkatan?",
  "fa": "چرا یکی از شما برادرش را می‌کشد؟ چرا دعای برکت نکردی؟",
  "bn": "তোমাদের কেউ কেন তার ভাইকে হত্যা করবে? তুমি কেন বরকতের দোয়া করলে না?"},
 "sit:khidmat-anas:0": {
  "en": "Anas ibn Malik said: I served the Prophet ﷺ for ten years, and he never said to me “uff”, nor “Why did you do it?”, nor “Why did you not do it?”",
  "fr": "Anas ibn Mâlik dit : J'ai servi le Prophète ﷺ dix ans, et il ne m'a jamais dit « fi ! », ni « Pourquoi l'as-tu fait ? », ni « Pourquoi ne l'as-tu pas fait ? »",
  "nl": "Anas ibn Malik zei: Ik heb de Profeet ﷺ tien jaar gediend, en hij zei nooit „foei” tegen mij, noch „Waarom heb je dat gedaan?”, noch „Waarom heb je dat niet gedaan?”",
  "es": "Anas ibn Málik dijo: Serví al Profeta ﷺ diez años, y nunca me dijo «uf», ni «¿Por qué lo hiciste?», ni «¿Por qué no lo hiciste?»",
  "pt": "Anas ibn Málik disse: Servi o Profeta ﷺ durante dez anos, e ele nunca me disse «uf», nem «Porque o fizeste?», nem «Porque não o fizeste?»",
  "ur": "انس بن مالکؓ نے کہا: میں نے دس سال نبی ﷺ کی خدمت کی، آپ نے مجھے کبھی اُف تک نہ کہا، نہ یہ کہ تم نے یہ کیوں کیا، نہ یہ کہ تم نے یہ کیوں نہ کیا۔",
  "id": "Anas bin Malik berkata: Aku melayani Nabi ﷺ selama sepuluh tahun, dan beliau tidak pernah berkata kepadaku “ah”, tidak pula “Mengapa engkau melakukannya?”, dan tidak pula “Mengapa engkau tidak melakukannya?”",
  "tr": "Enes b. Mâlik dedi ki: Peygamber'e ﷺ on yıl hizmet ettim; bana bir kez bile “öf” demedi, “Bunu niçin yaptın?” ya da “Bunu niçin yapmadın?” demedi.",
  "de": "Anas ibn Malik sagte: Ich habe dem Propheten ﷺ zehn Jahre gedient, und er sagte nie „Pfui“ zu mir, noch „Warum hast du das getan?“, noch „Warum hast du das nicht getan?“",
  "ms": "Anas bin Malik berkata: Aku berkhidmat kepada Nabi ﷺ selama sepuluh tahun, dan baginda tidak pernah berkata kepadaku “ah”, tidak juga “Mengapa engkau melakukannya?” dan tidak juga “Mengapa engkau tidak melakukannya?”",
  "fa": "انس بن مالک گفت: ده سال به پیامبر ﷺ خدمت کردم، و هرگز به من «اُف» نگفت، و نه «چرا این کار را کردی؟» و نه «چرا این کار را نکردی؟»",
  "bn": "আনাস ইবনে মালিক বলেন: আমি দশ বছর নবী ﷺ-এর খেদমত করেছি; তিনি কখনো আমাকে ‘উফ’ বলেননি, ‘কেন এটা করলে?’ বা ‘কেন এটা করলে না?’ও বলেননি।"},
 "sit:hudaybiyyah:0": {
  "en": "Summary of the narration: ‘Umar ibn al-Khattab said: I went to the Prophet ﷺ and said: Are you not truly the Prophet of Allah? He said: “Yes.” I said: Then why should we accept humiliation in our religion? He said: “I am the Messenger of Allah; I do not disobey Him, and He is my helper.” Then he went to Abu Bakr and said the same, and Abu Bakr said: He is the Messenger of Allah ﷺ; he does not disobey his Lord, and He is his helper, so hold fast to him.",
  "fr": "Résumé du récit : 'Umar ibn al-Khattâb dit : Je suis allé voir le Prophète ﷺ et j'ai dit : N'es-tu pas vraiment le Prophète d'Allah ? Il dit : « Si. » J'ai dit : Pourquoi alors accepter l'humiliation dans notre religion ? Il dit : « Je suis le Messager d'Allah, je ne Lui désobéis pas, et Il est mon soutien. » Puis il alla voir Abû Bakr et lui dit la même chose ; Abû Bakr répondit : Il est le Messager d'Allah ﷺ, il ne désobéit pas à son Seigneur, et Il est son soutien ; tiens-toi donc fermement à lui.",
  "nl": "Samenvatting van de overlevering: ‘Umar ibn al-Khattab zei: Ik ging naar de Profeet ﷺ en zei: Bent u niet werkelijk de Profeet van Allah? Hij zei: „Jazeker.” Ik zei: Waarom zouden we dan vernedering in onze religie aanvaarden? Hij zei: „Ik ben de Boodschapper van Allah; ik ben Hem niet ongehoorzaam, en Hij is mijn helper.” Daarna ging hij naar Abu Bakr en zei hetzelfde, en Abu Bakr zei: Hij is de Boodschapper van Allah ﷺ; hij is zijn Heer niet ongehoorzaam, en Hij is zijn helper, dus houd je stevig aan hem vast.",
  "es": "Resumen del relato: ‘Umar ibn al-Jattab dijo: Fui al Profeta ﷺ y le dije: ¿No eres en verdad el Profeta de Allah? Dijo: «Sí». Dije: ¿Por qué entonces aceptar la humillación en nuestra religión? Dijo: «Soy el Mensajero de Allah; no Le desobedezco, y Él es mi auxilio». Luego fue a Abu Bakr y le dijo lo mismo, y Abu Bakr respondió: Él es el Mensajero de Allah ﷺ; no desobedece a su Señor, y Él es su auxilio; así que aférrate a él.",
  "pt": "Resumo do relato: ‘Umar ibn al-Khattab disse: Fui ter com o Profeta ﷺ e disse: Não és verdadeiramente o Profeta de Allah? Ele disse: «Sim.» Eu disse: Então porque havemos de aceitar a humilhação na nossa religião? Ele disse: «Sou o Mensageiro de Allah; não Lhe desobedeço, e Ele é o meu auxílio.» Depois foi ter com Abu Bakr e disse-lhe o mesmo, e Abu Bakr respondeu: Ele é o Mensageiro de Allah ﷺ; não desobedece ao seu Senhor, e Ele é o seu auxílio; agarra-te, pois, a ele.",
  "ur": "روایت کا خلاصہ: عمر بن خطابؓ نے کہا: میں نبی ﷺ کے پاس آیا اور کہا: کیا آپ واقعی اللہ کے نبی نہیں؟ آپ نے فرمایا: کیوں نہیں۔ میں نے کہا: تو پھر ہم اپنے دین میں ذلت کیوں قبول کریں؟ آپ نے فرمایا: میں اللہ کا رسول ہوں، اس کی نافرمانی نہیں کرتا، اور وہی میرا مددگار ہے۔ پھر وہ ابوبکرؓ کے پاس گئے اور یہی کہا، تو ابوبکرؓ نے کہا: وہ اللہ کے رسول ﷺ ہیں، اپنے رب کی نافرمانی نہیں کرتے، اور وہی ان کا مددگار ہے، پس ان کے دامن کو مضبوطی سے تھامے رہو۔",
  "id": "Ringkasan riwayat: ‘Umar bin al-Khaththab berkata: Aku mendatangi Nabi ﷺ lalu berkata: Bukankah engkau benar-benar Nabi Allah? Beliau menjawab: “Benar.” Aku berkata: Lalu mengapa kita menerima kehinaan dalam agama kita? Beliau menjawab: “Aku adalah Rasul Allah; aku tidak mendurhakai-Nya, dan Dia adalah penolongku.” Kemudian ia mendatangi Abu Bakar dan mengatakan hal yang sama, lalu Abu Bakar berkata: Beliau adalah Rasul Allah ﷺ; beliau tidak mendurhakai Rabbnya, dan Dia adalah penolongnya, maka berpeganglah erat kepadanya.",
  "tr": "Rivayetin özeti: Ömer b. Hattâb dedi ki: Peygamber'e ﷺ gidip: Sen gerçekten Allah'ın Peygamberi değil misin? dedim. “Evet” dedi. Öyleyse dinimizde neden zillete razı oluyoruz? dedim. “Ben Allah'ın Resûlüyüm; O'na isyan etmem, O da bana yardım edendir” dedi. Sonra Ebû Bekir'e gidip aynısını söyledi; Ebû Bekir de: O, Allah'ın Resûlüdür ﷺ; Rabbine isyan etmez, O da ona yardım edendir; öyleyse ona sımsıkı tutun, dedi.",
  "de": "Zusammenfassung der Überlieferung: ‘Umar ibn al-Khattab sagte: Ich ging zum Propheten ﷺ und sagte: Bist du nicht wahrhaftig der Prophet Allahs? Er sagte: „Doch.“ Ich sagte: Warum sollen wir dann Erniedrigung in unserer Religion hinnehmen? Er sagte: „Ich bin der Gesandte Allahs; ich widersetze mich Ihm nicht, und Er ist mein Helfer.“ Dann ging er zu Abu Bakr und sagte dasselbe, und Abu Bakr sagte: Er ist der Gesandte Allahs ﷺ; er widersetzt sich seinem Herrn nicht, und Er ist sein Helfer; also halte dich fest an ihn.",
  "ms": "Ringkasan riwayat: ‘Umar bin al-Khattab berkata: Aku datang kepada Nabi ﷺ lalu berkata: Bukankah engkau benar-benar Nabi Allah? Baginda menjawab: “Ya.” Aku berkata: Jadi mengapa kita menerima kehinaan dalam agama kita? Baginda menjawab: “Aku Rasul Allah; aku tidak menderhakai-Nya, dan Dialah penolongku.” Kemudian dia pergi kepada Abu Bakar dan berkata perkara yang sama, lalu Abu Bakar berkata: Baginda ialah Rasul Allah ﷺ; baginda tidak menderhakai Tuhannya, dan Dialah penolongnya, maka berpeganglah teguh kepadanya.",
  "fa": "خلاصهٔ روایت: عمر بن خطاب گفت: نزد پیامبر ﷺ رفتم و گفتم: آیا براستی پیامبر خدا نیستی؟ فرمود: «چرا.» گفتم: پس چرا در دینمان خواری را بپذیریم؟ فرمود: «من فرستادهٔ خدایم، از او نافرمانی نمی‌کنم و او یاور من است.» سپس نزد ابوبکر رفت و همین را گفت، و ابوبکر گفت: او فرستادهٔ خدا ﷺ است، از پروردگارش نافرمانی نمی‌کند و او یاور اوست؛ پس به او محکم بچسب.",
  "bn": "বর্ণনার সারসংক্ষেপ: উমর ইবনুল খাত্তাব বলেন: আমি নবী ﷺ-এর কাছে গিয়ে বললাম: আপনি কি সত্যিই আল্লাহর নবী নন? তিনি বললেন: ‘অবশ্যই।’ আমি বললাম: তাহলে আমরা আমাদের দীনে অপমান কেন মেনে নেব? তিনি বললেন: ‘আমি আল্লাহর রাসূল; আমি তাঁর অবাধ্য হই না, আর তিনিই আমার সাহায্যকারী।’ এরপর তিনি আবু বকরের কাছে গিয়ে একই কথা বললেন; আবু বকর বললেন: তিনি আল্লাহর রাসূল ﷺ; তিনি তাঁর রবের অবাধ্য হন না, আর তিনিই তাঁর সাহায্যকারী; অতএব তাঁকে দৃঢ়ভাবে আঁকড়ে ধরো।"},
 "sit:al-ifk:0": {
  "en": "Summary of the narration: the people of the slander spoke against ‘A'ishah, and the Prophet ﷺ stayed a month without revelation about her, passing no judgement. Then he said to her: “If you are innocent, Allah will declare your innocence; and if you have slipped into a sin, ask Allah's forgiveness and repent to Him,” until Allah revealed her innocence.",
  "fr": "Résumé du récit : les gens de la calomnie parlèrent contre 'Â'icha, et le Prophète ﷺ resta un mois sans révélation à son sujet, sans rien juger. Puis il lui dit : « Si tu es innocente, Allah proclamera ton innocence ; et si tu as commis une faute, demande pardon à Allah et repens-toi auprès de Lui », jusqu'à ce qu'Allah révèle son innocence.",
  "nl": "Samenvatting van de overlevering: de lasteraars spraken over ‘A'isha, en de Profeet ﷺ bleef een maand zonder openbaring over haar, zonder een oordeel te vellen. Daarna zei hij tegen haar: „Als je onschuldig bent, zal Allah je onschuld bekendmaken; en als je in een zonde bent vervallen, vraag Allah dan om vergeving en keer berouwvol tot Hem terug,” totdat Allah haar onschuld openbaarde.",
  "es": "Resumen del relato: los de la calumnia hablaron contra ‘Aisha, y el Profeta ﷺ estuvo un mes sin revelación sobre ella, sin emitir juicio. Luego le dijo: «Si eres inocente, Allah proclamará tu inocencia; y si has caído en un pecado, pide perdón a Allah y arrepiéntete ante Él», hasta que Allah reveló su inocencia.",
  "pt": "Resumo do relato: os caluniadores falaram contra ‘Aisha, e o Profeta ﷺ ficou um mês sem revelação sobre ela, sem emitir juízo. Depois disse-lhe: «Se estás inocente, Allah proclamará a tua inocência; e se caíste num pecado, pede perdão a Allah e arrepende-te perante Ele», até que Allah revelou a sua inocência.",
  "ur": "روایت کا خلاصہ: تہمت لگانے والوں نے عائشہؓ کے بارے میں باتیں کیں، اور نبی ﷺ ایک مہینہ تک ان کے معاملے میں وحی کے بغیر رہے اور کوئی فیصلہ نہ کیا۔ پھر آپ نے ان سے فرمایا: اگر تم بری ہو تو اللہ تمہاری براءت ظاہر فرما دے گا، اور اگر تم سے کوئی گناہ ہو گیا ہے تو اللہ سے مغفرت مانگو اور اس کی طرف توبہ کرو، یہاں تک کہ اللہ نے ان کی براءت نازل فرمائی۔",
  "id": "Ringkasan riwayat: para penyebar fitnah membicarakan ‘Aisyah, dan Nabi ﷺ tinggal sebulan tanpa wahyu tentangnya, tidak menjatuhkan putusan. Kemudian beliau berkata kepadanya: “Jika engkau tidak bersalah, Allah akan menyatakan kebersihanmu; dan jika engkau terjatuh dalam dosa, mohonlah ampun kepada Allah dan bertaubatlah kepada-Nya,” hingga Allah menurunkan pernyataan kebersihannya.",
  "tr": "Rivayetin özeti: İftiracılar Âişe hakkında konuştular; Peygamber ﷺ onun hakkında bir ay vahiy almadan bekledi ve hüküm vermedi. Sonra ona: “Eğer suçsuzsan Allah seni temize çıkaracaktır; eğer bir günaha düştüysen Allah'tan bağışlanma dile ve O'na tövbe et” dedi; nihayet Allah onun suçsuzluğunu indirdi.",
  "de": "Zusammenfassung der Überlieferung: Die Verleumder sprachen über ‘A'ischa, und der Prophet ﷺ blieb einen Monat ohne Offenbarung über sie und fällte kein Urteil. Dann sagte er zu ihr: „Wenn du unschuldig bist, wird Allah deine Unschuld erklären; und wenn du in eine Sünde geraten bist, bitte Allah um Vergebung und wende dich reuig zu Ihm“, bis Allah ihre Unschuld offenbarte.",
  "ms": "Ringkasan riwayat: para penyebar fitnah bercakap tentang ‘Aisyah, dan Nabi ﷺ tinggal sebulan tanpa wahyu tentangnya, tanpa membuat sebarang keputusan. Kemudian baginda berkata kepadanya: “Jika engkau tidak bersalah, Allah akan menyatakan kebersihanmu; dan jika engkau terjebak dalam dosa, mohonlah ampun kepada Allah dan bertaubatlah kepada-Nya,” sehingga Allah menurunkan kebersihannya.",
  "fa": "خلاصهٔ روایت: تهمت‌زنندگان دربارهٔ عایشه سخن گفتند، و پیامبر ﷺ یک ماه بی‌آنکه دربارهٔ او وحی برسد ماند و حکمی نکرد. سپس به او فرمود: «اگر بی‌گناهی، خدا تو را تبرئه خواهد کرد؛ و اگر به گناهی آلوده شده‌ای، از خدا آمرزش بخواه و به سوی او توبه کن»، تا آنکه خداوند برائت او را نازل کرد.",
  "bn": "বর্ণনার সারসংক্ষেপ: অপবাদকারীরা আয়েশা সম্পর্কে কথা বলল, আর নবী ﷺ তাঁর বিষয়ে কোনো ওহি ছাড়াই এক মাস কাটালেন, কোনো রায় দিলেন না। এরপর তিনি তাঁকে বললেন: ‘তুমি যদি নির্দোষ হও, আল্লাহ তোমার নির্দোষিতা ঘোষণা করবেন; আর যদি কোনো গুনাহে জড়িয়ে থাকো, আল্লাহর কাছে ক্ষমা চাও ও তাঁর দিকে তওবা করো’— অবশেষে আল্লাহ তাঁর নির্দোষিতা নাজিল করলেন।"}
}
# English: content/hadith-te-*.json
for f in sorted(glob.glob(os.path.join(H, "content", "hadith-te-*.json"))):
    d = json.load(io.open(f, encoding="utf-8")); ch = False
    for k in T:
        if k in d.get("te", {}): d["te"][k] = T[k]["en"]; ch = True
    if ch: json.dump(d, io.open(f, "w", encoding="utf-8"), ensure_ascii=False, indent=1); print("en", os.path.basename(f))
# other languages: <lang>/te-*.tsv
for lang in ["fr", "nl", "es", "pt", "ur", "id", "tr", "de", "ms", "fa", "bn"]:
    n = 0
    for f in sorted(glob.glob(os.path.join(H, lang, "te-*.tsv"))):
        lines = io.open(f, encoding="utf-8").read().split("\n"); ch = False
        for i, line in enumerate(lines):
            k = line.split("\t", 1)[0]
            if k in T and lang in T[k]: lines[i] = k + "\t" + T[k][lang]; ch = True; n += 1
        if ch: io.open(f, "w", encoding="utf-8", newline="").write("\n".join(lines))
    print(lang, n)
