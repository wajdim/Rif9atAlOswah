# رِفقة الأُسوة — نصوص صفحة المتجر (Google Play) بثلاث لغات، بصيغة fastlane supply.
# الاستخدام: python build/play/listing-text.py   (يكتب listing/<locale>/*.txt ويتحقق من حدود الطول)
import io, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
VERSION_CODE = 9
LIMITS = {"title.txt": 30, "short_description.txt": 80, "full_description.txt": 4000, "changelogs/%d.txt" % VERSION_CODE: 500}

L = {}

L["en-US"] = {
"title.txt": "Rifqat al-Uswa: Quran & Sunnah",
"short_description.txt": "Describe what you're going through; read it in the light of Quran and Sunnah.",
"full_description.txt": """Rifqat al-Uswa ("in the company of the best example") is a quiet, reflective companion. Describe in your own words what you are going through — a conflict, a loss, worry, guilt, a hard decision — and the app reads it with you in the light of the Noble Quran, the Prophetic Sunnah and the Seerah.

HOW IT WORKS
• Write freely, in Arabic, English or Dutch, in as much detail as you like.
• The app recognises the themes, feelings and relationships in what you wrote.
• It brings you the closest situation from the life of the Prophet ﷺ and the prophets before him — what happened, how he responded, the principles behind it, and how they apply today.
• You get the relevant verses, hadith and supplications, each with its source and grade, plus practical steps and what to avoid.

WHAT'S INSIDE
• 115 Prophetic situations and stories, 57 life topics.
• 201 verses and passages and 149 hadith and supplications, with sources and authenticity grades.
• A searchable library of every text the analysis relies on.
• Read-aloud with Arabic, English and Dutch voices, and recitations of the verses by well-known reciters (internet needed for recitations).
• Light and dark themes, adjustable font size, optional Arabic diacritics for the explanations.

TRUSTWORTHY BY DESIGN
• The app never invents verses or hadith: every text comes unchanged from its curated library.
• The Arabic text is always shown. English meanings of the Quran: Saheeh International. Dutch meanings: Sofian S. Siregar (both via Tanzil.net). English hadith: sunnah.com translations. The Dutch hadith translations were prepared for this app from the sunnah.com English and are marked as such; the Arabic remains the reference.
• Weak or historical reports are labelled clearly.

PRIVATE AND OFFLINE
• No account, no ads, no analytics, no tracking.
• Everything works offline; what you write stays on your device.
• Optional: add your own Claude (Anthropic) API key to get an extra AI-written reflection that is restricted to the retrieved texts. Only then is your text sent — directly to Anthropic, never to the developer. Every AI answer can be reported from inside the app.

IMPORTANT
Rifqat al-Uswa is a reflective guide. It does not issue fatwas and is not a substitute for a qualified scholar, doctor, therapist or lawyer. If you describe a situation involving danger, violence or thoughts of self-harm, the app points you to urgent help first.

Available in العربية, English and Nederlands. Feedback is welcome: wajdi.chaouche@gmail.com""",
"changelogs/%d.txt" % VERSION_CODE: """• Now in three languages: Arabic, English and Dutch
• Male and female voice options for reading aloud
• Redesigned settings with Cancel and Save
• Report any AI answer from inside the app
• Built for Android 16, with edge-to-edge display and predictive back""",
}

L["ar"] = {
"title.txt": "رفقة الأسوة: هدي القرآن والسنة",
"short_description.txt": "اكتب ما تمرّ به، واقرأه في ضوء القرآن والسنة والسيرة بمصادر موثقة.",
"full_description.txt": """«رِفقة الأُسوة» رفيق تأملي هادئ: صف بكلماتك ما تمرّ به — خلافًا أو فقدًا أو همًّا أو ذنبًا أو قرارًا صعبًا — ويقرؤه التطبيق معك في ضوء القرآن الكريم والسنة النبوية والسيرة.

كيف يعمل؟
• اكتب بحرية، بالعربية الفصحى أو العامية، أو بالإنجليزية أو الهولندية، وبالتفصيل الذي تريد.
• يتعرّف التطبيق على الموضوعات والمشاعر والعلاقات فيما كتبت.
• ويأتيك بأقرب موقف من سيرة النبي ﷺ والأنبياء قبله: ماذا حدث، وكيف تعامل معه، والمبادئ المستفادة، وكيف تنطبق اليوم.
• مع الآيات والأحاديث والأدعية المتصلة بحالتك، لكل نص مصدره ودرجته، وخطوات عملية وما ينبغي تجنّبه.

ماذا يحتوي؟
• 115 موقفًا وقصة نبوية، و57 موضوعًا حياتيًا.
• 201 آية ومقطع، و149 حديثًا وذكرًا، بمصادرها ودرجات صحتها.
• مكتبة قابلة للبحث فيها كل النصوص التي يعتمد عليها التحليل.
• قراءة صوتية بأصوات عربية وإنجليزية وهولندية، وتلاوة الآيات بأصوات كبار القراء (التلاوة تحتاج إنترنت).
• مظهر فاتح وداكن، وحجم خط قابل للتعديل، وتشكيل اختياري للنصوص الشارحة.

أمانة علمية
• لا يولّد التطبيق آيات ولا أحاديث؛ كل نص مأخوذ من مكتبته كما هو.
• النص العربي يُعرض دائمًا، والآيات مشكولة من مصحف Tanzil.
• الروايات الضعيفة أو التاريخية موسومة بوضوح.

خصوصية وعمل بلا إنترنت
• بلا حساب، وبلا إعلانات، وبلا تتبّع أو تحليلات.
• يعمل كاملًا بلا إنترنت، وما تكتبه يبقى على جهازك.
• اختياري: أضف مفتاح Claude (Anthropic) الخاص بك لتحصل على تأمل إضافي يكتبه الذكاء الاصطناعي مقيّدًا بالنصوص المسترجعة. عندها فقط يُرسل نصك، مباشرة إلى Anthropic لا إلى المطوّر. ويمكنك الإبلاغ عن أي إجابة من داخل التطبيق.

تنبيه
«رِفقة الأُسوة» دليل تأملي لا يُصدر فتاوى، وليس بديلًا عن عالم مؤهل أو طبيب أو مختص نفسي أو محامٍ. وإذا وصفت موقفًا فيه خطر أو عنف أو أفكار إيذاء النفس، يوجّهك التطبيق أولًا إلى المساعدة العاجلة.

متوفر بالعربية والإنجليزية والهولندية. نرحّب بملاحظاتك: wajdi.chaouche@gmail.com""",
"changelogs/%d.txt" % VERSION_CODE: """• ثلاث لغات: العربية والإنجليزية والهولندية
• خيار صوت رجالي أو نسائي للقراءة الصوتية
• إعدادات مُعاد تنظيمها مع زرّي إلغاء وحفظ
• الإبلاغ عن أي إجابة للذكاء الاصطناعي من داخل التطبيق
• مُهيّأ لأندرويد 16: عرض من الحافة إلى الحافة والرجوع التنبؤي""",
}

L["nl-NL"] = {
"title.txt": "Rifqat al-Uswa: Koran & Soenna",
"short_description.txt": "Beschrijf wat je doormaakt en lees het in het licht van de Koran en de Soenna.",
"full_description.txt": """Rifqat al-Uswa ("in het gezelschap van het beste voorbeeld") is een rustige metgezel voor bezinning. Beschrijf in je eigen woorden wat je doormaakt — een conflict, een verlies, zorgen, schuldgevoel, een moeilijke beslissing — en de app leest het samen met je in het licht van de Edele Koran, de Profetische Soenna en de Sira.

HOE HET WERKT
• Schrijf vrij, in het Nederlands, Engels of Arabisch, zo uitgebreid als je wilt.
• De app herkent de onderwerpen, gevoelens en relaties in wat je schreef.
• Je krijgt de meest verwante situatie uit het leven van de Profeet ﷺ en de profeten vóór hem: wat er gebeurde, hoe hij reageerde, de principes erachter en hoe die vandaag gelden.
• Met de bijbehorende verzen, hadith en smeekbeden, elk met bron en graad, plus praktische stappen en wat je beter kunt vermijden.

WAT ER IN ZIT
• 115 Profetische situaties en verhalen, 57 levensonderwerpen.
• 201 verzen en passages en 149 hadith en smeekbeden, met bronnen en betrouwbaarheidsgraad.
• Een doorzoekbare bibliotheek met elke tekst waarop de analyse steunt.
• Voorlezen met Nederlandse, Engelse en Arabische stemmen (mannen- of vrouwenstem), en recitatie van de verzen door bekende recitatoren (internet nodig voor recitaties).
• Lichte en donkere weergave en instelbare lettergrootte.

BETROUWBAAR
• De app verzint nooit verzen of hadith: elke tekst komt ongewijzigd uit de samengestelde bibliotheek.
• De Arabische tekst wordt altijd getoond. Nederlandse betekenissen van de Koran: Sofian S. Siregar (via Tanzil.net). De Nederlandse vertalingen van de hadith zijn voor deze app gemaakt op basis van de Engelse vertalingen van sunnah.com en zijn als zodanig gemarkeerd; het Arabisch blijft de maatstaf.
• Zwakke of historische overleveringen zijn duidelijk aangegeven.

PRIVÉ EN OFFLINE
• Geen account, geen advertenties, geen analyse, geen tracking.
• Alles werkt offline; wat je schrijft blijft op je apparaat.
• Optioneel: voeg je eigen Claude (Anthropic) API-sleutel toe voor een extra bezinning door AI, beperkt tot de opgehaalde teksten. Alleen dan wordt je tekst verstuurd — rechtstreeks naar Anthropic, nooit naar de ontwikkelaar. Elk AI-antwoord kun je vanuit de app melden.

BELANGRIJK
Rifqat al-Uswa is een gids voor bezinning. De app geeft geen fatwa's en vervangt geen bekwame geleerde, arts, therapeut of advocaat. Beschrijf je een situatie met gevaar, geweld of gedachten aan zelfbeschadiging, dan wijst de app je eerst op dringende hulp (zoals 113 Zelfmoordpreventie).

Beschikbaar in het Nederlands, Engels en Arabisch. Feedback is welkom: wajdi.chaouche@gmail.com""",
"changelogs/%d.txt" % VERSION_CODE: """• Nu in drie talen: Nederlands, Engels en Arabisch
• Keuze tussen mannen- en vrouwenstem bij het voorlezen
• Vernieuwde instellingen met Annuleren en Bewaren
• Meld elk AI-antwoord vanuit de app
• Gemaakt voor Android 16, met weergave tot de rand en voorspellend terug""",
}

ok = True
for loc, files in L.items():
    for name, text in files.items():
        p = os.path.join(HERE, "listing", loc, name)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        io.open(p, "w", encoding="utf-8", newline="\n").write(text.strip() + "\n")
        n = len(text.strip())
        lim = LIMITS[name]
        flag = "OK " if n <= lim else "TOO LONG"
        if n > lim: ok = False
        print("%-6s %-26s %4d / %-4d %s" % (loc, name, n, lim, flag))
sys.exit(0 if ok else 1)
