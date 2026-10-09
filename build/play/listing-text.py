# رِفقة الأُسوة — نصوص صفحة المتجر (Google Play) بخمس لغات، بصيغة fastlane supply.
# الاستخدام: python build/play/listing-text.py   (يكتب listing/<locale>/*.txt ويتحقق من حدود الطول)
import io, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
VERSION_CODE = 10
CL = "changelogs/%d.txt" % VERSION_CODE
LIMITS = {"title.txt": 30, "short_description.txt": 80, "full_description.txt": 4000, CL: 500}

L = {}

L["en-US"] = {
"title.txt": "Rifqat al-Uswa: Quran & Sunnah",
"short_description.txt": "Describe what you're going through; read it in the light of Quran and Sunnah.",
"full_description.txt": """Rifqat al-Uswa ("in the company of the best example") is a quiet, reflective companion. Describe in your own words what you are going through — a conflict, a loss, worry, guilt, a hard decision — and the app reads it with you in the light of the Noble Quran, the Prophetic Sunnah and the Seerah.

HOW IT WORKS
• Write freely, in Arabic, English, Dutch, Spanish or Portuguese, in as much detail as you like.
• The app recognises the themes, feelings and relationships in what you wrote.
• It brings you the closest situation from the life of the Prophet ﷺ and the prophets before him — what happened, how he responded, the principles behind it, and how they apply today.
• You get the relevant verses, hadith and supplications, each with its source and grade, plus practical steps and what to avoid.

WHAT'S INSIDE
• 115 Prophetic situations and stories, 57 life topics.
• 201 verses and passages and 149 hadith and supplications, with sources and authenticity grades.
• A searchable library of every text the analysis relies on.
• Read-aloud in five languages with male or female voices, and recitation of the verses by 26 well-known reciters.
• Download your favourite reciter once and listen to the recitations without internet.
• Light and dark themes, adjustable font size, optional Arabic diacritics for the explanations.

TRUSTWORTHY BY DESIGN
• The app never invents verses or hadith: every text comes unchanged from its curated library.
• The Arabic text is always shown. Meanings of the Quran via Tanzil.net: Saheeh International (English), Sofian S. Siregar (Dutch), Julio Cortés (Spanish), Samir El-Hayek (Portuguese). English hadith: sunnah.com translations. The Dutch, Spanish and Portuguese hadith translations were prepared for this app from the sunnah.com English and are marked as such; the Arabic remains the reference.
• Weak or historical reports are labelled clearly.

PRIVATE AND OFFLINE
• No account, no ads, no analytics, no tracking.
• Everything works offline; what you write stays on your device.
• Optional: add your own Claude (Anthropic) API key to get an extra AI-written reflection that is restricted to the retrieved texts. Only then is your text sent — directly to Anthropic, never to the developer. Every AI answer can be reported from inside the app.

IMPORTANT
Rifqat al-Uswa is a reflective guide. It does not issue fatwas and is not a substitute for a qualified scholar, doctor, therapist or lawyer. If you describe a situation involving danger, violence or thoughts of self-harm, the app points you to urgent help first.

Available in العربية, English, Nederlands, Español and Português. Feedback is welcome: wajdi.chaouche@gmail.com""",
CL: """• New languages: Spanish and Portuguese
• 26 reciters to choose from
• Download a reciter to listen to the recitations offline
• Easier installation of more read-aloud voices
• Fixes and improvements""",
}

L["ar"] = {
"title.txt": "رفقة الأسوة: هدي القرآن والسنة",
"short_description.txt": "اكتب ما تمرّ به، واقرأه في ضوء القرآن والسنة والسيرة بمصادر موثقة.",
"full_description.txt": """«رِفقة الأُسوة» رفيق تأملي هادئ: صف بكلماتك ما تمرّ به — خلافًا أو فقدًا أو همًّا أو ذنبًا أو قرارًا صعبًا — ويقرؤه التطبيق معك في ضوء القرآن الكريم والسنة النبوية والسيرة.

كيف يعمل؟
• اكتب بحرية، بالعربية الفصحى أو العامية، أو بالإنجليزية أو الهولندية أو الإسبانية أو البرتغالية، وبالتفصيل الذي تريد.
• يتعرّف التطبيق على الموضوعات والمشاعر والعلاقات فيما كتبت.
• ويأتيك بأقرب موقف من سيرة النبي ﷺ والأنبياء قبله: ماذا حدث، وكيف تعامل معه، والمبادئ المستفادة، وكيف تنطبق اليوم.
• مع الآيات والأحاديث والأدعية المتصلة بحالتك، لكل نص مصدره ودرجته، وخطوات عملية وما ينبغي تجنّبه.

ماذا يحتوي؟
• 115 موقفًا وقصة نبوية، و57 موضوعًا حياتيًا.
• 201 آية ومقطع، و149 حديثًا وذكرًا، بمصادرها ودرجات صحتها.
• مكتبة قابلة للبحث فيها كل النصوص التي يعتمد عليها التحليل.
• قراءة صوتية بخمس لغات بصوت رجالي أو نسائي، وتلاوة الآيات بأصوات 26 قارئًا من كبار القراء.
• نزّل قارئك المفضل مرة واحدة واستمع إلى التلاوات دون إنترنت.
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

متوفر بالعربية والإنجليزية والهولندية والإسبانية والبرتغالية. نرحّب بملاحظاتك: wajdi.chaouche@gmail.com""",
CL: """• لغتان جديدتان: الإسبانية والبرتغالية
• 26 قارئًا للاختيار بينهم
• نزّل قارئًا لتستمع إلى التلاوات دون إنترنت
• تثبيت أسهل لأصوات قراءة إضافية
• إصلاحات وتحسينات""",
}

L["nl-NL"] = {
"title.txt": "Rifqat al-Uswa: Koran & Soenna",
"short_description.txt": "Beschrijf wat je doormaakt en lees het in het licht van de Koran en de Soenna.",
"full_description.txt": """Rifqat al-Uswa ("in het gezelschap van het beste voorbeeld") is een rustige metgezel voor bezinning. Beschrijf in je eigen woorden wat je doormaakt — een conflict, een verlies, zorgen, schuldgevoel, een moeilijke beslissing — en de app leest het samen met je in het licht van de Edele Koran, de Profetische Soenna en de Sira.

HOE HET WERKT
• Schrijf vrij, in het Nederlands, Engels, Spaans, Portugees of Arabisch, zo uitgebreid als je wilt.
• De app herkent de onderwerpen, gevoelens en relaties in wat je schreef.
• Je krijgt de meest verwante situatie uit het leven van de Profeet ﷺ en de profeten vóór hem: wat er gebeurde, hoe hij reageerde, de principes erachter en hoe die vandaag gelden.
• Met de bijbehorende verzen, hadith en smeekbeden, elk met bron en graad, plus praktische stappen en wat je beter kunt vermijden.

WAT ER IN ZIT
• 115 Profetische situaties en verhalen, 57 levensonderwerpen.
• 201 verzen en passages en 149 hadith en smeekbeden, met bronnen en betrouwbaarheidsgraad.
• Een doorzoekbare bibliotheek met elke tekst waarop de analyse steunt.
• Voorlezen in vijf talen met een mannen- of vrouwenstem, en recitatie van de verzen door 26 bekende recitatoren.
• Download je favoriete recitator één keer en luister zonder internet naar de recitaties.
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

Beschikbaar in het Nederlands, Engels, Spaans, Portugees en Arabisch. Feedback is welkom: wajdi.chaouche@gmail.com""",
CL: """• Nieuwe talen: Spaans en Portugees
• Kies uit 26 recitatoren
• Download een recitator om offline naar de recitaties te luisteren
• Makkelijker extra voorleesstemmen installeren
• Verbeteringen en oplossingen""",
}

L["es-ES"] = {
"title.txt": "Rifqat al-Uswa: Corán y Sunna",
"short_description.txt": "Describe lo que estás viviendo y léelo a la luz del Corán y la Sunna.",
"full_description.txt": """Rifqat al-Uswa («en compañía del mejor ejemplo») es un compañero tranquilo para la reflexión. Describe con tus propias palabras lo que estás viviendo —un conflicto, una pérdida, una preocupación, la culpa, una decisión difícil— y la app lo lee contigo a la luz del Noble Corán, la Sunna profética y la Sira.

CÓMO FUNCIONA
• Escribe con libertad, en español, portugués, inglés, neerlandés o árabe, con todo el detalle que quieras.
• La app reconoce los temas, los sentimientos y las relaciones de lo que escribiste.
• Te muestra la situación más cercana de la vida del Profeta ﷺ y de los profetas anteriores: qué ocurrió, cómo respondió, los principios que hay detrás y cómo se aplican hoy.
• Con las aleyas, los hadices y las súplicas relacionadas, cada una con su fuente y su grado, además de pasos prácticos y qué evitar.

QUÉ CONTIENE
• 115 situaciones e historias proféticas y 57 temas de la vida.
• 201 aleyas y pasajes y 149 hadices y súplicas, con fuentes y grados de autenticidad.
• Una biblioteca con buscador de todos los textos en los que se basa el análisis.
• Lectura en voz alta en cinco idiomas con voz masculina o femenina, y recitación de las aleyas por 26 recitadores reconocidos.
• Descarga una vez a tu recitador favorito y escucha las recitaciones sin internet.
• Tema claro y oscuro y tamaño de letra ajustable.

FIABLE POR DISEÑO
• La app nunca inventa aleyas ni hadices: cada texto procede sin cambios de su biblioteca.
• El texto árabe se muestra siempre. Significados del Corán en español: Julio Cortés (vía Tanzil.net). Las traducciones al español de los hadices se prepararon para esta app a partir del inglés de sunnah.com y están señaladas como tales; el árabe sigue siendo la referencia.
• Los relatos débiles o históricos están claramente señalados.

PRIVADA Y SIN CONEXIÓN
• Sin cuenta, sin anuncios, sin análisis, sin seguimiento.
• Todo funciona sin conexión; lo que escribes se queda en tu dispositivo.
• Opcional: añade tu propia clave de la API de Claude (Anthropic) para obtener una reflexión adicional escrita por IA, limitada a los textos recuperados. Solo entonces se envía tu texto, directamente a Anthropic y nunca al desarrollador. Puedes informar sobre cualquier respuesta de la IA desde la app.

IMPORTANTE
Rifqat al-Uswa es una guía para la reflexión. No emite fetuas y no sustituye a un sabio cualificado, a un médico, a un terapeuta ni a un abogado. Si describes una situación con peligro, violencia o pensamientos de autolesión, la app te indica primero dónde pedir ayuda urgente (en España, 024).

Disponible en español, português, English, Nederlands y العربية. Tus comentarios son bienvenidos: wajdi.chaouche@gmail.com""",
CL: """• Nuevos idiomas: español y portugués
• 26 recitadores para elegir
• Descarga un recitador para escuchar las recitaciones sin conexión
• Instalación más fácil de voces de lectura adicionales
• Correcciones y mejoras""",
}

L["pt-PT"] = {
"title.txt": "Rifqat al-Uswa: Alcorão, Sunna",
"short_description.txt": "Descreve o que estás a viver e lê-o à luz do Alcorão e da Sunna.",
"full_description.txt": """Rifqat al-Uswa («na companhia do melhor exemplo») é um companheiro tranquilo para a reflexão. Descreve com as tuas próprias palavras o que estás a viver —um conflito, uma perda, uma preocupação, a culpa, uma decisão difícil— e a aplicação lê-o contigo à luz do Nobre Alcorão, da Sunna profética e da Sira.

COMO FUNCIONA
• Escreve livremente, em português, espanhol, inglês, neerlandês ou árabe, com todo o pormenor que quiseres.
• A aplicação reconhece os temas, os sentimentos e as relações naquilo que escreveste.
• Mostra-te a situação mais próxima da vida do Profeta ﷺ e dos profetas antes dele: o que aconteceu, como respondeu, os princípios por trás e como se aplicam hoje.
• Com os versículos, os hadiths e as súplicas relacionados, cada um com a sua fonte e o seu grau, além de passos práticos e do que evitar.

O QUE CONTÉM
• 115 situações e histórias proféticas e 57 temas da vida.
• 201 versículos e passagens e 149 hadiths e súplicas, com fontes e graus de autenticidade.
• Uma biblioteca pesquisável com todos os textos em que a análise se baseia.
• Leitura em voz alta em cinco idiomas com voz masculina ou feminina, e recitação dos versículos por 26 recitadores conhecidos.
• Transfere uma vez o teu recitador preferido e ouve as recitações sem internet.
• Tema claro e escuro e tamanho de letra ajustável.

FIÁVEL POR CONCEÇÃO
• A aplicação nunca inventa versículos nem hadiths: cada texto vem sem alterações da sua biblioteca.
• O texto árabe é sempre mostrado. Significados do Alcorão em português: Samir El-Hayek (via Tanzil.net). As traduções dos hadiths para português foram preparadas para esta aplicação a partir do inglês do sunnah.com e estão assinaladas como tal; o árabe continua a ser a referência.
• Os relatos fracos ou históricos estão claramente assinalados.

PRIVADA E SEM INTERNET
• Sem conta, sem anúncios, sem análise, sem rastreio.
• Tudo funciona sem internet; o que escreves fica no teu dispositivo.
• Opcional: adiciona a tua própria chave da API do Claude (Anthropic) para obteres uma reflexão adicional escrita por IA, limitada aos textos encontrados. Só então o teu texto é enviado, diretamente para a Anthropic e nunca para o programador. Podes denunciar qualquer resposta da IA a partir da aplicação.

IMPORTANTE
A Rifqat al-Uswa é um guia para a reflexão. Não emite fatwas e não substitui um sábio qualificado, um médico, um terapeuta nem um advogado. Se descreveres uma situação com perigo, violência ou pensamentos de autolesão, a aplicação indica-te primeiro onde pedir ajuda urgente (SNS 24: 808 24 24 24).

Disponível em português, español, English, Nederlands e العربية. Os teus comentários são bem-vindos: wajdi.chaouche@gmail.com""",
CL: """• Novos idiomas: português e espanhol
• 26 recitadores à escolha
• Transfere um recitador para ouvir as recitações sem internet
• Instalação mais fácil de vozes de leitura adicionais
• Correções e melhorias""",
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
