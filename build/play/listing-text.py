# رِفقة الأُسوة — نصوص صفحة المتجر (Google Play) بتسع لغات، بصيغة fastlane supply.
# الاستخدام: python build/play/listing-text.py   (يكتب listing/<locale>/*.txt ويتحقق من حدود الطول)
import io, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
VERSION_CODE = 12
CL = "changelogs/%d.txt" % VERSION_CODE
LIMITS = {"title.txt": 30, "short_description.txt": 80, "full_description.txt": 4000, CL: 500}

L = {}

L["en-US"] = {
"title.txt": "Rifqat al-Uswa: Quran & Sunnah",
"short_description.txt": "Describe what you're going through; read it in the light of Quran and Sunnah.",
"full_description.txt": """Rifqat al-Uswa ("in the company of the best example") is a quiet, reflective companion. Describe in your own words what you are going through — a conflict, a loss, worry, guilt, a hard decision — and the app reads it with you in the light of the Noble Quran, the Prophetic Sunnah and the Seerah.

HOW IT WORKS
• Write freely, in Arabic, English, French, Dutch, Spanish, Portuguese, Urdu, Indonesian or Turkish, in as much detail as you like.
• The app recognises the themes, feelings and relationships in what you wrote.
• It brings you the closest situation from the life of the Prophet ﷺ and the prophets before him — what happened, how he responded, the principles behind it, and how they apply today.
• You get the relevant verses, hadith and supplications, each with its source and grade, plus practical steps and what to avoid.

WHAT'S INSIDE
• 115 Prophetic situations and stories, 57 life topics.
• 201 verses and passages and 149 hadith and supplications, with sources and authenticity grades.
• A searchable library of every text the analysis relies on.
• Read-aloud in nine languages with male or female voices, and recitation of the verses by 26 well-known reciters.
• Download your favourite reciter once and listen to the recitations without internet.
• Light and dark themes, adjustable font size, optional Arabic diacritics for the explanations.

TRUSTWORTHY BY DESIGN
• The app never invents verses or hadith: every text comes unchanged from its curated library.
• The Arabic text is always shown. Meanings of the Quran via Tanzil.net: Saheeh International (English), Sofian S. Siregar (Dutch), Julio Cortés (Spanish), Samir El-Hayek (Portuguese), Muhammad Hamidullah (French), Fateh Muhammad Jalandhry (Urdu), the Indonesian Ministry of Religious Affairs (Indonesian), Diyanet İşleri (Turkish). English hadith: sunnah.com translations. The other hadith translations were prepared for this app from the sunnah.com English and are marked as such; the Arabic remains the reference.
• Weak or historical reports are labelled clearly.

PRIVATE AND OFFLINE
• No account, no ads, no analytics, no tracking.
• Everything works offline; what you write stays on your device.
• Optional: add your own Claude (Anthropic) API key to get an extra AI-written reflection that is restricted to the retrieved texts. Only then is your text sent — directly to Anthropic, never to the developer. Every AI answer can be reported from inside the app.

IMPORTANT
Rifqat al-Uswa is a reflective guide. It does not issue fatwas and is not a substitute for a qualified scholar, doctor, therapist or lawyer. If you describe a situation involving danger, violence or thoughts of self-harm, the app points you to urgent help first.

Available in العربية, English, Français, Nederlands, Español, Português, اردو, Bahasa Indonesia and Türkçe. Feedback is welcome: wajdi.chaouche@gmail.com""",
CL: """• New languages: Urdu, Indonesian and Turkish
• A smarter first reading of your situation: it recognises your place in the story (carer, the one who was hurt, the one who wants to make amends), quotes your own words and avoids misreadings
• Fixes and improvements""",
}

L["ar"] = {
"title.txt": "رفقة الأسوة: هدي القرآن والسنة",
"short_description.txt": "اكتب ما تمرّ به، واقرأه في ضوء القرآن والسنة والسيرة بمصادر موثقة.",
"full_description.txt": """«رِفقة الأُسوة» رفيق تأملي هادئ: صف بكلماتك ما تمرّ به — خلافًا أو فقدًا أو همًّا أو ذنبًا أو قرارًا صعبًا — ويقرؤه التطبيق معك في ضوء القرآن الكريم والسنة النبوية والسيرة.

كيف يعمل؟
• اكتب بحرية، بالعربية الفصحى أو العامية، أو بالإنجليزية أو الفرنسية أو الهولندية أو الإسبانية أو البرتغالية أو الأردية أو الإندونيسية أو التركية، وبالتفصيل الذي تريد.
• يتعرّف التطبيق على الموضوعات والمشاعر والعلاقات فيما كتبت.
• ويأتيك بأقرب موقف من سيرة النبي ﷺ والأنبياء قبله: ماذا حدث، وكيف تعامل معه، والمبادئ المستفادة، وكيف تنطبق اليوم.
• مع الآيات والأحاديث والأدعية المتصلة بحالتك، لكل نص مصدره ودرجته، وخطوات عملية وما ينبغي تجنّبه.

ماذا يحتوي؟
• 115 موقفًا وقصة نبوية، و57 موضوعًا حياتيًا.
• 201 آية ومقطع، و149 حديثًا وذكرًا، بمصادرها ودرجات صحتها.
• مكتبة قابلة للبحث فيها كل النصوص التي يعتمد عليها التحليل.
• قراءة صوتية بتسع لغات بصوت رجالي أو نسائي، وتلاوة الآيات بأصوات 26 قارئًا من كبار القراء.
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

متوفر بالعربية والإنجليزية والفرنسية والهولندية والإسبانية والبرتغالية والأردية والإندونيسية والتركية. نرحّب بملاحظاتك: wajdi.chaouche@gmail.com""",
CL: """• لغات جديدة: الأردية والإندونيسية والتركية
• قراءة أولى أذكى لموقفك: تتعرّف على موقعك في القصة (راعٍ، أو من وقع عليه الأذى، أو من أخطأ ويريد الإصلاح)، وتقتبس كلماتك كما كتبتها، وتتجنّب القراءات الخاطئة
• إصلاحات وتحسينات""",
}

L["nl-NL"] = {
"title.txt": "Rifqat al-Uswa: Koran & Soenna",
"short_description.txt": "Beschrijf wat je doormaakt en lees het in het licht van de Koran en de Soenna.",
"full_description.txt": """Rifqat al-Uswa ("in het gezelschap van het beste voorbeeld") is een rustige metgezel voor bezinning. Beschrijf in je eigen woorden wat je doormaakt — een conflict, een verlies, zorgen, schuldgevoel, een moeilijke beslissing — en de app leest het samen met je in het licht van de Edele Koran, de Profetische Soenna en de Sira.

HOE HET WERKT
• Schrijf vrij, in het Nederlands, Engels, Frans, Spaans, Portugees, Urdu, Indonesisch, Turks of Arabisch, zo uitgebreid als je wilt.
• De app herkent de onderwerpen, gevoelens en relaties in wat je schreef.
• Je krijgt de meest verwante situatie uit het leven van de Profeet ﷺ en de profeten vóór hem: wat er gebeurde, hoe hij reageerde, de principes erachter en hoe die vandaag gelden.
• Met de bijbehorende verzen, hadith en smeekbeden, elk met bron en graad, plus praktische stappen en wat je beter kunt vermijden.

WAT ER IN ZIT
• 115 Profetische situaties en verhalen, 57 levensonderwerpen.
• 201 verzen en passages en 149 hadith en smeekbeden, met bronnen en betrouwbaarheidsgraad.
• Een doorzoekbare bibliotheek met elke tekst waarop de analyse steunt.
• Voorlezen in negen talen met een mannen- of vrouwenstem, en recitatie van de verzen door 26 bekende recitatoren.
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

Beschikbaar in het Nederlands, Engels, Frans, Spaans, Portugees, Urdu, Indonesisch, Turks en Arabisch. Feedback is welkom: wajdi.chaouche@gmail.com""",
CL: """• Nieuwe talen: Urdu, Indonesisch en Turks
• Een slimmere eerste lezing van je situatie: herkent je plek in het verhaal (mantelzorger, degene die gekwetst is, degene die het goed wil maken), citeert je eigen woorden en vermijdt verkeerde lezingen
• Verbeteringen""",
}

L["es-ES"] = {
"title.txt": "Rifqat al-Uswa: Corán y Sunna",
"short_description.txt": "Describe lo que estás viviendo y léelo a la luz del Corán y la Sunna.",
"full_description.txt": """Rifqat al-Uswa («en compañía del mejor ejemplo») es un compañero tranquilo para la reflexión. Describe con tus propias palabras lo que estás viviendo —un conflicto, una pérdida, una preocupación, la culpa, una decisión difícil— y la app lo lee contigo a la luz del Noble Corán, la Sunna profética y la Sira.

CÓMO FUNCIONA
• Escribe con libertad, en español, portugués, francés, inglés, neerlandés, urdu, indonesio, turco o árabe, con todo el detalle que quieras.
• La app reconoce los temas, los sentimientos y las relaciones de lo que escribiste.
• Te muestra la situación más cercana de la vida del Profeta ﷺ y de los profetas anteriores: qué ocurrió, cómo respondió, los principios que hay detrás y cómo se aplican hoy.
• Con las aleyas, los hadices y las súplicas relacionadas, cada una con su fuente y su grado, además de pasos prácticos y qué evitar.

QUÉ CONTIENE
• 115 situaciones e historias proféticas y 57 temas de la vida.
• 201 aleyas y pasajes y 149 hadices y súplicas, con fuentes y grados de autenticidad.
• Una biblioteca con buscador de todos los textos en los que se basa el análisis.
• Lectura en voz alta en nueve idiomas con voz masculina o femenina, y recitación de las aleyas por 26 recitadores reconocidos.
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

Disponible en español, português, français, English, Nederlands, اردو, Bahasa Indonesia, Türkçe y العربية. Tus comentarios son bienvenidos: wajdi.chaouche@gmail.com""",
CL: """• Nuevos idiomas: urdu, indonesio y turco
• Una primera lectura más inteligente de tu situación: reconoce tu lugar en la historia (cuidador, quien fue herido, quien quiere reparar), cita tus propias palabras y evita lecturas erróneas
• Correcciones y mejoras""",
}

L["pt-PT"] = {
"title.txt": "Rifqat al-Uswa: Alcorão, Sunna",
"short_description.txt": "Descreve o que estás a viver e lê-o à luz do Alcorão e da Sunna.",
"full_description.txt": """Rifqat al-Uswa («na companhia do melhor exemplo») é um companheiro tranquilo para a reflexão. Descreve com as tuas próprias palavras o que estás a viver —um conflito, uma perda, uma preocupação, a culpa, uma decisão difícil— e a aplicação lê-o contigo à luz do Nobre Alcorão, da Sunna profética e da Sira.

COMO FUNCIONA
• Escreve livremente, em português, espanhol, francês, inglês, neerlandês, urdu, indonésio, turco ou árabe, com todo o pormenor que quiseres.
• A aplicação reconhece os temas, os sentimentos e as relações naquilo que escreveste.
• Mostra-te a situação mais próxima da vida do Profeta ﷺ e dos profetas antes dele: o que aconteceu, como respondeu, os princípios por trás e como se aplicam hoje.
• Com os versículos, os hadiths e as súplicas relacionados, cada um com a sua fonte e o seu grau, além de passos práticos e do que evitar.

O QUE CONTÉM
• 115 situações e histórias proféticas e 57 temas da vida.
• 201 versículos e passagens e 149 hadiths e súplicas, com fontes e graus de autenticidade.
• Uma biblioteca pesquisável com todos os textos em que a análise se baseia.
• Leitura em voz alta em nove idiomas com voz masculina ou feminina, e recitação dos versículos por 26 recitadores conhecidos.
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

Disponível em português, español, français, English, Nederlands, اردو, Bahasa Indonesia, Türkçe e العربية. Os teus comentários são bem-vindos: wajdi.chaouche@gmail.com""",
CL: """• Novos idiomas: urdu, indonésio e turco
• Uma primeira leitura mais inteligente da tua situação: reconhece o teu lugar na história (cuidador, quem foi magoado, quem quer reparar), cita as tuas próprias palavras e evita leituras erradas
• Correções e melhorias""",
}

L["fr-FR"] = {
"title.txt": "Rifqat al-Uswa : Coran, Sunna",
"short_description.txt": "Décrivez ce que vous vivez et lisez-le à la lumière du Coran et de la Sunna.",
"full_description.txt": """Rifqat al-Uswa (« en compagnie du meilleur exemple ») est un compagnon calme pour la réflexion. Décrivez avec vos propres mots ce que vous vivez — un conflit, une perte, une inquiétude, la culpabilité, une décision difficile — et l'application le lit avec vous à la lumière du Noble Coran, de la Sunna prophétique et de la Sîra.

COMMENT ÇA MARCHE
• Écrivez librement, en français, anglais, néerlandais, espagnol, portugais, ourdou, indonésien, turc ou arabe, avec autant de détails que vous voulez.
• L'application reconnaît les thèmes, les sentiments et les relations dans ce que vous avez écrit.
• Elle vous montre la situation la plus proche dans la vie du Prophète ﷺ et des prophètes avant lui : ce qui s'est passé, comment il a répondu, les principes en jeu et comment ils s'appliquent aujourd'hui.
• Avec les versets, les hadiths et les invocations liés, chacun avec sa source et son degré, ainsi que des pas concrets et ce qu'il faut éviter.

CE QU'ELLE CONTIENT
• 115 situations et récits prophétiques et 57 thèmes de vie.
• 201 versets et passages et 149 hadiths et invocations, avec sources et degrés d'authenticité.
• Une bibliothèque consultable avec tous les textes sur lesquels repose l'analyse.
• Lecture à voix haute en neuf langues avec voix masculine ou féminine, et récitation des versets par 26 récitateurs connus.
• Téléchargez une fois votre récitateur préféré et écoutez les récitations sans internet.
• Thème sombre par défaut, thème clair au choix, et taille de texte réglable.

FIABLE PAR CONCEPTION
• L'application n'invente jamais de versets ni de hadiths : chaque texte vient sans modification de sa bibliothèque.
• Le texte arabe est toujours affiché. Sens du Coran en français : Muhammad Hamidullah (via Tanzil.net). Les traductions françaises des hadiths ont été préparées pour cette application à partir de l'anglais de sunnah.com et sont signalées comme telles ; l'arabe reste la référence.
• Les récits faibles ou historiques sont clairement signalés.

PRIVÉE ET HORS LIGNE
• Pas de compte, pas de publicité, pas d'analyse, pas de pistage.
• Tout fonctionne sans internet ; ce que vous écrivez reste sur votre appareil.
• En option : ajoutez votre propre clé API Claude (Anthropic) pour une réflexion supplémentaire rédigée par IA, limitée aux textes trouvés. C'est seulement alors que votre texte est envoyé, directement à Anthropic et jamais au développeur. Vous pouvez signaler toute réponse de l'IA depuis l'application.

IMPORTANT
Rifqat al-Uswa est un guide pour la réflexion. Elle ne donne pas de fatwas et ne remplace pas un savant qualifié, un médecin, un thérapeute ou un avocat. Si vous décrivez une situation de danger, de violence ou des pensées d'automutilation, l'application vous indique d'abord où trouver une aide urgente (3114 en France).

Disponible en français, English, Nederlands, español, português, اردو, Bahasa Indonesia, Türkçe et العربية. Vos retours sont les bienvenus : wajdi.chaouche@gmail.com""",
CL: """• Nouvelles langues : ourdou, indonésien et turc
• Une première lecture plus intelligente de votre situation : elle reconnaît votre place dans l'histoire (aidant, personne blessée, personne qui veut réparer), cite vos propres mots et évite les contresens
• Corrections et améliorations""",
}

L["ur"] = {
"title.txt": "رفقۃ الاسوہ: قرآن و سنت",
"short_description.txt": "جو آپ پر گزر رہی ہے لکھیں، اور اسے قرآن، سنت اور سیرت کی روشنی میں پڑھیں۔",
"full_description.txt": """رفقۃ الاسوہ («بہترین نمونے کی رفاقت میں») غور و فکر کا ایک پرسکون ساتھی ہے۔ اپنے الفاظ میں بیان کریں کہ آپ پر کیا گزر رہی ہے — کوئی اختلاف، نقصان، فکر، احساسِ گناہ یا مشکل فیصلہ — اور ایپ اسے آپ کے ساتھ قرآنِ کریم، سنتِ نبوی اور سیرت کی روشنی میں پڑھتی ہے۔

یہ کیسے کام کرتی ہے
• آزادی سے لکھیں: اردو، عربی، انگریزی، فرانسیسی، ڈچ، ہسپانوی، پرتگالی، انڈونیشی یا ترکی میں، جتنی تفصیل سے چاہیں۔
• ایپ آپ کی تحریر میں موضوعات، احساسات اور رشتوں کو پہچانتی ہے، اور یہ بھی کہ کہانی میں آپ کہاں کھڑے ہیں۔
• یہ آپ کو نبی ﷺ اور ان سے پہلے انبیاء کی زندگی سے قریب ترین واقعہ دکھاتی ہے: کیا ہوا، آپ نے کیسے جواب دیا، اس کے پیچھے کے اصول، اور آج وہ کیسے لاگو ہوتے ہیں۔
• متعلقہ آیات، احادیث اور دعائیں، ہر ایک اپنے ماخذ اور درجے کے ساتھ، اور عملی قدم اور جن چیزوں سے بچنا ہے۔

اس میں کیا ہے
• 115 نبوی واقعات اور قصے، 57 زندگی کے موضوعات۔
• 201 آیات اور مقامات اور 149 احادیث اور دعائیں، ماخذ اور صحت کے درجات کے ساتھ۔
• ایک قابلِ تلاش لائبریری جس میں وہ تمام متون ہیں جن پر تجزیہ مبنی ہے۔
• نو زبانوں میں مرد یا عورت کی آواز میں بلند خوانی، اور 26 معروف قراء کی آواز میں آیات کی تلاوت۔
• اپنے پسندیدہ قاری کو ایک بار ڈاؤن لوڈ کریں اور بغیر انٹرنیٹ تلاوت سنیں۔
• ڈارک تھیم بطورِ طے شدہ، لائٹ تھیم اختیاری، اور نستعلیق خط کے ساتھ قابلِ تبدیل فونٹ سائز۔

قابلِ اعتماد بناوٹ
• ایپ کبھی آیات یا احادیث خود نہیں بناتی: ہر متن اپنی لائبریری سے بغیر تبدیلی کے آتا ہے۔
• عربی متن ہمیشہ دکھایا جاتا ہے۔ قرآن کا اردو ترجمہ: فتح محمد جالندھری (Tanzil.net کے ذریعے)۔ احادیث کے اردو ترجمے اس ایپ کے لیے sunnah.com کے انگریزی ترجمے سے تیار کیے گئے ہیں اور ایسے ہی نشان زد ہیں؛ عربی ہی اصل حوالہ ہے۔
• ضعیف یا تاریخی روایات واضح طور پر نشان زد ہیں۔

نجی اور آف لائن
• نہ اکاؤنٹ، نہ اشتہارات، نہ تجزیہ، نہ ٹریکنگ۔
• سب کچھ بغیر انٹرنیٹ کام کرتا ہے؛ آپ کا لکھا آپ کے آلے پر رہتا ہے۔
• اختیاری: اضافی AI غور و فکر کے لیے اپنی Claude (Anthropic) API کلید شامل کریں، جو تلاش کردہ متون تک محدود ہے۔ صرف تب آپ کا متن بھیجا جاتا ہے — براہِ راست Anthropic کو، ڈویلپر کو کبھی نہیں۔ ہر AI جواب کی ایپ کے اندر سے رپورٹ کی جا سکتی ہے۔

اہم
رفقۃ الاسوہ غور و فکر کی رہنما ہے۔ یہ فتویٰ نہیں دیتی اور کسی مستند عالم، ڈاکٹر، معالج یا وکیل کا متبادل نہیں۔ اگر آپ خطرے، تشدد یا خود کو نقصان پہنچانے کے خیالات والی صورتِ حال بیان کریں تو ایپ پہلے آپ کو فوری مدد کی طرف رہنمائی کرتی ہے۔

اردو، العربية، English، Français، Nederlands، Español، Português، Bahasa Indonesia اور Türkçe میں دستیاب۔ آپ کی رائے کا خیر مقدم ہے: wajdi.chaouche@gmail.com""",
CL: """• نئی زبانیں: اردو، انڈونیشی اور ترکی
• آپ کی صورتِ حال کی زیادہ سمجھدار ابتدائی قراءت: کہانی میں آپ کے مقام کو پہچانتی ہے، آپ کے اپنے الفاظ نقل کرتی ہے اور غلط قراءت سے بچتی ہے
• اصلاحات اور بہتریاں""",
}

L["id"] = {
"title.txt": "Rifqat al-Uswa: Qur'an, Sunnah",
"short_description.txt": "Ceritakan yang sedang kamu alami, lalu baca dalam cahaya Al-Qur'an dan Sunnah.",
"full_description.txt": """Rifqat al-Uswa (“bersama teladan terbaik”) adalah teman perenungan yang tenang. Ceritakan dengan kata-katamu sendiri apa yang sedang kamu alami — konflik, kehilangan, kecemasan, rasa bersalah, keputusan sulit — dan aplikasi membacanya bersamamu dalam cahaya Al-Qur'an, Sunnah Nabi, dan Sirah.

CARA KERJANYA
• Tulis dengan bebas, dalam bahasa Indonesia, Arab, Inggris, Prancis, Belanda, Spanyol, Portugis, Urdu, atau Turki, sedetail yang kamu mau.
• Aplikasi mengenali tema, perasaan, dan hubungan dalam tulisanmu, serta posisimu dalam cerita.
• Aplikasi menampilkan kisah yang paling dekat dari kehidupan Nabi ﷺ dan para nabi sebelumnya: apa yang terjadi, bagaimana beliau menyikapinya, prinsip di baliknya, dan penerapannya hari ini.
• Disertai ayat, hadits, dan doa yang relevan, masing-masing dengan sumber dan derajatnya, ditambah langkah praktis dan hal yang perlu dihindari.

ISINYA
• 115 kisah dan peristiwa kenabian, 57 tema kehidupan.
• 201 ayat dan bagian serta 149 hadits dan doa, dengan sumber dan derajat keshahihan.
• Pustaka yang dapat dicari berisi semua teks yang menjadi dasar analisis.
• Pembacaan suara dalam sembilan bahasa dengan suara pria atau wanita, serta tilawah ayat oleh 26 qari terkenal.
• Unduh qari favoritmu sekali dan dengarkan tilawah tanpa internet.
• Tema gelap secara bawaan, tema terang sebagai pilihan, dan ukuran huruf yang dapat diatur.

TEPERCAYA SEJAK RANCANGAN
• Aplikasi tidak pernah mengarang ayat atau hadits: setiap teks berasal tanpa perubahan dari pustakanya.
• Teks Arab selalu ditampilkan. Terjemahan Al-Qur'an: Kementerian Agama RI (melalui Tanzil.net). Terjemahan hadits berbahasa Indonesia disiapkan untuk aplikasi ini dari terjemahan Inggris sunnah.com dan ditandai demikian; teks Arab tetap menjadi rujukan.
• Riwayat yang lemah atau bersifat sejarah ditandai dengan jelas.

PRIVAT DAN OFFLINE
• Tanpa akun, tanpa iklan, tanpa analitik, tanpa pelacakan.
• Semuanya berjalan tanpa internet; apa yang kamu tulis tetap di perangkatmu.
• Opsional: tambahkan kunci API Claude (Anthropic) milikmu untuk perenungan tambahan yang ditulis AI, terbatas pada teks yang ditemukan. Hanya saat itulah teksmu dikirim — langsung ke Anthropic, tidak pernah ke pengembang. Setiap jawaban AI dapat dilaporkan dari dalam aplikasi.

PENTING
Rifqat al-Uswa adalah panduan perenungan. Aplikasi ini tidak mengeluarkan fatwa dan bukan pengganti ulama yang kompeten, dokter, terapis, atau pengacara. Jika kamu menggambarkan situasi yang melibatkan bahaya, kekerasan, atau pikiran untuk menyakiti diri, aplikasi terlebih dahulu menunjukkan tempat meminta bantuan darurat.

Tersedia dalam Bahasa Indonesia, العربية, English, Français, Nederlands, Español, Português, اردو, dan Türkçe. Masukanmu sangat kami harapkan: wajdi.chaouche@gmail.com""",
CL: """• Bahasa baru: Indonesia, Urdu, dan Turki
• Pembacaan awal yang lebih cerdas atas keadaanmu: mengenali posisimu dalam cerita, mengutip kata-katamu sendiri, dan menghindari salah baca
• Perbaikan dan peningkatan""",
}

L["tr-TR"] = {
"title.txt": "Rifqat al-Uswa: Kur'an, Sünnet",
"short_description.txt": "Yaşadığını anlat; onu Kur'an, Sünnet ve Siyer ışığında oku.",
"full_description.txt": """Rifqat al-Uswa (“en güzel örneğin arkadaşlığında”) sakin bir tefekkür arkadaşıdır. Yaşadığın şeyi kendi kelimelerinle anlat — bir anlaşmazlık, bir kayıp, bir kaygı, suçluluk, zor bir karar — uygulama da onu seninle birlikte Kur'an-ı Kerim, Nebevî Sünnet ve Siyer ışığında okusun.

NASIL ÇALIŞIR
• Türkçe, Arapça, İngilizce, Fransızca, Felemenkçe, İspanyolca, Portekizce, Urduca veya Endonezce olarak, istediğin kadar ayrıntıyla özgürce yaz.
• Uygulama yazdıklarındaki konuları, duyguları ve ilişkileri, ayrıca hikâyedeki yerini tanır.
• Sana Peygamber'in ﷺ ve ondan önceki peygamberlerin hayatından en yakın olayı getirir: ne oldu, nasıl karşılık verdi, arkasındaki ilkeler ve bugün nasıl uygulandıkları.
• İlgili ayetler, hadisler ve dualar, her biri kaynağı ve derecesiyle; ayrıca pratik adımlar ve kaçınılması gerekenler.

İÇİNDEKİLER
• 115 nebevî olay ve kıssa, 57 hayat konusu.
• Kaynakları ve sıhhat dereceleriyle 201 ayet ve bölüm ile 149 hadis ve dua.
• Analizin dayandığı bütün metinleri içeren aranabilir bir kütüphane.
• Dokuz dilde erkek veya kadın sesiyle sesli okuma ve 26 tanınmış kârinin sesiyle ayet tilaveti.
• Sevdiğin kâriyi bir kez indir ve tilavetleri internetsiz dinle.
• Varsayılan olarak koyu tema, isteğe bağlı açık tema ve ayarlanabilir yazı boyutu.

GÜVENİLİR TASARIM
• Uygulama asla ayet veya hadis uydurmaz: her metin kütüphanesinden değiştirilmeden gelir.
• Arapça metin her zaman gösterilir. Kur'an meali: Diyanet İşleri (Tanzil.net aracılığıyla). Hadislerin Türkçe çevirileri bu uygulama için sunnah.com'un İngilizce çevirisinden hazırlanmıştır ve öyle işaretlenmiştir; esas olan Arapçadır.
• Zayıf veya tarihî rivayetler açıkça işaretlenir.

ÖZEL VE ÇEVRİMDIŞI
• Hesap yok, reklam yok, analiz yok, takip yok.
• Her şey internetsiz çalışır; yazdıkların cihazında kalır.
• İsteğe bağlı: bulunan metinlerle sınırlı, yapay zekâ tarafından yazılmış ek bir tefekkür için kendi Claude (Anthropic) API anahtarını ekle. Ancak o zaman metnin gönderilir — doğrudan Anthropic'e, asla geliştiriciye değil. Her yapay zekâ cevabı uygulama içinden bildirilebilir.

ÖNEMLİ
Rifqat al-Uswa bir tefekkür rehberidir. Fetva vermez ve yetkin bir âlimin, doktorun, terapistin veya avukatın yerini tutmaz. Tehlike, şiddet veya kendine zarar verme düşünceleri içeren bir durum anlatırsan uygulama önce seni acil yardıma yönlendirir.

Türkçe, العربية, English, Français, Nederlands, Español, Português, اردو ve Bahasa Indonesia dillerinde. Geri bildirimlerin memnuniyetle karşılanır: wajdi.chaouche@gmail.com""",
CL: """• Yeni diller: Türkçe, Urduca ve Endonezce
• Durumunun daha akıllı bir ilk okuması: hikâyedeki yerini tanır, kendi sözlerini aktarır ve yanlış okumalardan kaçınır
• Düzeltmeler ve iyileştirmeler""",
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
