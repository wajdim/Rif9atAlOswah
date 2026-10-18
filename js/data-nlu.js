/* ======================================================================
   رِفقة الأُسوة — بيانات طبقة الفهم (NLU data, used by js/nlu.js)
   ----------------------------------------------------------------------
   Nothing in this file is ever shown to the user, and none of it is religious text.
   It only helps the engine understand how people actually write:
   - concepts   multilingual co-occurrence rules. A concept fires when every group
                ("all") has at least one phrase in the message. It then votes for
                themes (th: weight) and emotions (emo). Dialect vocabulary
                (Tunisian, Maghrebi, Egyptian, Levantine, Gulf) lives here too.
                A phrase ending in * matches any word starting with it.
   - vague      phrases of unspecific distress → the engine offers interpretations
   - crisis     explicit self-harm / suicide intent (always shown the crisis card)
   - soft       hopelessness without stated intent (gentle safety check-in)
   - arabizi    Latin-script Arabic: function words, prefixes and cue words
   - vocab      extra dialect words so Arabizi skeleton matching can find them
   - commonEn   frequent English words that spelling correction must never "fix"
   ====================================================================== */
var NLU_DATA = {

concepts: [
  /* ---------- relationships: help returned with harm ---------- */
  {id:"help_returned_badly", th:{ungrateful:1, betrayal:0.6, charity:0.3}, emo:["betrayal"], all:[
    ["help*","helped","did everything for","supported","stood by","gave him","gave her","gave them","was there for","sacrific*","giving",
     "ساعدت*","ساعدته","ساعدتها","عاونت*","عاونتو","عاونتها","وقفت معه","وقفت معاه","وقفت معاها","وقفت جنبه","قدمت*","اعطيت*","اعطي","نعطي","نعاون","اعاون",
     "خدمته","ضحيت","عملت معاه","عملت معاها","درت معاه","احسنت اليه","احسنت اليها","ساعدتهم","وقفت معهم","عملت لهم"],
    ["badly","bad*","turned his back","turned her back","turned against","ignor*","nobody","no one","ungrateful","betray*","forgot me","doesn t care","doesnt care",
     "abandon*","hurt me","used me","insult*","disappoint*","never thanked","no thanks","took advantage",
     "لا يرد","ما يردش","نكر*","تنكر","تخلى","تخلي","قلب*","وجهه","وجهو","اساء","يتجاهل*","نسي*","خذل*","لا احد","ما حد","محدش","حتى واحد","ولا احد",
     "استغل*","اهان*","جرحني","باعني","خيب*","خيبه","لا يعطيني","ما يعطينيش","ما حد يعاوني","لا احد يساعدني","ما شكرنيش","لم يشكرني"]]},
  {id:"how_could_they", th:{betrayal:1, ungrateful:0.5}, emo:["betrayal"], all:[
    ["how could he","how could she","how could they","how could you","after everything i","after all i did","after all i ve done","after everything",
     "بعد كل ما","بعد كل اللي","كيف استطاع","كيف استطاعت","كيف قدر","كيفاش نجم","ازاي قدر","ازاي قدرت","بعد كل هذا","بعد اللي عملتو"]]},
  {id:"friend_betrayal", th:{betrayal:1.4, friends:0.6}, emo:["betrayal"], all:[
    ["صاحبي","صاحبتي","رفيقي","رفيقتي","صديقي","صديقتي","صاحبه","صحبتي","my friend","best friend","frend","friend","cousin","colleague","coworker"],
    ["خانني","خانتني","غدر*","خدعني","خدعتني","بيخدعني","يخدعني","باعني","باعتني","حكى سري","حكات سري","قال سري","فضحني","فضح سري","طعنني",
     "betray*","lied to me","told my secret","told everyone my secret","stabbed me in the back","backstab*","cheated me","deceived me"]]},
  {id:"disrespect", th:{insult:1, self_worth:0.7}, emo:["shame"], all:[
    ["don t respect me","dont respect me","do not respect me","doesn t respect me","no respect","disrespect*","look down on me","belittl*","humiliat*","mock me","mocking me","laugh at me",
     "لا يحترمون*","لا يحترمني","لا تحترمني","ما يحترمونيش","ما يحترمنيش","ما تحترمنيش","ما يحترموني","مش بيحترموني","لا يقدرونني","يستصغرونني","يحتقرونني","يحتقرني",
     "يحقرني","يحقرو*","يهزقني","بيهزقني","بيهزقوني","يهينني","يستهزئ*","يتمسخر*","يضحكو عليا","يضحكون علي","يستهزا بي","يتريق*","يحتقر*","يذلني","يصغرني"]]},
  {id:"gossip_behind", th:{gossip:1.4}, all:[
    ["تحكي عليا","يحكيو عليا","يحكو عليا","يتكلمو عليا","يتكلمو علي","يتكلمون عني","يتكلمن عني","يتكلمو عني","في ظهري","من وراي","من ورايا","من وراء ظهري","في غيابي","بيتكلموا عليا",
     "behind my back","talking about me","talk about me","gossip*","spreading rumors","spreading rumours"]]},
  {id:"slander", th:{slander:1.5}, all:[
    ["lies about me","lying about me","posted lies","spread lies","false accusation","falsely accused","accused me","ruin my reputation","ruined my reputation","my reputation",
     "اكاذيب عني","يكذبون علي","نشر عني","نشرو عليا","نشروا عني","تهمه","اتهموني","اتهمني","لفقو","لفقوا","سمعتي","شوهو سمعتي","شوهوا سمعتي"]]},
  {id:"forgive_dialect", th:{forgive:1.6}, all:[
    ["نسامح*","اسامح","اسامح*","سامحه","سامحها","اسامحه","اسامحها","نعفو","اعفو","العفو عنه","العفو عنها","forgiv*","pardon","let it go"]]},
  {id:"forgive_vs_repeated_harm", th:{boundaries:1.2, forgive:1}, distinction:"forgive_vs_abuse", all:[
    ["apologiz*","apologis*","says sorry","said sorry","forgiving","forgive","اعتذر","يعتذر","يتعذر","يطلب السماح","اسامحه","سامحته","نسامحو","مسامحته"],
    ["again","does it again","keeps doing","every time","each time","over and over","كل مره","كلما","ثم عاد","يعاود","يرجع يعاود","مره اخرى","نفس الشيء","مرارا","ديما يعاود","كل مرة"]]},
  {id:"or_not", th:{decision:0.6}, all:[["ولا لا","ام لا","او لا","or not","ou pas"]]},
  {id:"in_laws", th:{kin:1, boundaries:0.8, marriage:0.5}, all:[
    ["mother in law","father in law","in laws","in law","حماتي","حماي","عجوزتي","نسيبتي","اهل زوجي","اهل زوجتي","اهل راجلي","اهل مرتي","ام زوجي","ام زوجتي","اهل جوزي"]]},
  {id:"siblings_cutoff", th:{siblings:1.4}, all:[
    ["خويا","ختي","اختي","اخي","اخويا","اخوي","my brother","my sister","brother","sister"],
    ["ما عادش يكلمني","ما عادش تكلمني","stopped talking","stopped speaking","doesn t talk to me","won t talk to me","قاطعني","قاطعتني","مقاطعني","مش بيكلمني","ما يكلمنيش","لا يكلمني","ما بيحكي معي"]]},
  {id:"friends_excluded", th:{friends:1, loneliness:1}, emo:["loneliness"], all:[
    ["stopped inviting me","don t invite me","dont invite me","left me out","leave me out","excluded","never invite me",
     "لم يعودوا يدعونني","ما عادش يعرضو عليا","ما عادوش يدعوني","نسوني","تجاهلوني","ما يعرضوش عليا","لا يدعونني"]]},

  /* ---------- marriage & family (dialect vocabulary + paraphrases) ---------- */
  {id:"spouse_terms", th:{marriage:0.7}, all:[
    ["جوزي","جوزها","مراتي","مرتي","ريلي","حرمتي","راجلي","زوجي","زوجتي","الراجل متاعي","المرا متاعي","my wife","my husband","husbnd","wife","husband","spouse"]]},
  {id:"spouse_conflict", th:{marriage:1.3}, all:[
    ["جوزي","مراتي","مرتي","ريلي","حرمتي","راجلي","زوجي","زوجتي","my wife","my husband","husbnd","wife","husband"],
    ["ما تحبش تحكي","ما تحكيش معايا","ما يحكيش معايا","مش عايزه تتكلم","مش عايز يتكلم","مش طايقاني","مش طايقني","ما بقاش كيهضر","ما بقاتش كتهضر","ما يهتم فيني","ما يهتمش بيا",
     "ما تهتمش بيا","لا يهتم بي","doesn t care about me","doesnt care about me","doesn t talk to me","won t talk to me","زعلانه","زعلان","غضبانه","غضبان","طلعت بيت اهلها","راحت لدار اهلها",
     "يتعارك معايا","تتعارك معايا","يتخاصم","تتخاصم","يتعاركو","نتعاركو","نتخاصمو","بيزعقلي","يزعق","يصيح عليا","تصيح عليا","يغلط عليا","fight*","argu*","yell*","shout*","blames me","يلومني","تلومني",
     "عم تتهمني","يتهمني","تتهمني","ما بهتم فيها","يضربني","hits me"]]},
  {id:"marriage_distance", th:{marriage:1.4}, all:[
    ["live like roommates","like roommates","like strangers at home","under one roof","barely talk anymore","we barely talk","كالغرباء","تحت سقف واحد","كيف الغرباء","زي الغرب"]]},
  {id:"marriage_late", th:{marriage_seek:1.4}, all:[
    ["تاخر زواجي","تاخر الزواج","لم اتزوج بعد","ما تزوجتش","ما زلت ما تزوجتش","still not married","not married yet","still single","late marriage","no one proposes","لا احد يتقدم","ما حد يتقدم"]]},
  {id:"child_not_listening", th:{parenting:1.5}, all:[
    ["وليدي","ولدي","بنتي","صغاري","اولادي","عيالي","ابني","ابنتي","طفلي","my son","my daughter","my child","my kid*","dauhgter","daughter","son","kids","children","teenager","weldi"],
    ["ما يسمعش","ما يسمعوش","ما تسمعش","ما كيسمعش","ما كتسمعش","مش بيسمع","مش بتسمع","ما يسمع","لا يسمع","لا يسمعون","ما عم يسمع","ما يطيع","لا يطيع","يعصيني","يعاندني","عنيد",
     "doesn t listen","doesnt listen","don t listen","not listening","won t listen","disobe*","ignores us","ignores me","talks back","rebel*"]]},
  {id:"child_screens", th:{digital:1, parenting:0.8}, all:[
    ["phone","screen","screens","tiktok","games","gaming","الهاتف","التلفون","البورطابل","الشاشه","الالعاب","التيليفون","الموبايل"],
    ["all day","ليلا ونهارا","ignores us","لا يترك","ما يخليش","نهار كامل","طول النهار","طول اليوم","addicted","glued"]]},
  {id:"spouse_checks_phone", th:{jealousy_spouse:1.3, suspicion:0.8}, all:[
    ["checks my phone","check my phone","goes through my phone","reads my messages","يفتش هاتفي","يفتش تلفوني","يفتح تلفوني","يفتش موبايلي","يراقبني","تراقبني","يشك في","تشك في","doesn t trust me"]]},
  {id:"parents_impose", th:{parents:1, decision:1}, all:[
    ["يحب يفرض","يفرضو","يفرض عليا","يريدونني ان","يريدني ان","يحبوني نقرا","force me","forcing me","forces me","want me to study","wants me to study","want me to marry","wants me to marry","يجبرونني","يجبرني","يغصبوني"]]},
  {id:"sick_family", th:{illness:1.2}, all:[
    ["hospital","chemo","cancer","المستشفى","المستشفي","السبيطار","الكيميائي","سرطان"]]},
  {id:"violence_home", th:{marriage:0.4}, emo:["fear"], all:[["hits me","beats me","hit me","يضربني","تضربني","ضربني","ضربتني","يعنفني"]]},

  /* ---------- work & leadership ---------- */
  {id:"work_terms", th:{work:0.6}, all:[
    ["خدمتي","الخدمه","في الخدمه","الشاف","الشيف","الباطرون","الباترون","شغلي","الشغل","بالشغل","الدوام","دوامي","المدير بتاعي","رئيس العمل","الشركه","شركتي","الخدامه","الموظفين","مديري",
     "manager","my boss","boss","at work","my job","workplace","office","coworker*","colleague*","wrok","the company","promotion","promot*","الjob","job"]]},
  {id:"job_loss_fear", th:{work:1, fear:0.8, rizq:0.6}, emo:["fear"], all:[
    ["lose my job","losing my job","lose the job","get fired","be fired","fired","laid off","layoff*","نفقد عملي","افقد عملي","نخسر خدمتي","نخسر الخدمه","نفقد الخدمه","نخسر الjob","نخسر ال job",
     "ماشيه تطيح","يطردوني","يطردني","نتطرد","باش يطردوني","نفقد الخدمه ديالي","نفقد الخدمة","يستغنو عني","يستغنوا عني"]]},
  {id:"promotion_except_me", th:{self_worth:1, work:0.8, comparison:0.8}, all:[
    ["promot*","ترقي*","ترقو*","ترقوا","ترقيه","تترقى","raise"],
    ["except me","but me","not me","الا انا","الا أنا","وانا لا","و انا لا","غيري","ما عدايا","الا انايا"]]},
  {id:"team_mistake", th:{leadership:1.5}, all:[
    ["my team","team","فريقي","الفريق","موظف*","my staff","my employees","team member","one person in my team","under me","تحت مسؤوليتي"],
    ["mistake*","error*","missed deadline*","missing deadline*","failed","failure","messed up","خطا","غلط*","اخطا*","تقصير","يقصر","مقصر","لا ينجز","فشل"]]},
  {id:"blamed_unfairly", th:{injustice:1.4, work:0.5}, all:[
    ["blamed me","blame me","they blamed","blaming me","حملوني","يحملني","لاموني","حطو فيا","رماو عليا"],
    ["colleague","someone else","coworker","didn t do","did not do","not my fault","زميلي","غيري","ما عملتوش","ما درتوش","ليس ذنبي","موش ذنبي","خطا زميلي"]]},
  {id:"injustice_words", th:{injustice:1.2}, all:[
    ["treated me unfairly","unfair*","injust*","mistreat*","oppress*","ظلمني","ظلموني","يظلمني","يظلمونني","عم يظلمني","عم يظلموني","ظالم","تظلم","مظلوم","مظلومه","حقرني","حقروني"]]},
  {id:"dishonest_request", th:{honesty:1.2, decision:0.6, work:0.4}, all:[
    ["sign something","not honest","dishonest","lie for","cover up","fake","ask me to lie","asked me to lie","يطلب مني الكذب","طلب مني نكذب","نزور","تزوير","نغش","غش"]]},

  /* ---------- emotions (dialect + paraphrase) ---------- */
  {id:"anger_dialect", th:{anger:1.4}, emo:["anger"], all:[
    ["معصب","معصبه","متعصب","نتقلق بسرعه","نغضب بسرعه","اغضب بسرعه","نتنرفز","متنرفز","متنرفزه","عصبي","عصبيه","نعصب","angery","angry","furious",
     "can t control my anger","cant control my anger","control my anger","controlling my anger","lose my temper","lost my temper","temper","scream","rage","تتحكم في غضب","نتحكم في روحي","اتحكم في غضبي","نتحكم في اعصابي"]]},
  {id:"sadness_dialect", th:{sadness:1.2}, emo:["sadness"], all:[
    ["مكتئب","مكتئبه","اكتئاب","depressed","depresed","depression","حزين","حزينه","مضايق","متضايق","متضايقه","مضايقه","زعلان","زعلانه","مقهور","مقهوره","قلبي محروق","مغموم","مهموم",
     "ضايق","خاطري مكسور","الزعل","crying","cry","can t stop crying","البكاء","نبكي","نبكي برشا","heartbroken","miserable"]]},
  {id:"upset_maghreb", th:{anxiety:1, sadness:0.7}, emo:["fear"], all:[["مقلق","مقلقه","متقلق","متقلقه","قلقان","قلقانه"]]},
  {id:"anxiety_somatic", th:{anxiety:1.5}, emo:["fear"], all:[
    ["heart is racing","heart racing","heart beating fast","heart pounding","panic","panic attack","can t breathe","cant breathe","can t calm down","cant calm down",
     "قلبي يدق","قلبي يخفق","دقات قلبي","نوبه هلع","هلع","لا استطيع ان اهدا","ما نجمش نهدا","مش قادر اهدى","ضيق تنفس","مخنوق","مخنوقه",
     "can t sleep","cant sleep","ما نجمش نرقد","ما نرقدش","ما عم نام","ما عم بنام","لا انام","ما نمتش","ما نقدرش نرقد","overthink*","نفكر برشا","عم فكر كتير","افكر كثيرا","التفكير الزائد"]]},
  {id:"fear_future", th:{anxiety:1, fear:1}, emo:["fear"], all:[
    ["خايف","خايفه","نخاف","خائف","scared","afraid","fear","terrified","worried","worry","anxious","انا خايف"],
    ["المستقبل","مستقبلي","اللي جاي","اللي جاى","اش غادي يوقع","future","what will happen","what s coming","tomorrow","الغد","بكره","غدوه"]]},
  {id:"burnout_dialect", th:{burnout:1.3}, emo:["exhaustion"], all:[
    ["ما عادش نجم نستحمل","ما عادش نجم","ما عاد نقدر","ما عدت اقدر","ما عدت احتمل","لا استطيع التحمل","مش قادر استحمل","مش قادره استحمل","تعبت","تعبان","تعبانه","عييت","عيانه","عيان",
     "منهك","منهكه","هلكت","مهلوك","exhausted","drained","burned out","burnt out","burnout","tired of everything","so tired","زهقت","زهقان","زهقانه","ما عندي طاقه","ما عاد عندي طاقه","لا طاقه لي",
     "ضاغط عليا","مضغوط","مضغوطه","pressure","stresed","stressed","stress"]]},
  {id:"loneliness_dialect", th:{loneliness:1.3}, emo:["loneliness"], all:[
    ["وحدي","لوحدي","لحالي","وحيد","وحيده","lonley","lonely","alone","محدش بيسال","ما حد يسال","حتى حد ما يسال","لا احد يسال","ما عندي حتى حد","ما عندي حد",
     "no one to talk to","nobody to talk to","eat alone","no friends","بلا صحاب","ما عنديش صحاب"]]},
  {id:"envy_specific", th:{envy:1.4, comparison:0.6}, emo:["jealousy"], all:[
    ["jealous","jealousy","jelous","envy","envious","غيره","غيران","غيرانه","نغير من","اغار من","احسد","حسدت","نحسد","كنحسد"],
    ["friend","frend","colleague","sister","brother","cousin","success","others","everyone","people","صاحبي","صديق*","صحابي","زميل*","اختي","اخي","نجاح*","الناس","نجحو","نجحوا"]]},
  {id:"jealous_plain", th:{envy:1.6}, emo:["jealousy"], all:[["i feel jealous","i m jealous","im jealous","feeling jealous","i get jealous","feel envious"]]},
  {id:"comparison_success", th:{comparison:1.2, envy:0.5, self_worth:0.4}, all:[
    ["everyone else","all my friends","everyone around me","صحابي الكل","صحابي","اصحابي","كل اصدقائي","الناس الكل","كل الناس","everyone"],
    ["succeed*","success*","got married","promoted","نجحو","نجحوا","تزوجو","تزوجوا","ترقو","عندهم","better than me","ahead of me","وانا لا","و انا لا","except me"]]},
  {id:"social_comparison", th:{comparison:1.5}, all:[
    ["instagram","tiktok","facebook","social media","snapchat","انستغرام","تيك توك","فيسبوك","السوشيال"],
    ["failure","better than","perfect","my life","compare","jealous","فاشل","احسن مني","حياتهم","نقارن"]]},
  {id:"self_confidence", th:{self_worth:1.5}, all:[
    ["ثقه بنفسي","ثقه في نفسي","ثقتي بنفسي","ثقه بروحي","ما نثقش في روحي","no confidence","low confidence","self confidence","self esteem","worthless","not good enough",
     "i m useless","im useless","i am useless","i m a failure","im a failure","i am a failure","فاشل","فاشله","ما نسوى شي","ما نسواش","لا قيمه لي"]]},
  {id:"humble_vs_doormat", th:{boundaries:1, self_worth:0.8}, distinction:"humility_vs_humiliation", all:[
    ["humble","humility","تواضع","متواضع"],
    ["walk over","walk all over","take advantage","step on me","doormat","humiliat*","يدوسو","يستغلو*","اهانه","ضعف","weakness"]]},
  {id:"people_opinion", th:{people_pleasing:1.4}, all:[
    ["what people think","what people will say","what others think","what they think of me","ماذا سيقول الناس","اش يقولو الناس","شنوه يقولو الناس","كلام الناس","نظره الناس","شنوة يقولو الناس","ايش يقولون الناس"]]},
  {id:"humiliation_feeling", th:{insult:1.2}, emo:["shame"], all:[["humiliated","humiliation","الاهانه","بالاهانه","مهان","مذلول","انكسار","مكسور الخاطر"]]},

  /* ---------- faith ---------- */
  {id:"dua_unanswered", th:{faith_weak:1.3, hope:1.1, patience:0.8}, all:[
    ["dua","duaa","doa","praying","pray","prayed","prayers","making dua","دعاء","ادعو","ندعو","دعوت","دعيت","ندعي","نطلب من ربي","اطلب من الله","الدعاء"],
    ["not answer*","no answer","unanswered","nothing changes","nothing chang*","not chang*","doesn t answer","isn t answering","for years","never answered","no response","not heard",
     "لا ارى استجابه","لا يستجيب","ما يستجيب*","لم يستجب","ولا استجابه","بدون استجابه","ما تستجابش","منذ سنوات","من سنين","ولا شيء يتغير","ما تبدل شي","لا شيء يتغير","ما فماش استجابه","ما صار شي"]]},
  {id:"iman_weak", th:{faith_weak:1.5}, all:[["iman","imaan","eman","faith"],["weak","low","gone","dying","decreas*","down","fading"]]},
  {id:"prayer_empty", th:{faith_weak:1.5}, all:[
    ["don t feel anything when i pray","feel nothing when i pray","no khushu","no khushoo","can t focus in salah","can t focus in prayer","لا اشعر بالخشوع","لا خشوع","ما نحسش بالصلاه",
     "نصلي وما نحس","ما عادش نصلي","ما عدت اصلي","تركت الصلاه","stopped praying","quit praying","don t pray anymore","dont pray anymore","قلبي قاسي","قسوه قلبي"]]},
  {id:"repentance_worry", th:{sin:1.5}, emo:["guilt"], all:[
    ["repent*","tawba","توبه","توبتي","تبت","نتوب","will allah forgive","allah forgive me","god forgive me","يغفر لي","يقبل توبتي","ما يقبلش توبتي","same sin","نفس الذنب","يغفر الله لي"]]},
  {id:"guilt_dialect", th:{sin:1.2}, emo:["guilt"], all:[["ذنب","مذنب","مذنبه","نحس بالذنب","guilty","guilt","ashamed of what i did","تانيب الضمير","ضميري"]]},
  {id:"made_mistake", th:{sin:1.1}, emo:["guilt"], all:[
    ["i made a mistake","i made a serious mistake","i made a big mistake","i made a terrible mistake","i messed up","i screwed up","my fault","i regret","i did something wrong",
     "غلطه كبيره","غلطت","عملت غلطه","ارتكبت خطا","ارتكبت خطاا","اخطات","خطئي","ندمان","ندمانه","نادم","نادمه","اندم"]]},
  {id:"repented_still_guilty", th:{sin:1.2, waswasa:0.8}, emo:["guilt"], all:[
    ["repented","تبت","tawba","توبه"],
    ["still feel guilty","keep feeling guilty","guilt doesn t leave","الاحساس بالذنب لا يتركني","ما زلت احس بالذنب","الذنب لا يفارقني","لا يتركني","ما زال","still"]]},
  {id:"faith_doubts", th:{waswasa:1.4}, all:[
    ["doubts about my faith","doubts about islam","doubt*","شكوك في","شكوك","نشك في وجود","existence of god","وجود الله","is islam true","شك في الدين"]]},
  {id:"why_me", th:{patience:1.3, despair:0.5}, all:[
    ["why does everything bad happen to me","why me","why is this happening to me","why does this always happen to me","لماذا يحدث لي","علاش ديما انا","علاش انا","ليش انا","ليه انا","لماذا انا","يا رب ليش","ليش يصير معي"]]},
  {id:"allah_took", th:{grief:1.2, patience:0.8}, emo:["sadness"], all:[
    ["allah take","allah took","god took","god take","why did allah take","took my"],
    ["baby","son","daughter","child","mother","father","husband","wife","brother","sister"]]},
  {id:"new_page", th:{hope:1.3, sin:0.4}, all:[
    ["صفحه جديده","start over","new beginning","fresh start","come back to allah","return to allah","get closer to allah","نرجع لربي","نبدا من جديد","ابدا من جديد","اقترب من الله"]]},
  {id:"tawakkul_vs_inaction", th:{laziness:1.8, decision:1, hope:0.6}, distinction:"tawakkul_vs_inaction", all:[
    ["leaving it to allah","leave it to allah","tawakkul","توكلت","متوكل","نتوكل","سايبها على ربي","خليتها على ربي"],
    ["instead of","not looking","didn t look","without looking","ولم ابحث","وما نلوجش","ما نقلبش","بدون ما","ولا اعمل شيء","doing nothing","not working","ما نخدمش"]]},
  {id:"patience_vs_weakness", th:{patience:1.2, decision:1, injustice:0.6}, distinction:"patience_vs_passivity", all:[
    ["patience or weakness","صبر ام ضعف","صبر ولا ضعف","staying silent","stay silent","سكوتي","نسكت","اسكت","keep quiet"],
    ["weak*","ضعف","patience","صبر","injust*","ظلم","coward*"]]},
  {id:"justice_vs_revenge", th:{revenge:1, injustice:1}, distinction:"justice_vs_revenge", all:[["justice","حقي","my right","my rights","عدل"],["revenge","انتقام","ننتقم","الانتقام"]]},
  {id:"anger_ego", th:{arrogance:0.8, self_worth:0.8, anger:0.6}, distinction:"anger_ego_vs_justice", all:[
    ["didn t greet me","didnt greet me","ignored my greeting","ما سلمش عليا","ما سلم علي","didn t thank me","wasn t invited","لم يسلم علي","my pride","كرامتي","كبريائي","didn t respect my position"]]},
  {id:"anger_for_others", th:{injustice:1.3, anger:0.8}, distinction:"anger_ego_vs_justice", all:[
    ["mistreating my","oppressing","bullying my","لانهم يظلمون","يظلمون","يظلمو","يعتدون على","يحقرو في"],
    ["mother","sister","brother","father","old","child","the poor","اختي","امي","ابي","اخي","الضعيف","الصغيره","الصغير"]]},
  {id:"religious_disagreement", th:{argument:1.4, friends:0.4}, distinction:"disagreement_vs_conflict", all:[
    ["disagree on a religious","religious opinion","مساله فقهيه","fiqh","madhhab","مذهب","اختلفنا في مساله","خلاف فقهي"]]},

  {id:"decision_dialect", th:{decision:1.5}, emo:["confusion"], all:[
    ["ما نعرفش شنوه نعمل","ما نعرفش اش نعمل","ما نعرفش شنعمل","ما بعرف شو بدي اعمل","ما بعرف شو اعمل","ما ادري شسوي","ما ادري وش اسوي","ما عرفتش اش ندير","مش عارف اعمل ايه",
     "مش عارفه اعمل ايه","لا اعرف ماذا افعل","what to do","don t know what to do","dont know what to do","what should i do","can t decide","cant decide","حاير","حايره","محتار","محتاره",
     "choose between","هل اختار","نختار بين","ما نعرفش شنختار"]]},
  {id:"breakup", th:{heartbreak:1.7}, emo:["sadness"], all:[
    ["فسخت الخطوبه","فسخ الخطوبه","فسخنا","فسخت","breakup","broke up","break up","she left me","he left me","سابتني","سابني","تركتني","قلبي مكسور","انفصلنا","heart is broken","my heart is broken"]]},
  {id:"i_lied", th:{honesty:1.5}, emo:["guilt"], all:[["كذبت على","i lied","lied to my","نكذب على","كذبت عليهم","j ai menti"]]},
  {id:"revenge_anger", th:{revenge:0.5}, emo:["anger"], all:[["revenge","انتقم","ننتقم","انتقام","اخذ حقي بيدي","ناخذ حقي بيدي"]]},
  {id:"depression_word", th:{sadness:1.6, despair:0.3}, emo:["sadness"], all:[["depressed","depresed","depression","مكتئب","مكتئبه","اكتئاب","تعبان نفسيا","تعبانه نفسيا","نفسيتي تعبانه","قلبي محروق"]]},
  {id:"death_of_relative", th:{grief:1.5}, emo:["sadness"], all:[
    ["مات","ماتت","توفي","توفيت","توفى","died","passed away","passed"],
    ["جدي","جدتي","امي","ابي","بابا","ماما","اخي","اختي","ابني","بنتي","زوجي","زوجتي","صديقي","grandfather","grandmother","grandpa","grandma","mother","father","mom","dad","brother","sister","friend","son","daughter"]]},

  /* ---------- loss, money, study, life changes ---------- */
  {id:"lost_loved_one", th:{grief:1.4}, emo:["sadness"], all:[
    ["lost someone","lost my mother","lost my father","lost my mom","lost my dad","lost my son","lost my daughter","lost my wife","lost my husband","lost my brother","lost my sister",
     "lost my baby","lost my child","lost my grandmother","lost my grandfather","lost my friend","passed away","grandmther","died","funeral","perdi a mi","perdí a mi","perdi a minha","perdi o meu",
     "j ai perdu ma","j ai perdu mon","ik ben mijn","verloren","توفا","توفات","مشى لربي","مشات لربي","الله يرحمه","الله يرحمها","ربي يرحمو","ربي يرحمها"]]},
  {id:"money_dialect", th:{rizq:1, poverty:0.6}, all:[
    ["فلوس","ما عنديش فلوس","الكراء","نخلص الكراء","الراتب ما يكفي","الشهريه ما تكفيش","الفلوس مش مكفيه","الفلوس","money","can t pay rent","rent","broke","salary","الراتب","المصروف"]]},
  {id:"debt_dialect", th:{debt:1.4}, all:[
    ["ديون","ديوني","الديون","det","debt*","loan*","قروض","القروض","كريدي","الكريدي","قرض","مديون","مديونه","owe","dividas","dívidas","deudas","dettes","schulden","borc","hutang"]]},
  {id:"study_stress", th:{study:1.2, anxiety:0.8}, all:[
    ["exam","exams","الباك","باكالوريا","امتحان","الامتحان","الامتحانات","test","finals","concours","الكونكور"],
    ["stress*","scared","terrified","خايف","خايفه","قلقان","قلقانه","stressed","afraid","nervous","killing me","قاتلني"]]},
  {id:"abroad", th:{ghurba:1.4}, all:[
    ["abroad","nobody here speaks my language","foreign country","far from home","far from my family","في الغربه","برا البلاد","توحشت بلادي","توحشت اهلي","نتوحش","اشتقت لبلدي",
     "homesick","miss my family","miss home","dying to see my family","miss my country","moved abroad"]]},
  {id:"transition", th:{transition:1.3}, all:[
    ["new city","moved to a new","new country","new school","new job","مدينه جديده","انتقلنا","انتقلت","رحلنا","بلاد جديده","مدرسه جديده"]]},
  {id:"burden", th:{despair:1, self_worth:0.6}, all:[["burden","عبء","عاله","حمل ثقيل","ثقل على"]]},
  {id:"no_way_out", th:{despair:1.5}, emo:["despair"], all:[
    ["no way out","can t see any way out","cant see any way out","لا مخرج","ما فماش حل","ما في حل","مسدوده","no point","pointless","ما فماش فايده","ما فماش حتى فايده","لا فائده","لا فايده",
     "ما في فايده","ما عاد في شي يستاهل","ما عاد شي يستاهل","what s the point","whats the point","nothing matters","hopeless"]]}
],

/* phrases of unspecific distress: the engine offers interpretations instead of guessing */
vague: [
  "not feeling good","not feel good","don t feel good","dont feel good","don t feel well","not feeling well","not okay","not ok","i m not okay","bad day","feels heavy","everything feels heavy",
  "heavy heart","weighing on me","weighs on me","something is wrong","feel empty","empty inside","feel lost","i feel lost","life is hard","things are hard","nothing makes me happy",
  "feel off","feel weird","strange feeling","not myself","tired of everything",
  "لست بخير","مش بخير","مانيش بخير","مانيش مرتاح","ما نيش مرتاح","مش مرتاح","لست مرتاحا","غير مرتاح","مانيش لاباس","ما نيش لاباس","مش كويس","مو زين","مو مرتاح","ما ادري شفيني",
  "شبيني","ما نعرفش شبيا","حالتي النفسيه","نفسيتي","نفسيتي تعبانه","كرهت كل شيء","كرهت كل شي","كرهت كلشي","ثقل","ثقيل","فراغ","ضائع","ضايع","تايه","يوم سيء","سيئا جدا",
  "لم يعد شيء يفرحني","ما عاد شي يفرحني","صدري ضيق","صدري مقبوض","تعبت من كل شيء","مش قادر","مخنوق",
  "je ne me sens pas bien","ca va pas","ça va pas","ik voel me niet goed","no me siento bien","nao me sinto bem","não me sinto bem","mir geht es nicht gut","iyi hissetmiyorum",
  "saya tidak baik","saya tak sihat"
],
/* which interpretation to offer first, from cues in the message */
vagueOrder: [
  {cue:["tired","exhaust","drain","تعب","عيي","منهك","زهق","طاقه"], first:["burnout","sadness","despair"]},
  {cue:["chest","heart","breath","worry","anxious","صدري","قلبي","مخنوق","قلق","خايف"], first:["anxiety","sadness"]},
  {cue:["empty","nothing makes","فراغ","يفرحني","فرح"], first:["sadness","faith_weak","despair"]},
  {cue:["lost","ضائع","ضايع","تايه","don t know"], first:["decision","sadness","anxiety"]},
  {cue:["alone","lonely","وحدي","لحالي","وحيد"], first:["loneliness","sadness"]}
],
vagueDefault: ["sadness","anxiety","burnout","loneliness","faith_weak"],

/* explicit self-harm or suicidal intent (adds to the patterns already in js/rag.js) */
crisis: [
  "ending it all","end it all","thinking about ending it","thinking of ending it","sleep and never wake up","go to sleep and not wake up","never wake up again","not wake up again",
  "better off without me","better off if i was gone","better off if i were gone","better off if i was dead","better off if i were dead","want to disappear forever","don t want to be alive",
  "dont want to be alive","don t want to exist","take my own life","take my life","can t go on living","cant go on living","not be here anymore","don t want to be here anymore",
  "انام ولا استيقظ","انام وما استيقظ","انام وما نفيقش","نرقد وما نفيقش","افضل بدوني","احسن بلايا","احسن من غيري","الكل سيكون افضل بدوني","الكل احسن بلايا","العالم افضل بدوني",
  "بغيت نموت","نبغي نموت","حابب اموت","حابه اموت","بدي موت","بدي اموت","نفسي اموت","عايز اموت","عاوز اموت","عايزه اموت","ابي اموت","ابغى اموت","ودي اموت","اتمنى الموت","تمنيت الموت",
  "ما عادش نحب نعيش","ما عادش حاب نعيش","ما بقيتش بغيت نعيش","مابقيتش بغيت نعيش","ما بدي عيش","مش عايز اعيش","مش عاوز اعيش","ما ابي اعيش","لم اعد اريد ان اعيش","لا اريد ان اعيش",
  "ننتحر","نقتل روحي","نذبح روحي","نجرح روحي","نضر روحي","نأذي روحي","ناذي روحي","اقتل روحي","نحرق روحي",
  "nheb nmout","n7eb nmout","nhebb nmout","nheb nemout","bghit nmout","nabghi nmout","baddi mout","bedi mout","3ayez amout","ma3adech nheb n3ich","ma3adch nheb n3ich","manhebch n3ich",
  "n9tel rou7i","nekteul rou7i","nentahar","nenta7er",
  "je veux disparaitre pour toujours","ik wil verdwijnen","quiero desaparecer para siempre","quero desaparecer para sempre"
],
/* hopelessness without stated intent: gentle safety check-in, the reading continues */
soft: [
  "no point anymore","no point in anything","no point to anything","what s the point","whats the point","what is the point","pointless","no way out","can t see any way out","cant see any way out",
  "i m a burden","im a burden","i am a burden","burden to everyone","burden to my family","give up on everything","give up on life","nothing matters","hopeless","can t go on","cant go on",
  "can t take it anymore","cant take it anymore","tired of life","tired of living","lost all hope","no hope left",
  "لا فايده","لا فائده","ما فيش فايده","ما فماش فايده","ما فماش حتى فايده","مافماش فايده","ما في فايده","ما عاد في شي يستاهل","ما عاد شي يستاهل","لا شيء يستحق","ما فيه شي يستاهل",
  "عبء على","عاله على","لا مخرج","ما فماش حل","ما في حل","مسدوده","تعبت من الحياه","زهقت من الحياه","كرهت الحياه","كرهت حياتي","ما عادش نجم نكمل","لا استطيع ان اكمل","لم اعد احتمل",
  "استسلمت","فقدت الامل في كل شيء","فقدت كل امل","ليتني مت","ليتني لم اخلق","يا ريتني ما خلقت","يا ريتني مت",
  "ca ne sert a rien","ça ne sert à rien","plus aucun sens","je suis un fardeau","heeft geen zin meer","ik ben een last","no tiene sentido","soy una carga","nao faz sentido","não faz sentido",
  "sou um fardo","hat keinen sinn mehr","ich bin eine last","hicbir anlami yok","hiçbir anlamı yok","yuk oluyorum","yük oluyorum","tidak ada gunanya","tak ada gunanya","menjadi beban",
  "کوئی فائدہ نہیں","بوجھ ہوں","فایده ای ندارد","فایده‌ای ندارد","سربار","কোনো লাভ নেই","বোঝা"
],

/* compositional safety rules: an intent and an ending-life target within a few words of each other.
   They generalise beyond fixed phrases («I've decided I won't be alive next year», «أريد أن أنهي هذا كله وأرحل عن الدنيا»). */
safetyCombos: [
  {level:"crisis", window:10,
   a:["want to","wanna","wish","going to","gonna","decided","decide","plan","planning","thinking about","thinking of","should just","will","about to","ready to","i ll","i m going",
      "اريد","اود","انوي","ناوي","قررت","افكر","نفكر","بديت نفكر","نحب","بغيت","حاب","حابب","ساقوم","رح","راح","بدي","عايز","عاوز"],
   b:["kill myself","end it all","end my life","end my own life","not be alive","not alive","not be here","disappear forever","leave this world","take pills","jump off","hang myself",
      "overdose","cut myself","hurt myself","myself alive",
      "ارحل عن الدنيا","ارحل من الدنيا","اغادر الدنيا","اغادر هذه الدنيا","اترك هذه الدنيا","ارحل عن هذا العالم","اقتل نفسي","نقتل روحي",
      "انتحر","ننتحر","اختفي من الدنيا","نختفي من الدنيا","اذي نفسي","نأذي روحي","اجرح نفسي","نجرح روحي"]},
  {level:"crisis", window:6,
   a:["don t see myself","can t see myself","cant see myself","لا ارى نفسي","ما نشوفش روحي","مش شايف نفسي"],
   b:["alive","living","حيا","عايش"]},
  {level:"soft", window:10,
   a:["nobody","no one","noone","ما حد","لا احد","محدش","ما حدا","ما حدش","حتى حد"],
   b:["if i disappeared","if i died","if i was gone","if i were gone","if i wasn t here","miss me if","لو اختفيت","لو مت","لو رحلت","لو غبت عن الدنيا","يلاحظ غيابي","يحس بغيابي"]},
  {level:"soft", window:3,
   a:["ما فيش","مافيش","ما فماش","مافماش","لا يوجد","ما في","مافي","ما عاد في","لم يعد هناك","no","not any","there s no","there is no","lost all"],
   b:["امل","hope"], notAfter:["that","he","she","they","in","for","ان","في","بان","انه","انها","من"]}
],

/* Latin-script Arabic (Arabizi) */
arabizi: {
  /* whole-word table, checked before skeleton matching */
  words: {
    "ana":"انا","enti":"انتي","inti":"انتي","enta":"انت","inta":"انت","howa":"هو","houwa":"هو","hiya":"هي","hia":"هي","ahna":"احنا","a7na":"احنا","nahna":"نحنا",
    "w":"و","wa":"و","ou":"و","ma":"ما","mech":"مش","mich":"مش","mouch":"موش","mosh":"مش","msh":"مش","mch":"مش","mush":"مش","fi":"في","f":"في","fel":"في ال","3la":"على","3al":"على","3lih":"عليه","3liha":"عليها",
    "el":"ال","l":"ال","il":"ال","b":"ب","bel":"بال","mel":"من ال","mn":"من","men":"من","min":"من","m3a":"مع","m3aya":"معايا","m3ah":"معاه","m3aha":"معاها",
    "barcha":"برشا","barsha":"برشا","brcha":"برشا","barcha2":"برشا","bzaf":"بزاف","bezzaf":"بزاف","bezaf":"بزاف","wayed":"وايد","ktir":"كتير","kteer":"كتير","awi":"اوي","awy":"اوي",
    "ya3ni":"يعني","chnowa":"شنوه","chnoua":"شنوه","chnwa":"شنوه","chnia":"شنيه","chbih":"شبيه","chbiya":"شبيا","kifech":"كيفاش","kifach":"كيفاش","3lech":"علاش","3lach":"علاش","lech":"علاش",
    "taw":"توا","tawa":"توا","toa":"توا","lyoum":"اليوم","lyouma":"اليوم","elyoum":"اليوم","dima":"ديما","daima":"ديما","bech":"باش","bch":"باش","bach":"باش",
    "mte3i":"متاعي","mta3i":"متاعي","mte3ek":"متاعك","mte3ou":"متاعو","dyali":"ديالي","diali":"ديالي","ki":"كي","kima":"كيما","kif":"كيف","zeda":"زاده","zada":"زاده",
    "9odem":"قدام","9oddem":"قدام","godem":"قدام","lkol":"الكل","kol":"كل","koll":"كل","kolchi":"كلشي","koulchi":"كلشي","7aja":"حاجه","7ajja":"حاجه","nes":"ناس","ennes":"الناس","nas":"ناس",
    "rabi":"ربي","rabbi":"ربي","allah":"الله","omi":"امي","ommi":"امي","oumi":"امي","mama":"ماما","yemma":"يما","baba":"بابا","bouya":"بويا","weldi":"ولدي","benti":"بنتي",
    "rajli":"راجلي","rajel":"راجل","mrati":"مرتي","mratou":"مرتو","khouya":"خويا","5ouya":"خويا","okhti":"اختي","o5ti":"اختي","sa7bi":"صاحبي","sahbi":"صاحبي","sa7bti":"صاحبتي",
    "chef":"الشاف","chaf":"الشاف","patron":"الباطرون","khedma":"خدمه","5edma":"خدمه","khedmti":"خدمتي","5edmti":"خدمتي","flous":"فلوس","floss":"فلوس",
    "nheb":"نحب","n7eb":"نحب","nhebb":"نحب","n7ebb":"نحب","nhab":"نحب","nmout":"نموت","nemout":"نموت","n3ich":"نعيش","na3ich":"نعيش","bghit":"بغيت","nabghi":"نبغي","baddi":"بدي","bedi":"بدي",
    "ma3adech":"ما عادش","ma3adch":"ما عادش","ma3adich":"ما عادش","mab9itch":"ما بقيتش","najem":"نجم","najjem":"نجم","nejjem":"نجم","najemch":"نجمش","najjamtech":"نجمتش","nnajjamch":"نجمش",
    "nest7amel":"نستحمل","nesta7mel":"نستحمل","nesthamel":"نستحمل","nor9od":"نرقد","nor9ed":"نرقد","nar9ed":"نرقد","norgod":"نرقد",
    "ta3ban":"تعبان","ta3bana":"تعبانه","t3ban":"تعبان","m9alle9":"مقلق","m9ale9":"مقلق","mgalleg":"مقلق","m9al9":"مقلق","mridh":"مريض","mridha":"مريضه","mrid":"مريض",
    "5ayef":"خايف","khayef":"خايف","5ayfa":"خايفه","khayfa":"خايفه","mosta9bal":"مستقبل","mostakbel":"مستقبل","mosta9bel":"مستقبل","nhes":"نحس","n7es":"نحس","nhess":"نحس","rou7i":"روحي","rouhi":"روحي",
    "wa7di":"وحدي","wahdi":"وحدي","wa7dek":"وحدك","5anni":"خانني","khanni":"خانني","5ani":"خانني","5anetni":"خانتني","nsame7ou":"نسامحو","nsame7":"نسامح","nsam7ou":"نسامحو","nsame7ha":"نسامحها",
    "y7a9arni":"يحقرني","y7a9rni":"يحقرني","yhakarni":"يحقرني","yetkhasem":"يتخاصم","yetkhasmou":"يتخاصمو","yet3arek":"يتعارك","yesma3ch":"يسمعش","yesma3":"يسمع","kelem":"كلام","klem":"كلام",
    "7ziin":"حزين","7zin":"حزين","hzin":"حزين","7zina":"حزينه","ma3asseb":"معصب","m3asseb":"معصب","mte9ale9":"متقلق","3malt":"عملت","3amalt":"عملت","dhanb":"ذنب","thanb":"ذنب",
    "na3mel":"نعمل","na3ref":"نعرف","na3rafch":"نعرفش","ma na3rafch":"ما نعرفش","zhe2t":"زهقت","zhe9t":"زهقت","zhagt":"زهقت","twaffa":"توفى","twafa":"توفى","twaffet":"توفات","mat":"مات","matet":"ماتت",
    "mosadde9":"مصدق","msadde9":"مصدق","ghalta":"غلطه","ghlat":"غلط","mekteeb":"مكتئب","mokta2eb":"مكتئب","9al9an":"قلقان","galgan":"قلقان","dhaye9":"ضايق","mdhaye9":"مضايق","mdaye9":"مضايق",
    "lahi":"لاهي","labes":"لاباس","labess":"لاباس","mriguel":"مريقل","mzeyen":"مزين","mrta7":"مرتاح","mreta7":"مرتاح","merta7":"مرتاح","manich":"مانيش","mnich":"مانيش","manech":"مانيش"
  },
  /* attached prefixes, longest first: Latin → Arabic */
  prefixes: [["wel","وال"],["bel","بال"],["fel","في ال"],["mel","من ال"],["lel","لل"],["el","ال"],["ma","ما "],["w","و"],["b","ب"],["l","ال"],["f","في "]],
  /* distinctive Arabizi words: two of them (or one word mixing letters and 2/3/5/7/9) mark a message as Arabizi */
  cue: ["ana","nmout","n3ich","barcha","barsha","brcha","bzaf","bezzaf","chnowa","chnoua","kifech","3lech","mte3i","mta3i","dyali","dima","nheb","n7eb","mech","mouch","lyoum","taw","tawa","bech",
        "ya3ni","wallah","rabi","inchallah","nhes","rou7i","omi","baba","weldi","rajli","mrati","khouya","flous","khedma","ma3adech","najem","manich","labes","sa7bi","9odem","kolchi","ennes"]
},

/* extra dialect words for Arabizi skeleton matching (no theme meaning by themselves) */
vocab: "انا انتي انت هو هي احنا ما مش موش في على عليه عليها ال من مع معايا برشا بزاف وايد كتير اوي يعني شنوه علاش كيفاش توا اليوم ديما باش متاعي ديالي كيما زاده قدام الكل كلشي حاجه الناس ربي امي ماما بابا ولدي بنتي " +
  "راجلي مرتي خويا اختي صاحبي الشاف خدمه خدمتي فلوس نحب نموت نعيش بغيت نبغي بدي عادش بقيتش نجم نجمش نجمتش نستحمل نرقد تعبان تعبانه مقلق مريض مريضه خايف خايفه مستقبل نحس روحي وحدي " +
  "خانني خانتني نسامح نسامحو يحقرني يتخاصم يتعارك يسمعش يسمع كلام حزين حزينه معصب عملت ذنب نعمل نعرف نعرفش زهقت توفى توفات مات ماتت مصدق غلطه مكتئب قلقان ضايق مضايق مرتاح مانيش لاباس " +
  "يزي توحشت نتوحش الغربه الدار الدراسه الباك الامتحان القراية نقرا صغاري عيالي حماتي جاري الجيران الكراء الديون الراتب الشهريه نخلص نصلي الصلاه الدعاء ندعي توبه تبت نتوب",

/* frequent English words: spelling correction leaves these alone */
commonEn: "the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when " +
  "make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because " +
  "any these give day most us is was are were been has had did does doing done am feel feels felt fell feeling still very much more really always never ever every everyone everything nothing something anything " +
  "someone anyone nobody life home family friends friend wife husband son daughter mother father mom dad brother sister child children kids boss job team money help helped hurt hurts told tell said says " +
  "why where while since until before again ago today tomorrow yesterday night week month years long little big bad better best worse worst sad happy angry scared afraid tired alone lost left right wrong " +
  "should shall must might may cannot cant dont doesnt didnt isnt wasnt wont im ive youre hes shes thats theres whats lets don doesn didn isn wasn won through those such own same few each both being here " +
  "down off too why please sorry thank thanks yes yeah okay ok maybe without against between under around keep keeps kept let lets put seem seems try tried trying call called ask asked need needs needed " +
  "made making mistake serious important someone treated unfairly respect disappointed problems problem pressure control controlling difficulty future losing listening listen insulted betrayed jealous forgive " +
  "failed failure lost love loved scared fear dua allah god prayer pray praying answer answering heavy weighing everything anymore point burden anyone hate hated cry crying"
};
