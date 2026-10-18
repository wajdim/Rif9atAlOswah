/* ======================================================================
   رِفقة الأُسوة — محرك الاسترجاع والتحليل (RAG engine, 100% offline)
   ----------------------------------------------------------------------
   المراحل:
   1) الفهم (Understanding): تطبيع النص العربي + تجذيع خفيف + كشف الموضوعات
      والمشاعر والعلاقات وشدة الموقف وموقع المتكلم (مظلوم/مخطئ).
   2) التوسيع (Query expansion): إضافة مفردات الموضوعات المكتشفة للاستعلام.
   3) الاسترجاع (Retrieval): BM25 على ثلاثة فهارس (المواقف، الآيات، الأحاديث)
      مع تعزيز دلالي من خريطة الموضوعات.
   4) التركيب (Synthesis): بناء تحليل متعدد الأبعاد من المقاطع المسترجعة فقط.
   لا يُولَّد أي نص ديني؛ كل آية وحديث يأتي من المكتبة الموثقة كما هو.
   ====================================================================== */
var RAG = (function(){
  "use strict";

  /* ---------------- 1. معالجة النص العربي ---------------- */
  function normalize(str){
    var t=String(str||"").replace(/ß/g,"ss").replace(/ẞ/g,"ss");      // الألمانية: ß ← ss
    if(t.normalize) t=t.normalize("NFD").replace(/[\u0300-\u036f]/g,"");   // é ë ï ← e e i (الهولندية)؛ همزات العربية تُوحَّد بعدها كما كانت
    return t
      .toLowerCase()
      .replace(/[ً-ٰٟـ]/g,"")      // تشكيل وتطويل
      .replace(/[إأآٱا]/g,"ا")
      .replace(/ى/g,"ي").replace(/ة/g,"ه")
      .replace(/ؤ/g,"و").replace(/ئ/g,"ي")
      // الأردية: توحيد الحروف المشتركة مع العربية، والإبقاء على حروفها الخاصة (پ چ ٹ ڈ ڑ ژ گ ں)
      .replace(/ک/g,"ك").replace(/[یےۓ]/g,"ي").replace(/[ہھۃۂۀ]/g,"ه")
      .replace(/ı/g,"i")                                   // التركية: i بلا نقطة
      .replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
      .replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
      .replace(/[০-৯]/g,d=>String("০১২৩৪৫৬৭৮৯".indexOf(d)))          // البنغالية: الأرقام
      // الحروف البنغالية (\u0980-\u09FF) تبقى كما هي بعد التفكيك NFD؛ وعلامة الوقف «।» ونصف المسافة الفارسية تصيران مسافة
      .replace(/[^ء-ي0-9a-z\s\u0679\u067E\u0686\u0688\u0691\u0698\u06AF\u06BA\u0980-\u09FF]/g," ")
      .replace(/\s+/g," ").trim();
  }

  var STOP = new Set(("من في على الي الى عن مع هو هي انا انت انتي انتم انتما هم هن نحن ثم او ام لا لم لن ولا و ف ب ك ل هذا هذه ذلك تلك هذي هاذا هاذي " +
    "الذي التي الذين اللذين اللاتي كان كانت كانوا يكون تكون قد لقد ما ماذا لماذا كيف متي اين كل بعض غير بين عند عندي حتي اذا ان انه انها " +
    "له لها لهم لي لك لكم عليه عليها عليك عليكم علي معه معها معي معك منه منها مني منك اليه اليها به بها بي بك فيه فيها فيا " +
    "نفس بنفس جدا ايضا كنت اكون يا ايها اي لكن لان لانه لانها لاني بعد قبل حين عندما لما الان هنا هناك فقط حتى " +
    "راني راه راهو هاذ اللي الي بش باش كي وقتلي برشا ياسر شنو شنوه علاش كيفاش واش ماشي مش مو ايش شو ليش هيك كده ده دي " +
    "يعني طيب اه ايوه نعم بس " +
    "the a an and or of to in is i my me it this that am are was were be been being have has had do does did so but if then than " +
    "he she they them his her their we us our you your yours im ive dont didnt doesnt cant wont isnt its at on for with from by as about " +
    "into over after before when what who whom which why how just very really also too much many more most some any all no not " +
    "can could would should will shall may might must there here up down out off again still even ever " +
    "de het een en of van te in is ik mijn me mij het dit dat die deze ben zijn was waren wordt werd worden heb heeft had hebben " +
    "hij zij ze hem haar hun wij we ons onze jij je jou jouw u uw er hier daar op voor met uit door als aan om tot bij naar over " +
    "na toen wanneer wat wie welke waarom hoe maar dan al ook nog wel niet geen nooit zo zeer erg heel veel meer meest alle alles " +
    "iets niets kan kon zou zouden moet moeten mag mogen wil willen zal zullen gaat gaan doe doet deed").split(" "));
  // الإسبانية والبرتغالية: تُضاف فقط في تلك الواجهتين («sin» و«son» كلمتان مهمتان في الإنجليزية)
  if(window.I18N && (I18N.lang==="es" || I18N.lang==="pt")) (
    // español (sin tildes: normalize las quita)
    "el la los las un una unos unas y o u de del al a en con por para sin sobre entre que como cuando donde quien cual cuales porque pero si " +
    "no ni ya muy mas menos tan tambien solo yo tu el ella nosotros nosotras ellos ellas usted ustedes me te se nos os le les lo mi mis tu tus su sus " +
    "nuestro nuestra este esta esto estos estas ese esa eso esos esas aquel es son era eran fue fueron ser estar estoy estas esta estamos estan " +
    "he ha han hemos habia hay tengo tiene tienen tenia hace hago puedo puede pueden quiero quiere todo toda todos todas algo nada mucho mucha muchos " +
    // português (sem acentos)
    "o os as um uma uns umas e ou do da dos das ao aos na nas no nos em com por pelo pela para sem sobre entre que como quando onde quem qual quais " +
    "porque mas se nao ja muito mais menos tao tambem so eu ele ela nos eles elas voce voces me te lhe lhes meu minha meus minhas teu tua seu sua " +
    "seus suas nosso nossa isto isso aquilo este esse aquele sou somos sao era eram foi foram ser estar estou estamos estao tenho tem temos tinha " +
    "posso pode podem quero quer tudo toda todos todas algo nada muita muitos muitas").split(" ").forEach(function(w){ STOP.add(w); });
  // الإندونيسية والتركية والأردية: كلمات وظيفية تُضاف في واجهاتها فقط
  if(window.I18N && I18N.lang==="id") ("yang dan di ke dari ini itu untuk dengan pada adalah tidak ada saya aku kamu dia mereka kami kita akan sudah telah juga " +
    "atau tapi tetapi karena jika kalau saat ketika agar supaya bisa dapat harus sangat lebih masih hanya sih kok ya nya pun lah kah").split(" ").forEach(function(w){ STOP.add(w); });
  if(window.I18N && I18N.lang==="tr") ("ve ile bir bu su o da de ki mi mu ama fakat cunku icin gibi kadar daha cok en ben sen o biz siz onlar beni bana benim " +
    "seni sana onu ona bunu buna var yok ise eger hem ya veya ne nasil neden niye ki diye olarak olan oldu olur sey").split(" ").forEach(function(w){ STOP.add(w); });
  if(window.I18N && I18N.lang==="ur") ["کا","کی","کے","کو","سے","میں","پر","اور","یا","کہ","یہ","وہ","ہے","ہیں","تھا","تھی","تھے","ہوں","ہو","گا","گی","گے","نے","بھی","تو",
    "میں","مجھے","میرا","میری","میرے","آپ","ہم","ان","اس","اپنے","اپنی","جو","کیا","لیے","لئے","ساتھ","بہت","اب","پھر","ایک","کر","کرنا","رہا","رہی","رہے"].forEach(function(w){ STOP.add(normalize(w)); });
  // الألمانية والملايوية والفارسية والبنغالية: كلمات وظيفية في واجهاتها فقط (تبقى أدوات النفي و«دائمًا/أبدًا» لأنها قرائن في التحليل)
  if(window.I18N && I18N.lang==="de") ("der die das den dem des ein eine einen einem einer eines und oder aber doch denn weil dass ob wenn als wie wo was wer wen wem " +
    "warum wieso weshalb ich du er sie es wir ihr mich mir dich dir ihn ihm uns euch sich mein meine meinen meinem meiner meines dein deine deinen sein seine seinen " +
    "ihre ihren unser unsere bin bist ist sind war waren wird werden wurde wurden habe hast hat haben hatte hatten kann kannst konnte konnte muss musste soll sollte " +
    "will wollte mochte nur auch noch schon sehr so zu im in an auf aus bei mit nach von vor fur uber unter um bis durch gegen ohne zum zur am vom beim dann da " +
    "hier dort jetzt mal etwas alles viel mehr man ja dieser diese dieses diesem diesen jener").split(" ").forEach(function(w){ STOP.add(w); });
  if(window.I18N && I18N.lang==="ms") ("yang dan di ke dari ini itu untuk dengan pada adalah ada saya aku awak anda kamu dia ia mereka kami kita akan sudah telah juga " +
    "atau tetapi tapi kerana sebab jika kalau apabila ketika supaya agar boleh dapat harus mesti perlu sangat amat lebih masih hanya sahaja je pun lah kah nya " +
    "oleh bagi dalam tu ni sini sana macam bila").split(" ").forEach(function(w){ STOP.add(w); });
  if(window.I18N && I18N.lang==="fa") ["و","در","به","از","که","این","آن","را","با","برای","تا","هم","یا","اما","ولی","چون","اگر","من","تو","او","ما","شما","آنها","ایشان",
    "است","هست","بود","بودم","شد","شده","می","نمی","هر","خود","یک","بر","پس","نیز","همه","چه","چرا","چطور","کجا","وقتی","خیلی","فقط","هنوز","دیگر","ای","مرا","منو",
    "اون","این","اینکه","کنم","کند","کرد","کردم","دارم","دارد","همیشه","سر","هستم","هستی","هستند","هستیم","باشد","باشم","شود","شوم","کنی","کنیم","کنند","کرده","کردند",
    "داری","داریم","دارند","چیز","چیزی","حالا","الان","خب","اینجا","آنجا","روی","پیش","بعد","قبل","مثل","همین","همان","آیا","بله"].forEach(function(w){ STOP.add(normalize(w)); });
  if(window.I18N && I18N.lang==="bn") ["এবং","ও","আর","বা","কিন্তু","তবে","যে","যা","যদি","তাহলে","কারণ","জন্য","সঙ্গে","সাথে","থেকে","দিয়ে","কাছে","মধ্যে","উপর",
    "এই","ওই","সেই","এটা","ওটা","সেটা","আমি","তুমি","তুই","আপনি","সে","তিনি","আমরা","তোমরা","তারা","আমার","তোমার","তার","আমাকে","তোমাকে","তাকে",
    "আছে","ছিল","হয়","হল","হলো","হবে","করে","করা","কি","কী","কেন","কিভাবে","কোথায়","কখন","খুব","শুধু","এখন","তো","ই","একটা","একটি","অনেক","আসসালামু","আলাইকুম","সালাম"].forEach(function(w){ STOP.add(normalize(w)); });
  // الفرنسية: تُضاف فقط في الواجهة الفرنسية (بلا حركات؛ والفاصلة العليا تصير مسافة: j'ai ← j ai)
  if(window.I18N && I18N.lang==="fr") (
    "le la les l un une des du de d et ou en au aux a dans par pour sur sous avec sans entre chez vers que qu qui quoi quand comme dont " +
    "ce cet cette ces c se s sa son ses mon ma mes ton ta tes notre nos votre vos leur leurs je j tu il elle on nous vous ils elles me m te t lui y " +
    "ne n pas plus moins tres trop aussi est sont etait etaient ete etre suis es sommes etes ai as avons avez ont avait avaient avoir " +
    "fait faire peux peut veux veut tout toute tous toutes rien chose mais donc car si alors deja encore bien cela ca ceci celui celle ceux").split(" ").forEach(function(w){ STOP.add(w); });

  var PREFIXES = ["وبال","وال","بال","كال","فال","لل","ال","وب","ول","وس","فس","و","ف","ب","ك","ل","س"];
  var SUFFIXES = ["تموها","كموها","هما","كما","تما","تان","تين","ونا","ون","ين","ان","ات","ها","هم","هن","كم","كن","نا","ني","وا","يه","يا","ته","تي","ه","ي","ك","ت"];

  /* تجذيع خفيف: يحذف سابقة واحدة ولاحقة (أو اثنتين) مع إبقاء جذر لا يقل عن 3 أحرف */
  /* تجذيع إنجليزي خفيف (للواجهة الإنجليزية): يوحّد صيغ الجمع والأفعال الشائعة */
  function stemEn(w){
    if(w.length<=3 || /[0-9]/.test(w)) return w;
    if(/ies$/.test(w) && w.length>4) return w.slice(0,-3)+"y";
    if(/(ness|ment|ings?)$/.test(w) && w.length>6) w=w.replace(/(ness|ment|ings?)$/,"");
    else if(/edly$/.test(w)) w=w.slice(0,-4);
    else if(/(ed|ly)$/.test(w) && w.length>5) w=w.slice(0,-2);
    else if(/(ss|sh|ch|x|z)es$/.test(w)) w=w.slice(0,-2);
    else if(/s$/.test(w) && !/(ss|us|is)$/.test(w)) w=w.slice(0,-1);
    if(/(.)\1$/.test(w) && !/(ll|ss|ff|zz)$/.test(w)) w=w.slice(0,-1);
    if(/e$/.test(w) && w.length>4) w=w.slice(0,-1);
    return w;
  }
  /* تجذيع هولندي خفيف: الجمع (-en, -s)، والنهايات الشائعة، وتوحيد الحرف المضاعف (vrienden ← vriend، zorgen ← zorg) */
  function stemNl(w){
    if(w.length<=3 || /[0-9]/.test(w)) return w;
    if(/heden$/.test(w)) return w.slice(0,-5)+"heid";
    if(/(ingen|ing)$/.test(w) && w.length>6) w=w.replace(/(ingen|ing)$/,"");
    else if(/(lijk|lijke|baar|bare)$/.test(w) && w.length>7) w=w.replace(/(lijke|lijk|bare|baar)$/,"");
    else if(/en$/.test(w) && w.length>5) w=w.slice(0,-2);
    else if(/(te|de)$/.test(w) && w.length>5) w=w.slice(0,-2);
    else if(/[^aeiou]e$/.test(w) && w.length>4) w=w.slice(0,-1);
    else if(/s$/.test(w) && !/(ss|is|us)$/.test(w) && w.length>4) w=w.slice(0,-1);
    else if(/t$/.test(w) && w.length>5 && !/(st|cht|ft)$/.test(w)) w=w.slice(0,-1);
    if(/([bcdfgklmnprst])\1$/.test(w)) w=w.slice(0,-1);
    return w.replace(/v$/,"f").replace(/z$/,"s");
  }
  /* تجذيع إسباني/برتغالي خفيف (بلا حركات): الجمع والتأنيث والنهايات الشائعة (amigas ← amig، tristeza ← trist) */
  function stemRom(w){
    if(w.length<=4 || /[0-9]/.test(w)) return w;
    var S=["amente","mente","aciones","acoes","acion","acao","idades","idade","idad","ismos","ismo","ezas","eza","encias","encia","ancias","ancia",
           "ndose","ndo","aram","eram","aban","avam","ados","adas","idos","idas","ado","ada","ido","ida","ar","er","ir","es","as","os","s","a","o","e"];
    for(var i=0;i<S.length;i++){ var x=S[i]; if(w.length-x.length>=3 && w.slice(-x.length)===x){ w=w.slice(0,-x.length); break; } }
    return w.replace(/(qu|gu)$/,function(m){ return m.charAt(0)==="q"?"c":"g"; });
  }
  /* تجذيع فرنسي خفيف (بلا حركات): الجمع والتأنيث والنهايات الشائعة (tristesse ← trist، amies ← ami) */
  function stemFr(w){
    if(w.length<=4 || /[0-9]/.test(w)) return w;
    var S=["issements","issement","ements","ement","ations","ation","atrices","atrice","ateurs","ateur","ances","ance","ences","ence","esses","esse",
           "ites","ite","ives","ive","ifs","euses","euse","eux","ees","ee","ais","ait","ant","er","ez","es","s","x","e"];
    for(var i=0;i<S.length;i++){ var x=S[i]; if(w.length-x.length>=3 && w.slice(-x.length)===x){ w=w.slice(0,-x.length); break; } }
    return w;
  }
  /* تجذيع إندونيسي خفيف: اللواحق الشائعة (-nya -lah -kah -kan -an -i) والسوابق (me- ber- di- ter- ke- se- pe-) */
  function stemId(w){
    if(w.length<=4 || /[0-9]/.test(w)) return w;
    w=w.replace(/(nya|lah|kah|pun)$/,""); if(w.length>5) w=w.replace(/(kan|an|i)$/,"");
    var m=w.match(/^(mem|men|meng|meny|me|ber|be|di|ter|ke|se|pem|pen|peng|per|pe)(.{3,})$/); if(m) w=m[2];
    return w;
  }
  /* تجذيع تركي خفيف (بعد التطبيع: ç→c ğ→g ı→i ö→o ş→s ü→u): لواحق الجمع والإضافة والحالة والزمن */
  function stemTr(w){
    if(w.length<=4 || /[0-9]/.test(w)) return w;
    var S=["lerimiz","larimiz","leriniz","lariniz","lerim","larim","lerin","larin","leri","lari","ler","lar","imiz","umuz","iniz","unuz",
           "yorum","iyorum","uyorum","yor","dim","dum","tim","tum","dik","duk","mis","mus","acak","ecek","mak","mek","dan","den","tan","ten",
           "nin","nun","in","un","im","um","da","de","ta","te","yi","yu","i","u","a","e"];
    for(var p=0;p<2;p++){ for(var i=0;i<S.length;i++){ var x=S[i]; if(w.length-x.length>=3 && w.slice(-x.length)===x){ w=w.slice(0,-x.length); break; } } }
    return w;
  }
  /* تجذيع ألماني خفيف (بعد التطبيع: ä→a ö→o ü→u ß→ss): الجمع والتصريف والنهايات الشائعة (Traurigkeit ← traurig، Freunden ← freund) */
  function stemDe(w){
    if(w.length<=4 || /[0-9]/.test(w)) return w;
    var S=["ungen","ung","heiten","heit","keiten","keit","lichen","licher","liches","liche","lich","ischen","ische","isch","ern","en","er","es","em","e","s","n","t"];
    for(var i=0;i<S.length;i++){ var x=S[i]; if(w.length-x.length>=4 && w.slice(-x.length)===x){ w=w.slice(0,-x.length); break; } }
    return w;
  }
  /* تجذيع فارسي خفيف (بعد التطبيع ی←ي): الجمع واللواحق الضميرية وصيغ التفضيل (دوستانم ← دوست، غمگین‌ترین ← غمگين) */
  var FA_SUF=["هايشان","هايتان","هايمان","هايم","هايت","هايش","هاي","ها","ترين","تر","شان","تان","مان","ام","ات","اش","يم","يد","ند","ي"];
  function stemFa(w){
    if(w.length<=3 || /[0-9]/.test(w)) return w;
    for(var p=0;p<2;p++){ for(var i=0;i<FA_SUF.length;i++){ var x=FA_SUF[i]; if(w.length-x.length>=3 && w.slice(-x.length)===x){ w=w.slice(0,-x.length); break; } } }
    return w;
  }
  /* تجذيع بنغالي خفيف: لواحق الجمع والحالة والتعريف (বন্ধুদের ← বন্ধু، মায়ের ← মা)؛ اللواحق تُطبَّع كالنص (NFD) */
  var BN_SUF=["গুলোকে","গুলোর","গুলো","গুলি","দেরকে","দের","েরা","রা","কে","ের","এর","টার","টা","টির","টি","তে","য়","র","ে"].map(normalize).sort(function(a,b){ return b.length-a.length; });
  function stemBn(w){
    if(w.length<=2 || /[0-9]/.test(w)) return w;
    for(var i=0;i<BN_SUF.length;i++){ var x=BN_SUF[i]; if(w.length-x.length>=2 && w.slice(-x.length)===x) return w.slice(0,-x.length); }
    return w;
  }
  var BN_WORD=/[\u0980-\u09FF]/;
  var BN_CASE=["ের","এর","র","য়ের","দের","রা","েরা","কে","কেও","দেরকে","টা","টি","টার","টির","গুলো","গুলোর","রাও","ও","েরও"].map(normalize);
  var STEM_LANG=(window.I18N && I18N.lang) || "en";
  // الأردية والفارسية: بحروف عربية لكن بلا سوابق العربية ولواحقها
  var NOAR=STEM_LANG==="ur" || STEM_LANG==="fa";
  function stem(w){
    if(!w) return w;
    if(/[a-z]/.test(w)) return STEM_LANG==="nl"?stemNl(w):(STEM_LANG==="es"||STEM_LANG==="pt")?stemRom(w):STEM_LANG==="fr"?stemFr(w):(STEM_LANG==="id"||STEM_LANG==="ms")?stemId(w):STEM_LANG==="tr"?stemTr(w):STEM_LANG==="de"?stemDe(w):stemEn(w);
    if(BN_WORD.test(w)) return stemBn(w);
    if(w.length<=3 || /[0-9]/.test(w)) return w;
    if(STEM_LANG==="ur") return w.indexOf("ال")===0 && w.length>4 ? w.slice(2) : w;   // الأردية: لا سوابق/لواحق عربية
    if(STEM_LANG==="fa") return stemFa(w.indexOf("ال")===0 && w.length>4 ? w.slice(2) : w);
    var s=w, i;
    for(i=0;i<PREFIXES.length;i++){
      var p=PREFIXES[i];
      if(s.indexOf(p)===0 && s.length-p.length>=3){ s=s.slice(p.length); break; }
    }
    return stemSuffix(s);
  }
  function stemSuffix(s){
    for(var pass=0; pass<2; pass++){
      var cut=false;
      for(var i=0;i<SUFFIXES.length;i++){
        var x=SUFFIXES[i];
        if(s.length-x.length>=3 && s.slice(-x.length)===x){ s=s.slice(0,-x.length); cut=true; break; }
      }
      if(!cut) break;
    }
    return s;
  }
  /* جذع «محافظ» لمطابقة مفردات الموضوع: لا يحذف من السوابق إلا متعددة الحروف («ال، بال، وال، لل…») و«و» قبل كلمة
     من 4 أحرف فأكثر؛ فتبقى «سعيد، بعيد، فريق، لقطة» كما هي، وتتوحد اللواحق كالمعتاد («طفلك، طفلي، وطفلها» ← طفل) */
  function coreStem(w){
    if(!w || /[a-z]/.test(w) || NOAR || BN_WORD.test(w) || w.length<=3) return stem(w);
    for(var i=0;i<PREFIXES.length;i++){
      var p=PREFIXES[i];
      if(w.indexOf(p)!==0) continue;
      if(p.length===1 && !(p==="و" && w.length-1>=4)) break;
      if(w.length-p.length<3) break;
      w=w.slice(p.length); break;
    }
    return stemSuffix(w);
  }
  function coreStems(text){ return contentWords(normalize(text)).map(coreStem).filter(function(s){ return s.length>=3; }); }
  function words(norm){ return norm.split(" ").filter(Boolean); }
  function contentWords(norm){ return words(norm).filter(function(w){ return !STOP.has(w) && w.length>1; }); }
  function stems(text){ return contentWords(normalize(text)).map(stem); }

  /* ---------------- 2. فهرس BM25 ---------------- */
  function Index(){ this.docs=[]; this.df=Object.create(null); this.avg=1; }
  Index.prototype.add=function(id, fields){
    var tf=Object.create(null), len=0;
    fields.forEach(function(f){
      if(!f || !f.text) return;
      var arr=Array.isArray(f.text)?f.text.join("   "):f.text;
      stems(arr).forEach(function(s){ tf[s]=(tf[s]||0)+f.w; len+=f.w; });
    });
    this.docs.push({id:id, tf:tf, len:len||1});
  };
  Index.prototype.finish=function(){
    var df=this.df, total=0;
    this.docs.forEach(function(d){ total+=d.len; for(var t in d.tf) df[t]=(df[t]||0)+1; });
    this.avg=total/Math.max(1,this.docs.length);
    this.N=this.docs.length;
  };
  Index.prototype.idf=function(t){
    var n=this.df[t]||0; return Math.log(1+(this.N-n+0.5)/(n+0.5));
  };
  /* q: {stem: weight} → Map id→score */
  Index.prototype.search=function(q){
    var k1=1.4, b=0.72, out=Object.create(null), self=this;
    this.docs.forEach(function(d){
      var s=0;
      for(var t in q){
        var f=d.tf[t]; if(!f) continue;
        s+=self.idf(t)*(f*(k1+1))/(f+k1*(1-b+b*d.len/self.avg))*q[t];
      }
      if(s>0) out[d.id]=s;
    });
    return out;
  };

  var IDX={sit:new Index(), quran:new Index(), hadith:new Index(), theme:new Index(), life:new Index()};
  var BY={sit:{}, quran:{}, hadith:{}, theme:{}, life:{}};
  var LIFE_STEMS=Object.create(null);       // n -> Set(life stems) لمواقف «500 موقف من الحياة»
  var THEME_OF_SIT=Object.create(null);   // sitId -> [themeIds]
  var TRIG=[];                              // [{theme, norm, multi, len}]
  var THEME_CORE=Object.create(null);       // themeId -> Set(core stems of single-word triggers)
  // جذوع شائعة المعنى لا تكفي وحدها لإثبات موضوع («مشروع صغير»، «تفقد محفظتك»، «عدت إلى الوطن»، «قريب منك»)
  var GENERIC_CORE=new Set(["صغير","حاج","عدت","فقد","سمع","قريب"]);
  var built=false;

  function build(){
    if(built) return;
    SITUATIONS.forEach(function(s){
      BY.sit[s.id]=s;
      IDX.sit.add(s.id,[
        {text:s.title,w:3},{text:s.keywords,w:3},{text:s.semanticTags,w:2.5},
        {text:s.problemType,w:2},{text:s.emotionsAddressed,w:1.6},{text:s.subCategories,w:1.6},
        {text:s.mainCategory,w:1},{text:s.responseType,w:0.8},{text:s.principles,w:0.8},
        {text:s.modernApplications,w:0.6},{text:s.eventDescription,w:0.5},{text:s.whatToAvoid,w:0.4},
        {text:(s.hadithRefs||[]).map(function(h){return h.text;}),w:0.3},
        {text:(s.quranRefs||[]).map(function(q){return q.text+" "+(q.relevance||"");}),w:0.4}
      ]);
    });
    QURAN_LIB.forEach(function(q){
      BY.quran[q.id]=q;
      IDX.quran.add(q.id,[{text:q.t,w:1.2},{text:q.n,w:1},{text:q.th.map(themeLabel),w:1.5}]);
    });
    HADITH_LIB.forEach(function(h){
      BY.hadith[h.id]=h;
      IDX.hadith.add(h.id,[{text:h.t,w:1.2},{text:h.n,w:1},{text:h.th.map(themeLabel),w:1.5},{text:h.w||"",w:1}]);
    });
    THEMES.forEach(function(t){
      BY.theme[t.id]=t;
      IDX.theme.add(t.id,[{text:t.label,w:3},{text:t.triggers,w:2},{text:t.insight,w:0.35},{text:t.questions,w:0.3}]);
      t.sits.forEach(function(id){ (THEME_OF_SIT[id]=THEME_OF_SIT[id]||[]).push(t.id); });
      // مفردات الموضوع «الصلبة»: ألفاظه المفردة فقط؛ كلمات العبارات («بداية جديدة»، «هاتف زوجي») وكلمات الاسم العامة («الأسرة»، «النوايا») لا تدل وحدها
      THEME_CORE[t.id]=new Set(coreStems(t.triggers.filter(function(x){ return normalize(x).indexOf(" ")<0; }).join(" ")).filter(function(s){ return !GENERIC_CORE.has(s); }));
      t.triggers.forEach(function(tr){
        var n=normalize(tr); if(!n) return;
        TRIG.push({theme:t.id, norm:n, multi:n.indexOf(" ")>-1, len:n.length});
      });
    });
    (window.LIFE||[]).forEach(function(x){
      if(!x.th.some(function(id){ return BY.theme[id]; })) return;
      BY.life[x.n]=x; var ls=lifeStems(x.t); LIFE_STEMS[x.n]=new Set(ls);
      IDX.life.docs.push({id:String(x.n), tf:ls.reduce(function(m,s){ m[s]=1; return m; },{}), len:Math.max(1,new Set(ls).size)});
    });
    ["sit","quran","hadith","theme","life"].forEach(function(k){ IDX[k].finish(); });
    built=true;
  }
  function themeLabel(id){ var t=BY.theme[id]||THEMES.find(function(x){return x.id===id;}); return t?t.label:""; }

  /* ---------------- 2ب. أمثلة «500 موقف من الحياة» ----------------
     المواقف مكتوبة بصيغة المخاطَب («تشعر، تختلف»)، والمستخدم يكتب بصيغة المتكلم («أشعر، نختلف»):
     لمطابقتها فقط نوحّد حرف المضارعة في أول الكلمة على الجانبين، ثم نقيس كم من وزن الموقف (IDF)
     حاضر في كلام المستخدم. الموقف لا يُعرض نصه؛ إنما يرجّح الموضوعات المربوطة به يدويًا. */
  function lifeStem(w){ var s=stem(w); return (s.length>=4 && /^[اتين]/.test(s)) ? s.slice(1) : s; }
  function lifeStems(text){ return contentWords(normalize(text)).map(lifeStem).filter(function(s){ return s.length>=2; }); }
  var LIFE_MIN=0.45, LIFE_W=2.0, LIFE_CAP=1.4;
  function lifeMatches(raw){
    if(!IDX.life.docs.length || NOAR) return [];
    var qs=new Set(lifeStems(raw)); if(qs.size<2) return [];
    var out=[];
    IDX.life.docs.forEach(function(d){
      var tot=0, got=0, shared=0, strong=0;
      LIFE_STEMS[d.id].forEach(function(s){
        var w=IDX.life.idf(s); tot+=w;
        if(qs.has(s)){ got+=w; shared++; if(w>=2.5) strong++; }
      });
      var sim=tot?got/tot:0;
      // كلمتان مشتركتان على الأقل، إحداهما غير شائعة في المجموعة، ونصف وزن الموقف تقريبًا
      if(shared>=2 && strong>=1 && sim>=LIFE_MIN) out.push({n:+d.id, item:BY.life[d.id], sim:sim});
    });
    return out.sort(function(a,b){ return b.sim-a.sim; }).slice(0,3);
  }

  /* ---------------- 3. الفهم ---------------- */
  var CONCEPT_W=2.2;
  function stripPrefix(w){
    if(NOAR) return w;
    for(var i=0;i<PREFIXES.length;i++){ var p=PREFIXES[i]; if(w.indexOf(p)===0 && w.length-p.length>=2) return w.slice(p.length); }
    return w;
  }
  /* كلمات تتطابق حروفها مع لفظ دالّ بعد حذف سابقة، ومعناها مختلف تمامًا:
     «لقطة» ليست «ل+قطة»، و«أملك» (من المِلك) ليست «أمل»، و«الوحيد» (الأوحد) ليست الوحدة، و«مرتين» ليست «مرتي».
     لا تطابق إلا لفظًا مساويًا لها حرفيًا. */
  var HOMOGRAPHS=new Set(["لقطه","لقطات","لقطتي","املك","مرتين","مرتان","الوحيد","الوحيده","بابي",
    "hello","hellos","helloo"]);   // «hello» ليست «hell»
  var AR_WORD=/[ء-ي]/;
  /* بقية الكلمة بعد اللفظ القصير يجب أن تكون لاحقة عربية حقيقية (أو لاحقتين):
     «جاري، جارتها» تطابق «جار»، أما «جارح» و«الحقيقي» و«اخيرا» و«اختيار» فلا تطابق «جار، حقي، اخي، اختي» */
  function suffixChain(rem, depth){
    if(!rem || (depth===0 && rem==="ا")) return true;               // تنوين النصب: «ظلمًا، خوفًا»
    if(depth===0 && rem.length>1 && rem.slice(-1)==="ا" && suffixChain(rem.slice(0,-1), 1)) return true;
    if(depth>=2) return false;
    for(var i=0;i<SUFFIXES.length;i++){
      var x=SUFFIXES[i];
      if(rem.length>=x.length && rem.slice(-x.length)===x && suffixChain(rem.slice(0,-x.length), depth+1)) return true;
    }
    return false;
  }
  function extendsTrig(w, trig){
    if(w.indexOf(trig)!==0) return false;
    if(NOAR || trig.length>=5 || !AR_WORD.test(trig)) return true;
    return suffixChain(w.slice(trig.length), 0);
  }
  /* هل تظهر الكلمة المفردة ضمن كلمات المستخدم (مع السوابق واللواحق)؟ */
  function wordHit(userWords, trig){
    if(BN_WORD.test(trig)){   // البنغالية: الكلمة مع لواحق الحالة والجمع (বসের، মায়ের، ভাইদের ← বস، মা، ভাই)؛ لا «ে» وحدها كي لا تُطابق «বসে» (جالسًا) «বস»
      for(var b=0;b<userWords.length;b++){ var bw=userWords[b]; if(bw===trig) return true;
        if(bw.indexOf(trig)===0 && BN_CASE.indexOf(bw.slice(trig.length))>-1) return true; }
      if(trig.length<3) return false;
    }
    if(trig.length<3){ return userWords.indexOf(trig)>-1; }
    for(var i=0;i<userWords.length;i++){
      var u=userWords[i];
      if(u===trig) return true;
      if(HOMOGRAPHS.has(u)) continue;
      var sp=stripPrefix(u);
      if(sp===trig) return true;
      if(trig.length>=4 && (extendsTrig(sp,trig) || extendsTrig(u,trig))) return true;
      if(trig.length===3 && sp.length<=trig.length+3 && extendsTrig(sp,trig)) return true;
    }
    return false;
  }
  /* عبارة متعددة الكلمات داخل النص، مع التسامح مع و/ف/ب الملتصقة بأولها */
  function phraseIn(norm, n){
    var h=" "+norm+" ";
    return h.indexOf(" "+n)>-1 || h.indexOf(" و"+n)>-1 || h.indexOf(" ف"+n)>-1 || h.indexOf(" ب"+n)>-1;
  }
  function lexHits(norm, userWords, list){
    return list.filter(function(w){
      var n=normalize(w); if(!n) return false;
      return n.indexOf(" ")>-1 ? phraseIn(norm,n) : wordHit(userWords,n);
    });
  }
  /* النفي: «لست غاضبًا» / «I'm not angry» / «kızgın değilim» لا تُحسب مشاعر.
     يُفحص موضع كل ظهور: كلمتان قبله (أدوات نفي سابقة) وكلمتان بعده (أدوات نفي لاحقة كالتركية والأردية) */
  var NEG_PRE=null, NEG_POST=null, RAW_WORDS=[], RAW_STOPS=[];
  /* كلمات المستخدم كما كتبها، بمحاذاة الكلمات المطبَّعة (لعرض الدليل بحروفه هو) */
  function rawAligned(raw){
    var out=[];
    String(raw||"").split(/\s+/).forEach(function(tok){
      var n=normalize(tok); if(!n) return;
      var clean=tok.replace(/^[^0-9A-Za-zÀ-ɏء-ي٠-٩ٱ-ۓ۰-۹]+|[^0-9A-Za-zÀ-ɏء-يً-ْ٠-٩ٱ-ۓ۰-۹]+$/g,"");
      var stop=/[.!?؟،,;:…]$/.test(tok);
      n.split(" ").forEach(function(x,i,a){ out.push(clean||tok); RAW_STOPS.push(stop && i===a.length-1); });
    });
    return out;
  }
  function negSets(){
    if(!NEG_PRE){ NEG_PRE=new Set((window.NEGATORS||[]).map(normalize)); NEG_POST=new Set((window.NEGATORS_POST||[]).map(normalize)); }
  }
  function occurrences(userWords, n){
    var parts=n.split(" "), out=[];
    for(var i=0;i+parts.length<=userWords.length;i++){
      var ok=true;
      for(var j=0;j<parts.length;j++){
        var u=userWords[i+j], t=parts[j], sp=HOMOGRAPHS.has(u)?u:stripPrefix(u);
        if(!(u===t || (!HOMOGRAPHS.has(u) && (sp===t || (t.length>=4 && (extendsTrig(u,t) || extendsTrig(sp,t))))))){ ok=false; break; }
      }
      if(ok) out.push([i, i+parts.length-1]);
    }
    return out;
  }
  function negated(userWords, span){
    negSets();
    // النفي لا يعبر علامات الترقيم: «et pas moi, ma vie est finie» ليست نفيًا لما بعد الفاصلة
    var stops=RAW_STOPS.length===userWords.length;
    for(var k=1;k<=2;k++){
      if(stops && RAW_STOPS[span[0]-k]) break;
      if(NEG_PRE.has(userWords[span[0]-k])) return true;
    }
    for(var k2=1;k2<=2;k2++){
      if(stops && RAW_STOPS[span[1]+k2-1]) break;
      if(NEG_POST.has(userWords[span[1]+k2])) return true;
    }
    return false;
  }
  /* مثل lexHits لكنها تتجاهل الظهور المنفي، وتعيد الكلمة كما وردت في نص المستخدم (دليلًا) */
  function lexHitsNeg(norm, userWords, list, extend){
    var out=[], seen=new Set();
    list.forEach(function(w){
      var n=normalize(w); if(!n) return;
      if(n.indexOf(" ")<0 && n.length<3 && !BN_WORD.test(n)){ if(userWords.indexOf(n)<0) return; }
      var occ=occurrences(userWords, n);
      if(!occ.length){ if(n.indexOf(" ")>-1 ? phraseIn(norm,n) : wordHit(userWords,n)) out.push({w:w, ev:w}); return; }
      var live=occ.filter(function(sp){ return !negated(userWords, sp); });
      if(!live.length){ lexHitsNeg.negatedHit=true; return; }
      var src=(RAW_WORDS.length===userWords.length)?RAW_WORDS:userWords;
      var end=live[0][1]+1+(extend||0);
      if(extend && RAW_WORDS.length===userWords.length){ for(var e=live[0][1]; e<Math.min(end, RAW_STOPS.length); e++){ if(RAW_STOPS[e]){ end=e+1; break; } } }
      var ev=src.slice(live[0][0], end).filter(function(x,i,a){ return i===0 || x!==a[i-1]; }).join(" ");
      if(seen.has(ev)) return; seen.add(ev);
      out.push({w:w, ev:ev});
    });
    return out;
  }

  function detectThemes(norm, userWords, qStems, raw){
    var scores=Object.create(null), hits=Object.create(null);
    TRIG.forEach(function(tr){
      var ok = tr.multi ? phraseIn(norm, tr.norm) : wordHit(userWords, tr.norm);
      if(!ok) return;
      var w = tr.multi ? 1.6+Math.min(1.2,tr.len/12) : (tr.len>=5?1.15:0.9);
      scores[tr.theme]=(scores[tr.theme]||0)+w;
      (hits[tr.theme]=hits[tr.theme]||[]).push(tr.norm);
    });
    // إشارة دلالية إضافية من فهرس الموضوعات (تلتقط ما لم تلتقطه الألفاظ)
    var q={}; qStems.forEach(function(s){ q[s]=(q[s]||0)+1; });
    var sem=IDX.theme.search(q);
    var distinct=coreStems(norm);
    for(var id in sem){
      var sv=Math.min(1.3, sem[id]*0.18);
      if(scores[id]) scores[id]+=sv;
      // موضوع بلا أي لفظ صريح لا يُقبل بكلمة عابرة («زميل» لا تعني «الشهوة»، و«جديد» لا تعني «الأمل»):
      // يلزم أن يشارك كلامُ المستخدم الموضوعَ في كلمة من مفرداته «الصلبة» (THEME_CORE)
      else if(sv>=1.0 && THEME_CORE[id] && distinct.some(function(s){ return THEME_CORE[id].has(s); })) scores[id]=sv;
    }
    // أمثلة المواقف الحياتية: صوت إضافي محدود السقف للموضوعات المربوطة بأقرب موقف (الأول هو الأساس)
    var life=lifeMatches(raw), lifeAdd=Object.create(null);
    life.forEach(function(m,r){
      m.item.th.forEach(function(tid,pos){
        if(!BY.theme[tid]) return;
        lifeAdd[tid]=Math.min(LIFE_CAP,(lifeAdd[tid]||0)+LIFE_W*m.sim*(pos===0?1:0.7)*(r===0?1:0.5));
      });
    });
    for(var lt in lifeAdd) scores[lt]=(scores[lt]||0)+lifeAdd[lt];
    detectThemes.life=life;
    // المفاهيم (js/data-nlu.js): قواعد تزامن متعددة اللغات تلتقط المعنى حين يغيب اللفظ الصريح («ساعدته… ثم تنكّر لي»)
    var concepts=window.NLU ? NLU.concepts(userWords) : [];
    concepts.forEach(function(c){
      Object.keys(c.th).forEach(function(tid){
        if(!BY.theme[tid]) return;
        scores[tid]=(scores[tid]||0)+CONCEPT_W*c.th[tid];
        (hits[tid]=hits[tid]||[]).push(c.ev);
      });
    });
    detectThemes.concepts=concepts;
    var list=Object.keys(scores).map(function(id){
      return {id:id, theme:BY.theme[id], score:scores[id], hits:(hits[id]||[]), life:!!lifeAdd[id]};
    }).filter(function(x){ return x.theme && x.score>=0.9; })
      .sort(function(a,b){ return b.score-a.score; });
    var top=list.length?list[0].score:1;
    list.forEach(function(x){ x.conf=Math.max(0.15, Math.min(1, x.score/Math.max(3.2, top))); });
    // تجميع: الموضوعات ذات الثقة المنخفضة جدًا مقارنة بالأول تُستبعد
    return list.filter(function(x,i){ return i<2 || x.score>=top*0.34; }).slice(0,5);
  }

  function understand(raw, opts){
    build();
    // طبقة الفهم (js/nlu.js): العربية بحروف لاتينية ← حروف عربية، وتصحيح الأخطاء الإملائية اللاتينية، في مكانها
    var input=raw, prep=window.NLU ? NLU.prepare(raw) : null;
    if(prep) raw=prep.text;
    var norm=normalize(raw), userWords=words(norm), qStems=stems(raw);
    RAW_STOPS=[]; RAW_WORDS=rawAligned(raw);
    var themes=detectThemes(norm, userWords, qStems, raw);
    // عند إشارات إيذاء النفس: موضوع «اليأس» أولًا دائمًا، ويُستبعد «الخوف من الموت» حتى لا يُساء الفهم
    var crisis=/((?:اريد|اود|ارغب في|ابغي|ابي|بغيت|نحب|نبغي|حابب|حاب|بدي|عايز|عاوز|نفسي|ودي|اتمني) (?:ان )?(?:ا|ن)?موت|الموت ارحم|انتحار|انتحر|انهي حياتي|اقتل نفسي|نقتل روحي|(?:لا|ما|مش|لم اعد|ما عدت|ما عاد|ما عادش) (?:اريد|اود|ارغب في|احب|نحب|بدي|ابغي|ابي|عايز|عاوز|حاب) (?:ان )?(?:ا|ن)?عيش|اذي نفسي|اؤذي نفسي|suicid|kill myself|end my life|want to die|wish i (was|were) dead|hurt myself|harm myself|self harm|no reason to live|zelfmoord|mezelf (van kant|iets aan)|dood wil|wil (dood|sterven)|niet meer (leven|verder)|wou dat ik dood|mezelf pijn|zelfbeschadiging|een eind aan mijn leven|quiero morir|matarme|quitarme la vida|acabar con mi vida|no quiero (vivir|seguir viviendo)|hacerme dano|autolesion|ojala estuviera muert|quero morrer|matar me|me matar|tirar a minha (propria )?vida|acabar com a minha vida|nao quero (viver|continuar a viver)|magoar me|me magoar|automutila|autolesao|quem me dera estar mort|je veux mourir|envie de mourir|me suicider|suicidaire|(veux|vais|envie de) me tuer|en finir avec (la|ma) vie|mettre fin a (mes jours|ma vie)|(ne )?veux plus vivre|plus envie de vivre|me faire du mal|me mutiler|scarifi|j aimerais etre mort|je voudrais etre mort)/.test(norm);
    if(!crisis) crisis=CRISIS_EXTRA.some(function(t){ var n=normalize(t); return n && (" "+norm+" ").indexOf(" "+n)>-1; });
    // صيغ إضافية (العاميات والعربية اللاتينية بعد تحويلها) + «خطر لطيف»: يأس بلا نية معلنة، يُعرض معه اطمئنان على السلامة
    var safe=window.NLU ? NLU.safety(norm) : {crisis:false, soft:false};
    if(window.NLU && input!==raw){ var s0=NLU.safety(normalize(input)); safe={crisis:safe.crisis||s0.crisis, soft:safe.soft||s0.soft}; }   // النص الأصلي أيضًا («nheb nmout»)
    if(!crisis && safe.crisis) crisis=true;
    var softRisk=!crisis && safe.soft;
    if(crisis){
      themes=themes.filter(function(t){ return t.id!=="death_fear" && t.id!=="despair"; });
      themes.unshift({id:"despair", theme:BY.theme.despair, score:9, conf:1, hits:[T("إشارات ألم شديد")]});
    }
    // موضوع اختاره المستخدم بنفسه عند ضعف الفهم: يتقدّم على غيره (ولا يُقدَّم على إشارات الأزمة أبدًا)
    var focus=opts && opts.focus && BY.theme[opts.focus] && !crisis ? opts.focus : null;
    if(focus){
      var fs0=themes[0]?themes[0].score:0;
      themes=themes.filter(function(t){ return t.id!==focus; });
      themes.unshift({id:focus, theme:BY.theme[focus], score:Math.max(3,fs0+1), conf:0.9, hits:[], focus:true});
      themes=themes.slice(0,5);
    }
    var negatedEmo=new Set();
    var emotions=EMOTION_LEXICON.map(function(e){
      lexHitsNeg.negatedHit=false;
      var h=lexHitsNeg(norm,userWords,e.words);
      if(!h.length && lexHitsNeg.negatedHit) negatedEmo.add(e.id);
      // دليل بلا تكرار: «en colère» تُغني عن «colère»
      var ev=h.map(function(x){return x.ev;}).filter(function(x,i,a){ var nx=normalize(x); return !a.some(function(y,j){ return j!==i && normalize(y).length>nx.length && normalize(y).indexOf(nx)>-1; }); });
      return {id:e.id,label:e.label,count:h.length,hits:ev};
    }).filter(function(e){ return e.count>0; }).sort(function(a,b){ return b.count-a.count; });
    // مشاعر دلّت عليها المفاهيم (بدليلها من النص) إن لم يلتقطها المعجم
    (detectThemes.concepts||[]).forEach(function(c){
      c.emo.forEach(function(eid){
        if(negatedEmo.has(eid) || emotions.some(function(e){ return e.id===eid; })) return;
        var def=EMOTION_LEXICON.find(function(e){ return e.id===eid; });
        if(def) emotions.push({id:eid, label:def.label, count:1, hits:[c.ev]});
      });
    });
    // استنتاج مشاعر من الموضوعات إن لم تُذكر صراحة
    var implied={anger:"anger",sadness:"sadness",grief:"sadness",anxiety:"fear",fear:"fear",loneliness:"loneliness",despair:"despair",sin:"guilt",betrayal:"betrayal",insult:"shame",burnout:"exhaustion",decision:"confusion",envy:"jealousy",jealousy_spouse:"jealousy",heartbreak:"love"};
    themes.slice(0,3).forEach(function(t){
      var eid=implied[t.id]; if(!eid || negatedEmo.has(eid)) return;
      if(!emotions.some(function(e){return e.id===eid;})){
        var def=EMOTION_LEXICON.find(function(e){return e.id===eid;});
        if(def) emotions.push({id:eid,label:def.label,count:0,implied:true,hits:[]});
      }
    });
    var relations=RELATION_LEXICON.map(function(r){
      var h=lexHitsNeg(norm,userWords,r.words); return {id:r.id,label:r.label,count:h.length,word:h[0]?h[0].ev:""};
    }).filter(function(r){ return r.count>0; }).sort(function(a,b){ return b.count-a.count; });
    // موضوع مركّب: ظلم صريح من صاحب سلطة في العمل = «التعامل مع صاحب سلطة ظالم» (بأي لغة كُتب)
    var inj=themes.filter(function(t){ return t.id==="injustice" && t.hits.length; })[0];
    if(inj && !crisis && !themes.some(function(t){ return t.id==="oppressor_power"; }) &&
       (relations.some(function(r){ return r.id==="boss"; }) || themes.some(function(t){ return t.id==="work" && t.hits.length; }))){
      themes.push({id:"oppressor_power", theme:BY.theme.oppressor_power, score:inj.score*0.8, conf:inj.conf*0.8, hits:[]});
      themes.sort(function(a,b){ return b.score-a.score; }); themes=themes.slice(0,5);
    }
    var intens=lexHits(norm,userWords,INTENSIFIERS).length + ((raw.match(/[!！؟?]{2,}/g)||[]).length);
    var intensity = Math.min(3, 1 + (intens>=1?1:0) + (intens>=3?1:0) + (userWords.length>60?0.5:0));
    var selfFault = lexHitsNeg(norm,userWords,SELF_FAULT_CUES).length>0;
    // ما يحتاجه المتكلم (من صيغة كلامه) والزمن (مستمر/مضى/قادم)
    var NEED=window.NEED_CUES||{}, TIME=window.TIME_CUES||{};
    var needs=["safety","decision","repair","howto","why","comfort"].map(function(id){
      var h=lexHitsNeg(norm,userWords,NEED[id]||[],4); return {id:id, count:h.length, cue:h[0]?h[0].ev:""};
    }).filter(function(x){ return x.count>0; });
    var question=/[?؟]/.test(raw);
    // ضيق غير محدد («لست بخير»، «everything feels heavy»): نعرض قراءات محتملة بدل التخمين، ونبني توجيهًا عامًا من أولها
    var interp=(!crisis && window.NLU) ? NLU.interpret(userWords, norm, themes) : null;
    if(interp && !themes.length && BY.theme[interp.ids[0]])
      themes.push({id:interp.ids[0], theme:BY.theme[interp.ids[0]], score:1, conf:0.3, hits:[], vague:true});
    var distinctions=(detectThemes.concepts||[]).filter(function(c){ return c.distinction; }).map(function(c){ return {id:c.distinction, ev:c.ev}; });
    var times=["ongoing","future","past"].map(function(id){ return {id:id, count:lexHits(norm,userWords,TIME[id]||[]).length}; })
      .filter(function(x){ return x.count>0; }).sort(function(a,b){ return b.count-a.count; });
    return {raw:raw, norm:norm, words:userWords, stems:qStems, themes:themes, emotions:emotions.slice(0,4),
            relations:relations.slice(0,3), intensity:intensity, selfFault:selfFault, crisis:crisis, softRisk:softRisk,
            input:input, prep:prep, interpretations:interp?interp.ids:[], vagueCue:interp?interp.cue:"", distinctions:distinctions,
            needs:needs, question:question, focus:focus, time:times[0]?times[0].id:null,
            life:(detectThemes.life||[]).map(function(m){ return {n:m.n, text:m.item.t, section:m.item.s, sim:Math.round(m.sim*100)/100}; })};
  }

  /* ---------------- 4. الاسترجاع ---------------- */
  function legacySitScore(userWords, norm, s){
    var score=0;
    (s.keywords||[]).forEach(function(kw){
      var n=normalize(kw); if(!n) return;
      var ws=contentWords(n); if(!ws.length) return;
      var hit=ws.filter(function(w){ return wordHit(userWords,w) || userWords.some(function(u){ return stem(u)===stem(w); }); }).length;
      var r=hit/ws.length;
      if(r>=0.6) score+=2.2*r;
      if(phraseIn(norm,n)) score+=1.5;
    });
    return score;
  }
  function rankMap(map){ return Object.keys(map).map(function(id){return {id:id,score:map[id]};}).sort(function(a,b){return b.score-a.score;}); }

  function retrieve(u){
    var q=Object.create(null);
    u.stems.forEach(function(s){ q[s]=(q[s]||0)+1; });
    // توسيع الاستعلام بمفردات الموضوعات المكتشفة
    u.themes.slice(0,3).forEach(function(t){
      var add=stems(t.theme.label+" "+t.theme.triggers.slice(0,8).join(" "));
      add.forEach(function(s){ q[s]=(q[s]||0)+0.3*t.conf; });
    });
    var themeConf=Object.create(null); u.themes.forEach(function(t){ themeConf[t.id]=t.conf; });

    // المواقف
    var sitBm=IDX.sit.search(q), sits=[];
    SITUATIONS.forEach(function(s){
      var bm=sitBm[s.id]||0, lg=legacySitScore(u.words,u.norm,s), boost=0, via=[];
      (THEME_OF_SIT[s.id]||[]).forEach(function(tid){ if(themeConf[tid]){ boost+=2.6*themeConf[tid]; via.push(tid);} });
      if(u.selfFault && /الأخطاء|التوبة/.test(s.mainCategory+" "+s.semanticTags.join(" "))) boost+=0.8;
      var score=bm*0.9+lg*0.8+boost;
      if(score>0) sits.push({s:s, score:score, bm:bm, legacy:lg, via:via});
    });
    sits.sort(function(a,b){ return b.score-a.score; });

    function libRank(idx, lib, extra){
      var bm=idx.search(q), out=[];
      lib.forEach(function(it){
        if(it.sensitive && !u.crisis) return;   // نصوص خاصة بحالات الأزمة لا تظهر إلا عند وجود إشاراتها
        var b=bm[it.id]||0, boost=0, via=[];
        it.th.forEach(function(tid){ if(themeConf[tid]){ boost+=2.1*themeConf[tid]; via.push(tid);} });
        if(extra) boost+=extra(it);
        // بلا صلة موضوعية يُشترط تطابق نصي قوي حتى لا تظهر نصوص بعيدة عن الحالة
        if(!via.length && b<2.6) return;
        var s=b+boost; if(s>0.4) out.push({item:it, score:s, via:via});
      });
      return out.sort(function(a,b){ return b.score-a.score; });
    }
    var ayat=libRank(IDX.quran, QURAN_LIB);
    var hadith=libRank(IDX.hadith, HADITH_LIB);

    // إزالة الآيات/الأحاديث المكررة داخل الموقف الأول (تفادي التكرار في العرض)
    var top=sits[0]&&sits[0].s;
    var shownQ=new Set((top&&top.quranRefs||[]).map(function(r){return r.surahName+"|"+r.ayahNumber;}));
    ayat=ayat.filter(function(a){ return !shownQ.has(a.item.s+"|"+parseInt(a.item.a,10)); });

    // الأدعية: لا تُقترح إلا ما ارتبط بموضوعات الحالة نفسها
    var duas=[].concat(
      hadith.filter(function(h){return h.item.dua && h.via.length;}).map(function(h){return {kind:"hadith",item:h.item,score:h.score};}),
      ayat.filter(function(a){return a.item.dua && a.via.length;}).map(function(a){return {kind:"quran",item:a.item,score:a.score*0.9};})
    ).sort(function(a,b){return b.score-a.score;});
    // أدعية مقترحة من الموضوعات حتى لو ضعفت مطابقتها النصية
    if(duas.length<2){
      HADITH_LIB.filter(function(h){ return h.dua && h.th.some(function(t){return themeConf[t];}); })
        .forEach(function(h){ if(!duas.some(function(d){return d.item.id===h.id;})) duas.push({kind:"hadith",item:h,score:0.5}); });
    }
    if(!duas.length){ ["h-rahmataka","h-ahdini"].forEach(function(id){ duas.push({kind:"hadith",item:BY.hadith[id],score:0.1}); }); }
    return {
      sits:sits.slice(0,5),
      ayat:ayat.filter(function(a){return !a.item.dua;}).slice(0,5),
      hadith:hadith.filter(function(h){return !h.item.dua;}).slice(0,5),
      duas:duas.slice(0,4)
    };
  }

  /* ---------------- 5. التركيب: بناء التحليل العميق ---------------- */
  function uniq(arr){ var seen=new Set(); return arr.filter(function(x){ var k=normalize(x).slice(0,60); if(seen.has(k)) return false; seen.add(k); return true; }); }

  /* القراءة الأولى «الذكية»: من تكون في هذا الموقف؟ ماذا تشعر وبأي كلمات؟ ماذا تحتاج؟ ما الذي يتجاذبك؟
     ولماذا اخترنا هذا الموقف بالذات؟ وما الذي ينقصنا لنفهم أدق؟ — كلها قواعد شفافة دون توليد */
  /* إشارات أزمة بلغات أخرى (تُطبَّع وقت المقارنة، فتصلح للأردية بحروفها) */
  var CRISIS_EXTRA=[
    // Deutsch
    "selbstmord","suizid","mich umbringen","bringe mich um","bring mich um","mir das leben nehmen","mein leben beenden","meinem leben ein ende","will sterben","will nicht mehr leben",
    "möchte sterben","sterben will","sterben möchte","nicht mehr leben will","nicht mehr leben möchte","lebensmüde","mich selbst verletzen","mir etwas antun","mich ritzen","wäre lieber tot","wünschte ich wäre tot",
    // Bahasa Melayu
    "nak mati","mahu mati","ingin mati","tak mahu hidup","tidak mahu hidup","tak nak hidup","tamatkan hidup","menamatkan hidup","cederakan diri","mencederakan diri","sakiti diri","menyakiti diri sendiri",
    // فارسی
    "خودکشی","می‌خواهم بمیرم","میخواهم بمیرم","میخوام بمیرم","دلم میخواد بمیرم","دوست دارم بمیرم","خودم را بکشم","خودمو بکشم","به زندگی‌ام پایان","به زندگیم پایان","نمی‌خواهم زنده بمانم","نمیخوام زنده بمونم","نمی‌خواهم زندگی کنم","نمیخوام زندگی کنم",
    "به خودم آسیب","خودزنی","کاش مرده بودم","آرزوی مرگ دارم",
    // বাংলা
    "আত্মহত্যা","মরে যেতে চাই","মরতে চাই","বাঁচতে চাই না","বেঁচে থাকতে চাই না","নিজেকে শেষ করে","নিজেকে মেরে","জীবন শেষ করে","নিজের ক্ষতি","নিজেকে আঘাত","মরে গেলেই ভালো","মরে যাওয়াই ভালো",
    "مرنا چاہتا","مرنا چاہتا","مرنا چاہتی","مر جانا چاہتا","مر جانا چاہتی","جینا نہیں چاہتا","جینا نہیں چاہتی","اپنی جان لے","خود کو نقصان","خود کو مار",
    "bunuh diri","mau mati","pengen mati","mengakhiri hidup","menyakiti diri","tidak ingin hidup","tak ingin hidup","lebih baik mati",
    "intihar","olmek istiyorum","kendimi oldur","hayatima son","yasamak istemiyorum","kendime zarar","keske olsem","ölmek istiyorum","kendimi öldür","hayatıma son","yaşamak istemiyorum","keşke ölsem",
    // العربية: صيغ الاسم والعامية التي لم يلتقطها النمط السابق (و«اؤذي» لا تظهر بعد التطبيع لأن ؤ تصير و)
    "إيذاء نفسي","إيذاء النفس","أؤذي نفسي","أجرح نفسي","جرح نفسي","أضر نفسي","أضر بنفسي","أضرب نفسي","أقطع شراييني","أقطع عروقي","أبتلع الحبوب","جرعة زائدة",
    "إنهاء حياتي","لإنهاء حياتي","أنهي حياتي","لا أريد العيش","لا أريد الحياة","لا أرغب في الحياة","ما عاد بدي عيش","ما بدي عيش","ما بدي اعيش","مش عايز أعيش","مش عاوز أعيش",
    "ما نحبش نعيش","ما بغيتش نعيش","ما ابي اعيش","ما ابغى اعيش","نحب نموت","ليتني لم أولد","أتمنى لو لم أولد","ليتني مت","الموت أفضل","الموت أحسن","أفضل لو مت","لو مت لارتاح",
    "أختفي من هذه الدنيا","أختفي من الدنيا","أختفي من الوجود",
    "cut myself","cutting myself","overdose","end it all","dont want to live","don't want to live","better off dead","no point living","no point in living"];
  var WRONGED=/injustice|insult|betrayal|slander|oppressor_power|ungrateful|gossip/;
  var GRIEF=/(^| )grief/;
  function deepRead(u, r){
    var D={}, rel=u.relations[0], t0=u.themes[0];
    var qw=I18N.q;
    var lc=function(x){ return /^[A-ZÀ-Ý]/.test(x) && !/^I/.test(x) ? x.charAt(0).toLowerCase()+x.slice(1) : x; };
    var relL=rel?(rel.word?qw(lc(rel.word)):rel.label):"";
    var has=function(id){ return u.emotions.some(function(e){ return e.id===id && !e.implied; }); };
    var hasAny=function(id){ return u.emotions.some(function(e){ return e.id===id; }); };
    // الموضوعات التي التُقط لها لفظ صريح فقط تحدد الموقع (لا التي جاءت بالتوسيع وحده)
    var tid=u.themes.slice(0,3).filter(function(t){ return t.hits && t.hits.length; }).map(function(t){ return t.id; }).join(" ");
    // رعاية فعلية: لا يكفي «زوجي + تعبت» ليكون المتكلم راعيًا
    var CARE=/رعايه|ارعي|اعتني|اهتم به|مريض|مرض|care|caring|look after|looking after|sick|ill |illness|disabled|verzorg|zorg voor|ziek|cuido|cuidar|cuidando|enferm|doente|cuidado de|m occupe|soigne|malade|handicap|دیكه بهال|ديكه بهال|خدمت|بيمار|merawat|mengurus|sakit|bakiyorum|bakim|hasta|engelli/;
    var careCue=CARE.test(u.norm+" ");
    // موقع المتكلم
    if(u.crisis) D.role={id:"pain", text:T("ما كتبته يحمل ألمًا شديدًا، وأول ما يهمنا سلامتك")};
    else if(u.selfFault) D.role={id:"erred", text:T("تتحدث من موقع من أخطأ ويريد الإصلاح")};
    else if(has("guilt") && !has("betrayal") && t0 && /^(gossip|sin|honesty|addiction|argument|arrogance|anger|revenge|suspicion|ungrateful|trust_amanah)$/.test(t0.id)) D.role={id:"erred", text:T("تتحدث من موقع من أخطأ ويريد الإصلاح")};
    else if(t0 && t0.hits && t0.hits.length && (t0.id==="grief" || (t0.id==="heartbreak" && has("sadness")))) D.role={id:"grieving", text:T("تتحدث من موقع من فقد عزيزًا")};
    else if(t0 && WRONGED.test(t0.id) || has("betrayal") || has("shame")) D.role={id:"wronged", text:T("تتحدث من موقع من وقع عليه الأذى")};
    else if(GRIEF.test(tid)) D.role={id:"grieving", text:T("تتحدث من موقع من فقد عزيزًا")};
    else if(rel && hasAny("exhaustion") && (careCue ? /child|parent|spouse|sibling/.test(rel.id) : /child|parent/.test(rel.id) && !/marriage|kin/.test(tid))) D.role={id:"carer", text:T("تحمل عبء رعاية {0} أو مسؤوليته",relL)};
    else if(rel && /child|parent|spouse|sibling|friend/.test(rel.id) && hasAny("fear")) D.role={id:"worried", text:T("يشغلك أمر {0} وتقلق عليه",relL)};
    else if(/decision/.test(tid) || u.needs.some(function(n){return n.id==="decision";}) || hasAny("confusion")) D.role={id:"deciding", text:T("تقف أمام قرار لم تحسمه بعد")};
    // المشاعر مع الدليل من كلماتك
    D.feelings=u.emotions.map(function(e){ return {label:e.label, implied:!!e.implied, ev:(e.hits||[]).slice(0,3)}; });
    // الحاجة: من صيغة الكلام، ثم من الموقع
    var nd=u.needs[0]? u.needs[0].id : (D.role && {wronged:"comfort",grieving:"comfort",erred:"repair",deciding:"decision",carer:"howto",worried:"howto",pain:"safety"}[D.role.id]) || (u.question?"howto":null);
    var NEEDTXT={safety:T("سلامتك أولًا: أن تكون في مأمن قبل أي تأمل"),decision:T("أن تحسم قرارًا وأنت مطمئن إلى أنه الأقرب للصواب"),
      repair:T("أن تصلح ما انكسر وتعرف من أين تبدأ"),howto:T("خطوات عملية واضحة: ماذا تفعل الآن؟"),
      why:T("أن تفهم معنى ما حدث وحكمته"),comfort:T("أن يُسمع ألمك ويُفهم قبل أي نصيحة")};
    if(nd) D.need={id:nd, text:NEEDTXT[nd], cue:u.needs[0]?u.needs[0].cue:"", inferred:!u.needs[0]};
    // ما يتجاذبك (توترات داخلية)
    var ten=[];
    if((hasAny("love")) && (has("anger")||has("betrayal")) && rel) ten.push(T("بين محبتك لـ{0} وألمك مما حدث منه",relL));
    else if(hasAny("love") && (has("anger")||has("betrayal"))) ten.push(T("بين تعلقك بمن تحب وألمك مما حدث"));
    if(has("anger") && (has("guilt")||u.selfFault)) ten.push(T("بين غضبك من غيرك ولومك لنفسك"));
    if(hasAny("exhaustion") && rel && /parent|child|spouse/.test(rel.id) && (careCue || D.role && D.role.id==="carer")) ten.push(T("بين واجبك تجاه {0} وحاجتك أنت إلى الراحة",relL));
    if(hasAny("fear") && D.need && D.need.id==="decision") ten.push(T("بين رغبتك في الحسم وخوفك من الاختيار الخاطئ"));
    if(has("sadness") && hasAny("love") && !ten.length) ten.push(T("حزن مصدره المحبة؛ فبقدر ما تحب تتألم"));
    if(u.selfFault && (has("shame")||hasAny("fear"))) ten.push(T("بين ندمك على ما فعلت وخوفك من نظرة الناس"));
    if(has("despair") && u.question) ten.push(T("بين يأس تشعر به وسؤال يدل على أنك ما زلت تبحث عن مخرج"));
    D.tension=ten.slice(0,2);
    // الزمن
    var TIMETXT={ongoing:T("موقف مستمر منذ مدة، لا حادثة عابرة"),past:T("أمر وقع وانتهى، وأثره ما زال فيك"),future:T("قلقك مما سيأتي أكثر مما وقع")};
    if(u.time) D.time={id:u.time, text:TIMETXT[u.time]};
    // لماذا هذا الموقف؟
    var top=r.sits[0];
    if(top){
      var s=top.s, shared=(THEME_OF_SIT[s.id]||[]).filter(function(id){ return u.themes.some(function(t){ return t.id===id; }); }).map(themeLabel);
      D.why={id:s.id, title:s.title, figure:s.sourceType==="quran", shared:shared.slice(0,3), problem:s.problemType, response:s.responseType};
    }
    // ما ينقص لتكون القراءة أدق (نقرة تضيف بداية جملة إلى نصك)
    var gaps=[];
    var RELATIONAL=/marriage|jealousy_spouse|heartbreak|marriage_seek|parenting|parents|siblings|kin|friends|betrayal|forgive|revenge|suspicion|gossip|slander|neighbors|work|leadership|injustice|insult|oppressor_power|argument|ungrateful|different_belief|anger/;
    if(!u.relations.length && (!t0 || RELATIONAL.test(tid))) gaps.push({label:T("من الطرف الآخر؟"), add:T("الطرف الآخر هو ")});
    if(!u.emotions.some(function(e){return !e.implied;})) gaps.push({label:T("بماذا تشعر؟"), add:T("أشعر ")});
    if(!u.needs.length) gaps.push({label:T("ماذا تريد أن يحدث؟"), add:T("أريد ")});
    if(u.words.length<14) gaps.push({label:T("ماذا حدث بالتفصيل؟"), add:T("ما حدث هو أن ")});
    if(!u.time && u.words.length<40) gaps.push({label:T("منذ متى؟"), add:T("بدأ هذا منذ ")});
    D.gaps=gaps.slice(0,4);
    // سؤال تحمله معك
    // السؤال من الموضوع المشترك بين حالتك والموقف المختار (أقرب لما تسأل عنه)، وإلا فمن الموضوع الأول
    var shareT=top && u.themes.filter(function(t){ return (THEME_OF_SIT[top.s.id]||[]).indexOf(t.id)>-1 && t.theme.questions.length; })[0];
    var qt=shareT || u.themes.filter(function(t){ return t.theme.questions.length; })[0];
    D.question=qt ? qt.theme.questions[0] : "";
    return D;
  }

  /* التحليل الأعمق («قراءة المختص»): كل سطر مشروط بدليل من كلام المستخدم أو بما فهمه المحرك، ويُعرض مع دليله.
     نصوص تأملية من ANALYSIS_TEXT لا تشخيص فيها، ولا تُخلط بالنصوص الشرعية */
  function specialistRead(u, r, D){
    var A=window.ANALYSIS_TEXT, C=window.ANALYSIS_CUES||{}; if(!A) return null;
    var S={}, t0=u.themes[0], rel=u.relations[0];
    var cue=function(id){ return C[id] ? lexHitsNeg(u.norm,u.words,C[id]).map(function(h){ return h.ev; }) : []; };
    var role=D.role?D.role.id:"general";
    // الأزمة: لا تحليل للأنماط ولا تفاصيل؛ السلامة أولًا
    if(u.crisis){
      S.control={mine:T(A.ctl.pain[0]), not:T(A.ctl.pain[1])};
      S.strengths=[{text:T(A.str.voice)}];
      S.priority=T(A.pri.safety);
      return S;
    }
    // جوهر الموقف: الموضوع الأول، ثم زاوية الموضوع الثاني إن كان مسنودًا بلفظ صريح
    // (الفضائل كالشكر والصبر لا تتصدر الجوهر ما دام في الكلام موضوع مشكلة صريح: «صبرت والحمد لله» ليست هي المشكلة)
    var VIRTUE=/^(gratitude|patience|hope|charity)$/, cand=u.themes.slice(0,3), prob=cand.filter(function(t){ return !VIRTUE.test(t.id) && t.hits && t.hits.length; });
    if(prob.length) cand=prob.concat(cand.filter(function(t){ return prob.indexOf(t)<0; }));
    // من وقع عليه الأذى: موضوع الأذى نفسه أولًا (لا «سوء الظن» إن التُقط معه)
    var hurt=role==="wronged" && u.themes.filter(function(t){ return WRONGED.test(t.id); })[0];
    if(hurt) cand=[hurt].concat(cand.filter(function(t){ return t!==hurt && t.id!=="suspicion"; }));
    var c0=cand[0], c1=cand[1];
    S.core=[];
    if(c0 && A.lens[c0.id]) S.core.push({label:c0.theme.label, text:T(A.lens[c0.id])});
    if(c1 && A.lens[c1.id] && ((c1.hits && c1.hits.length) || c1.life) && c1.conf>=0.45 && !VIRTUE.test(c1.id)) S.core.push({label:c1.theme.label, text:T(A.lens[c1.id])});
    // ما وراء المشاعر: المصرّح بها أولًا، وإلا المحتمل الأول
    var em=u.emotions.filter(function(e){ return !e.implied; }); if(!em.length) em=u.emotions.slice(0,1);
    if(em.length>1) em=em.filter(function(e){ return e.id!=="joy"; });
    S.beneath=em.slice(0,2).filter(function(e){ return A.emo[e.id]; }).map(function(e){ return {label:e.label, implied:!!e.implied, text:T(A.emo[e.id])}; });
    // طبيعة العلاقة
    if(rel && A.rel[rel.id]) S.relation={label:rel.label, text:T(A.rel[rel.id])};
    // أنماط التفكير، كل نمط مع الكلمات التي دلت عليه
    var pats=[], seen=new Set();
    var addPat=function(id, ev){
      // دليل بلا تكرار: «it's all my fault» تُغني عن «all my fault»
      ev=ev.map(normalize).filter(function(k,i,a){ return !seen.has(k) && !a.some(function(o,j){ return j!==i && o.length>k.length && o.indexOf(k)>-1; }) && a.indexOf(k)===i; })
        .map(function(k){ seen.add(k); return ev.filter(function(x){ return normalize(x)===k; })[0]; });
      if(ev.length && A.pat[id]) pats.push({id:id, name:T(A.pat[id].name), text:T(A.pat[id].text), ev:ev.slice(0,3)});
    };
    var abs=cue("absolute"), absSoft=cue("absoluteSoft");
    if(abs.length || absSoft.length>=2) addPat("absolute", abs.concat(absSoft));
    ["label","catastrophe","selfblame","mindread","should","compare"].forEach(function(id){ addPat(id, cue(id)); });
    S.patterns=pats.slice(0,3);
    // ما بيدك وما ليس بيدك
    var ctl=A.ctl[role]||A.ctl.general;
    S.control={mine:T(ctl[0]), not:T(ctl[1])};
    // مواطن القوة: من كلماتك أولًا، ثم من صيغة كلامك وموقعك
    var str=[];
    var faith=cue("faith"), effort=cue("effort"), pat=cue("patience");
    if(faith.length) str.push({text:T(A.str.faith), ev:faith.slice(0,2)});
    if(effort.length) str.push({text:T(A.str.effort), ev:effort.slice(0,2)});
    if(pat.length) str.push({text:T(A.str.patience), ev:pat.slice(0,2)});
    if(u.selfFault) str.push({text:T(A.str.honesty)});
    if(role==="carer" || role==="worried") str.push({text:T(A.str.care)});
    if(u.emotions.some(function(e){ return e.id==="joy" && !e.implied; }) && !faith.length) str.push({text:T(A.str.gratitude)});
    if(u.question || u.needs.some(function(n){ return /howto|decision|repair/.test(n.id); })) str.push({text:T(A.str.seeking)});
    if(!str.length) str.push({text:T(A.str.voice)});
    S.strengths=str.slice(0,3);
    // إشارات تستحق الانتباه (لا تشخيص: دعوة إلى العناية والاستشارة فقط)
    var sig=[], sl=cue("sleep"), bd=cue("body");
    if(sl.length) sig.push({text:T(A.sig.sleep), ev:sl.slice(0,2)});
    if(bd.length) sig.push({text:T(A.sig.body), ev:bd.slice(0,2)});
    var lonely=u.emotions.some(function(e){ return e.id==="loneliness" && !e.implied; }) || (t0 && t0.id==="loneliness");
    if(lonely && u.time==="ongoing") sig.push({text:T(A.sig.isolation)});
    if(u.intensity>=2.5 && u.time==="ongoing" && /sadness|despair|anxiety|burnout|loneliness|grief|waswasa|self_worth/.test(u.themes.slice(0,2).map(function(t){ return t.id; }).join(" "))) sig.push({text:T(A.sig.heavy)});
    S.signals=sig.slice(0,3);
    // الأولوية الآن
    var nd=D.need?D.need.id:null;
    S.priority=T(nd==="safety" ? A.pri.safety
      : (sl.length||bd.length) && (u.intensity>=2 || hasEmo(u,"exhaustion")) ? A.pri.relief
      : pats.length>=2 ? A.pri.lens
      : nd && A.pri[nd] ? A.pri[nd]
      : u.intensity>=2.5 ? A.pri.relief
      : pats.length ? A.pri.lens : A.pri.howto);
    return S;
  }
  function hasEmo(u, id){ return u.emotions.some(function(e){ return e.id===id; }); }

  function composeReading(u, r){
    var parts=[];
    var rel=u.relations[0], t0=u.themes[0], t1=u.themes[1];
    var emo=u.emotions.filter(function(e){return !e.implied;}).map(function(e){return e.label;});
    var emoImp=u.emotions.filter(function(e){return e.implied;}).map(function(e){return e.label;});
    if(t0){
      parts.push(T("يدور ما كتبته أساسًا حول «{0}»",t0.theme.label)+(t1?T("، ويتقاطع مع «{0}»",t1.theme.label):"")+(rel?T("، في سياق علاقتك بـ{0}",rel.label):"")+(I18N.lang==="bn"?"।":"."));
    } else if(rel){
      parts.push(T("يدور ما كتبته حول علاقتك بـ{0}.",rel.label));
    }
    if(emo.length) parts.push(T("تظهر في كلماتك مشاعر {0}، وهي مشاعر مفهومة لا تُلام عليها في ذاتها؛ المهم ما نفعله بها.",(function(l){return (I18N.en&&l.length>1)?l.slice(0,-1).join(T("، "))+T(" و")+l[l.length-1]:l.join(T(" و"));})(emo.slice(0,3))));
    else if(emoImp.length) parts.push(T("قد يصاحب موقفًا كهذا شعور بـ{0}، حتى لو لم تذكره صراحة.",emoImp.slice(0,2).join(T(" أو "))));
    if(u.intensity>=2.5) parts.push(T("يبدو أن الموقف ثقيل عليك ومستمر منذ مدة، لذلك سنبدأ بما يخفف الضغط الآن قبل الخطط البعيدة."));
    if(u.selfFault) parts.push(T("ولاحظت أنك تتحدث عن خطأ وقع منك؛ والاعتراف بالخطأ نصف الطريق، فالهدي النبوي يفتح لك باب الإصلاح لا باب جلد الذات."));
    else if(t0 && /injustice|insult|betrayal|slander|oppressor_power/.test(t0.id)) parts.push(T("وموقعك هنا موقع من وقع عليه الأذى؛ والمنهج النبوي يعترف بحقك أولًا، ثم يعرض عليك خيارات أرفع دون أن يُلزمك بها."));
    if(r.sits[0]) parts.push(T("وأقرب ما وجدته لحالتك: «{0}».",r.sits[0].s.title));
    return parts.join(" ");
  }

  function analyze(raw, opts){
    build();
    var u=understand(raw, opts);
    var r=retrieve(u);
    var topThemes=u.themes.slice(0,2).map(function(t){return t.theme;});
    // الخطة العملية: من الموضوعين الأعلى + تطبيقات الموقف الأول
    var plan={now:[],week:[],long:[]};
    topThemes.forEach(function(t,i){
      var n=i===0?3:2;
      plan.now=plan.now.concat(t.plan.now.slice(0,n));
      plan.week=plan.week.concat(t.plan.week.slice(0,n));
      plan.long=plan.long.concat(t.plan.long.slice(0,n));
    });
    if(r.sits[0]) plan.week=plan.week.concat(r.sits[0].s.modernApplications.slice(0,1));
    plan.now=uniq(plan.now).slice(0,4); plan.week=uniq(plan.week).slice(0,5); plan.long=uniq(plan.long).slice(0,4);

    var questions=uniq([].concat.apply([],topThemes.map(function(t){return t.questions.slice(0,2);}))).slice(0,4);
    var avoid=uniq([].concat.apply([],topThemes.map(function(t){return t.avoid.slice(0,2);}))
      .concat(r.sits[0]?r.sits[0].s.whatToAvoid.slice(0,1):[])).slice(0,5);
    var help=uniq(u.themes.slice(0,3).map(function(t){return t.theme.help;}).filter(Boolean));

    var topScore=r.sits[0]?r.sits[0].score:0, themeScore=u.themes[0]?u.themes[0].score:0;
    // «مطابقة قوية» تتطلب فهمًا مسنودًا بدليل (لفظ صريح أو موقف حياتي مشابه)، لا مجرد تشابه نصي مع قصة؛
    // وبلا أي موضوع مفهوم لا تتجاوز المطابقة «متوسطة» (ويظهر للمستخدم اقتراح إضافة تفاصيل عند «ضعيفة»)
    var evidence=u.themes.some(function(t){ return (t.hits && t.hits.length) || t.life; });
    var confidence = !u.themes.length ? (topScore>=7 ? "mid" : "low")
      : (themeScore>=3 || (topScore>=7 && evidence)) ? "high" : (topScore>=3 || themeScore>=1.5) ? "mid" : "low";
    if(u.focus) confidence="mid";   // الموضوع من اختيار المستخدم لا من دليل في نصه

    var deep=deepRead(u,r), analysis=specialistRead(u,r,deep);
    // القراءة الأولية العميقة (js/reading.js) إن توفرت أدلتها، وإلا القراءة المختصرة
    var rd=null; try{ rd=window.READING ? READING.compose(u,r,deep,analysis) : null; }catch(e){ rd=null; }
    var reading=rd ? rd.text : composeReading(u,r);
    return {
      input:raw, understanding:u, retrieval:r, reading:reading, readingInfo:rd, deep:deep, analysis:analysis,
      insights:topThemes.map(function(t){return {label:t.label, text:t.insight, id:t.id};}),
      plan:plan, questions:questions, avoid:avoid, help:help, confidence:confidence
    };
  }

  /* يبني السياق النصي المسترجع لنموذج اللغة (وضع RAG التوليدي الاختياري) */
  function contextFor(a){
    var r=a.retrieval, L=[];
    L.push(T("## الموضوعات المكتشفة"));
    a.understanding.themes.forEach(function(t){ L.push("- "+t.theme.label+" ("+T("ثقة")+" "+Math.round(t.conf*100)+"%)"); });
    if(a.understanding.emotions.length) L.push(T("المشاعر:")+" "+a.understanding.emotions.map(function(e){return e.label;}).join(T("، ")));
    if(a.understanding.relations.length) L.push(T("العلاقة:")+" "+a.understanding.relations.map(function(e){return e.label;}).join(T("، ")));
    L.push(T("المتكلم يعترف بخطأ منه:")+" "+(a.understanding.selfFault?T("نعم"):T("لا")));
    var D=a.deep||{};
    if(D.role) L.push(T("موقع المتكلم:")+" "+D.role.text);
    if(D.need) L.push(T("ما يحتاجه على الأرجح:")+" "+D.need.text);
    if(D.tension&&D.tension.length) L.push(T("ما يتجاذبه:")+" "+D.tension.join(T("؛ ")));
    if(D.time) L.push(T("الزمن:")+" "+D.time.text);
    var S=a.analysis;
    if(S){
      L.push("\n"+T("## تحليل أعمق (تأملي، ليس تشخيصًا)"));
      (S.core||[]).forEach(function(c){ L.push("- "+c.label+": "+c.text); });
      (S.patterns||[]).forEach(function(p){ L.push("- "+T("نمط في التفكير:")+" "+p.name+" ("+p.ev.join(T("، "))+")"); });
      (S.signals||[]).forEach(function(s){ L.push("- "+T("إشارة تستحق الانتباه:")+" "+s.text); });
      if(S.priority) L.push("- "+T("الأولوية الآن")+": "+S.priority);
    }
    L.push(T("درجة المطابقة:")+" "+{high:T("مطابقة قوية"),mid:T("مطابقة متوسطة"),low:T("مطابقة ضعيفة")}[a.confidence]);
    var life=a.understanding.life||[];
    if(life.length){
      L.push("\n"+T("## مواقف حياتية مشابهة (لفهم الموقف فقط، وليست نصوصًا شرعية)"));
      life.forEach(function(m){ L.push("- "+m.text); });
    }
    L.push("\n"+T("## مواقف من السيرة والقرآن (مسترجعة)"));
    r.sits.slice(0,4).forEach(function(x,i){
      var s=x.s;
      L.push("[S"+(i+1)+"] "+s.title+"\n"+T("الواقعة:")+" "+s.eventDescription+"\n"+T("المبادئ:")+" "+s.principles.join(T("؛ "))+
        (s.notToApplyTo.length?"\n"+T("حدود التطبيق:")+" "+s.notToApplyTo.join(T("؛ ")):"")+
        (s.hadithRefs||[]).map(function(h){return "\n"+T("نص:")+" «"+h.text+"»"+(h.te?" — “"+h.te+"”":"")+" — "+I18N.src(h.source)+" ("+I18N.grade(h.grade)+")"+(h.paraphrase?" "+T("[خلاصة بالمعنى]"):"");}).join("")+
        (s.quranRefs||[]).map(function(q){return "\n"+T("آية:")+" ﴿"+q.text+"﴾ ["+I18N.ref(q.surahName,q.ayahNumber)+"]"+(I18N.en?" — “"+I18N.quranEn(q.surahName,q.ayahNumber)+"”":"");}).join(""));
    });
    L.push("\n"+T("## آيات (مسترجعة)"));
    r.ayat.forEach(function(x,i){ L.push("[Q"+(i+1)+"] ﴿"+x.item.t+"﴾ ["+I18N.ref(x.item.s,x.item.a)+"]"+(I18N.en?" — “"+I18N.quranEn(x.item.s,x.item.a)+"”":"")+" — "+T("فائدة:")+" "+x.item.n); });
    L.push("\n"+T("## أحاديث (مسترجعة)"));
    r.hadith.forEach(function(x,i){ L.push("[H"+(i+1)+"] «"+x.item.t+"»"+(x.item.te?" — “"+x.item.te+"”":"")+" — "+x.item.r+" — "+I18N.src(x.item.src)+" — "+T("الدرجة:")+" "+I18N.grade(x.item.g)); });
    L.push("\n"+T("## أدعية مأثورة (مسترجعة)"));
    r.duas.forEach(function(x,i){ var it=x.item; L.push("[D"+(i+1)+"] "+(x.kind==="quran"?"﴿"+it.t+"﴾ ["+I18N.ref(it.s,it.a)+"]":"«"+it.t+"»"+(it.te?" — “"+it.te+"”":"")+" — "+I18N.src(it.src))); });
    L.push("\n"+T("## القراءة القرآنية النبوية للموضوعات"));
    a.insights.forEach(function(x){ L.push("- "+x.label+": "+x.text); });
    return L.join("\n");
  }

  return {normalize:normalize, stem:stem, stems:stems, analyze:analyze, understand:understand, build:build,
          contextFor:contextFor, cueHits:function(u, list){ return lexHitsNeg(u.norm, u.words, list||[]).map(function(h){ return h.ev; }); }, byId:function(kind,id){ build(); return BY[kind][id]; }, themeLabel:themeLabel};
})();
