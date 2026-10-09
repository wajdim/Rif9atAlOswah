package com.rifqa.aluswa;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebResourceResponse;
import android.widget.FrameLayout;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * رِفقة الأُسوة — واجهة أندرويد: WebView يحمّل التطبيق من أصول الحزمة ويعمل بلا إنترنت.
 * تُخدم الملفات من أصل https خاص (appassets.androidplatform.net) بدل file:// ، فلا يحتاج
 * WebView إلى صلاحية الوصول إلى الملفات.
 */
public class MainActivity extends Activity {
    /** الأصل الخاص الذي تُخدم منه أصول التطبيق (نطاق محجوز لا يصل إلى الشبكة). */
    static final String ASSET_HOST = "appassets.androidplatform.net";
    static final String START_URL = "https://" + ASSET_HOST + "/assets/www/index.html";
    private static final Map<String, String> MIME = new HashMap<String, String>();
    static {
        MIME.put("html", "text/html"); MIME.put("js", "text/javascript"); MIME.put("css", "text/css");
        MIME.put("json", "application/json"); MIME.put("svg", "image/svg+xml"); MIME.put("png", "image/png");
        MIME.put("jpg", "image/jpeg"); MIME.put("webp", "image/webp"); MIME.put("ico", "image/x-icon");
        MIME.put("woff2", "font/woff2"); MIME.put("woff", "font/woff"); MIME.put("ttf", "font/ttf");
        MIME.put("mp3", "audio/mpeg"); MIME.put("txt", "text/plain");
    }
    private WebView web;
    private OnBackInvokedCallback backCallback;
    private TextToSpeech tts;
    /** init | ok | missing | none */
    private volatile String ttsState = "init";
    private volatile String ttsLang = "ar";
    private String[] pendingSpeak;   // طلب قراءة وصل قبل جاهزية المحرك

    /** جسر آمن ومحدود بين الصفحة والنظام: مشاركة ونسخ وقراءة صوتية فقط. */
    public class Bridge {
        @JavascriptInterface
        public void share(final String text) {
            runOnUiThread(new Runnable() { public void run() {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType("text/plain");
                i.putExtra(Intent.EXTRA_TEXT, text);
                String title = "en".equals(ttsLang) ? "Share" : "nl".equals(ttsLang) ? "Delen" : "es".equals(ttsLang) ? "Compartir" : "pt".equals(ttsLang) ? "Partilhar" : "مشاركة";
                startActivity(Intent.createChooser(i, title));
            }});
        }
        /** رسالة بريد جاهزة (ملاحظات، أو الإبلاغ عن إجابة الذكاء الاصطناعي) يراجعها المستخدم ويرسلها بنفسه. */
        @JavascriptInterface
        public void email(final String to, final String subject, final String body) {
            if (to == null || !to.matches("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}")) return;
            runOnUiThread(new Runnable() { public void run() {
                Intent i = new Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:"));
                i.putExtra(Intent.EXTRA_EMAIL, new String[]{to});
                i.putExtra(Intent.EXTRA_SUBJECT, subject);
                i.putExtra(Intent.EXTRA_TEXT, body);
                try { startActivity(i); }
                catch (Exception e) { share(to + "\n\n" + subject + "\n\n" + body); }   // لا يوجد تطبيق بريد
            }});
        }
        @JavascriptInterface
        public void copy(String text) {
            ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("rifqa", text));
        }

        /* ---- القراءة الصوتية (WebView لا يدعم speechSynthesis) ---- */
        @JavascriptInterface
        public String ttsStatus() { return ttsState; }

        /** لغة النطق: "ar" (افتراضي) أو "en" / "nl" للواجهتين الإنجليزية والهولندية */
        @JavascriptInterface
        public void ttsSetLang(final String lang) {
            runOnUiThread(new Runnable() { public void run() {
                ttsLang = ("en".equals(lang) || "nl".equals(lang) || "es".equals(lang) || "pt".equals(lang)) ? lang : "ar";
                if (tts != null && !"none".equals(ttsState) && !"init".equals(ttsState)) {
                    int r = tts.setLanguage(new Locale(ttsLang));
                    ttsState = (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) ? "missing" : "ok";
                    notifyJs("0", "voices");
                }
            }});
        }

        @JavascriptInterface
        public void ttsSpeak(final String id, final String text, final float rate, final float pitch, final String voice) {
            runOnUiThread(new Runnable() { public void run() {
                if (tts == null || "none".equals(ttsState)) { notifyJs(id, "error"); return; }
                if ("init".equals(ttsState)) { pendingSpeak = new String[]{id, text, String.valueOf(rate), String.valueOf(pitch), voice}; return; }
                speakNow(id, text, rate, pitch, voice);
            }});
        }

        /** أصوات لغة النطق المتاحة: [{name, lang, network, quality, gender?}] */
        @JavascriptInterface
        public String ttsVoices() {
            JSONArray out = new JSONArray();
            try {
                Set<Voice> vs = tts == null ? null : tts.getVoices();
                if (vs != null) for (Voice v : vs) {
                    if (v.getLocale() == null || !ttsLang.equals(v.getLocale().getLanguage())) continue;
                    if (v.getFeatures() != null && v.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) continue;
                    JSONObject o = new JSONObject();
                    o.put("name", v.getName()); o.put("lang", v.getLocale().toString());
                    o.put("network", v.isNetworkConnectionRequired()); o.put("quality", v.getQuality());
                    // بعض المحركات (مثل Samsung) تذكر الجنس ضمن الخصائص
                    if (v.getFeatures() != null) for (String f : v.getFeatures()) {
                        String fl = f.toLowerCase(Locale.ROOT);
                        if (fl.equals("male") || fl.endsWith("gender=male")) o.put("gender", "m");
                        else if (fl.equals("female") || fl.endsWith("gender=female")) o.put("gender", "f");
                    }
                    out.put(o);
                }
            } catch (Exception ignored) {}
            return out.toString();
        }

        @JavascriptInterface
        public void ttsStop() {
            runOnUiThread(new Runnable() { public void run() {
                pendingSpeak = null;
                if (tts != null) tts.stop();
            }});
        }

        /**
         * تنزيل أصوات النطق: شاشة تنزيل بيانات المحرك الحالي، ثم إعدادات النطق في النظام،
         * ثم صفحة «خدمات Google للنطق» في المتجر إن لم يوجد محرك. تُحدَّث قائمة الأصوات عند العودة (onResume).
         */
        @JavascriptInterface
        public void ttsInstall() {
            runOnUiThread(new Runnable() { public void run() {
                // لا يوجد محرك نطق أصلًا: صفحة «خدمات Google للنطق» في المتجر أولًا
                if ("none".equals(ttsState) && (tryStart(new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=com.google.android.tts"))))) return;
                Intent i = new Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA);
                try { String eng = tts == null ? null : tts.getDefaultEngine(); if (eng != null) i.setPackage(eng); } catch (Exception ignored) {}
                if (tryStart(i) || tryStart(new Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA)) || tryStart(new Intent("com.android.settings.TTS_SETTINGS"))) return;
                if (!tryStart(new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=com.google.android.tts"))))
                    tryStart(new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=com.google.android.tts")));
            }});
        }
        /** يفتح إعدادات النطق في النظام (اختيار المحرك واللغة) */
        @JavascriptInterface
        public void ttsSettings() {
            runOnUiThread(new Runnable() { public void run() { tryStart(new Intent("com.android.settings.TTS_SETTINGS")); }});
        }

        /* ---- تلاوات القراء دون إنترنت: تُنزَّل آيات التطبيق فقط إلى مساحة التطبيق الخاصة ---- */
        /** {id: {n: عدد الملفات, b: الحجم بالبايت}} ، و"_busy" للقارئ الجاري تنزيله */
        @JavascriptInterface
        public String recStatus() {
            JSONObject out = new JSONObject();
            try {
                File[] dirs = recRoot().listFiles();
                if (dirs != null) for (File d : dirs) {
                    if (!d.isDirectory()) continue;
                    int n = 0; long b = 0; File[] fs = d.listFiles();
                    if (fs != null) for (File f : fs) if (f.getName().endsWith(".mp3")) { n++; b += f.length(); }
                    JSONObject o = new JSONObject(); o.put("n", n); o.put("b", b); o.put("c", new File(d, COMPLETE).exists()); out.put(d.getName(), o);
                }
                if (recBusy != null) out.put("_busy", recBusy);
            } catch (Exception ignored) {}
            return out.toString();
        }
        /** يبدأ تنزيل ملفات قارئ في الخلفية؛ التقدم عبر window.__rifqaRec(id, تم, الكل, الحالة) */
        @JavascriptInterface
        public boolean recDownload(final String id, final String filesJson) {
            if (id == null || !id.matches(RECITER_ID) || recBusy != null) return false;
            final java.util.List<String> files = new java.util.ArrayList<String>();
            try { JSONArray a = new JSONArray(filesJson); for (int k = 0; k < a.length(); k++) { String f = a.getString(k); if (f.matches("\\d{6}\\.mp3")) files.add(f); } }
            catch (Exception e) { return false; }
            if (files.isEmpty() || files.size() > 7000) return false;
            recBusy = id; recCancel = false;
            new Thread(new Runnable() { public void run() { downloadReciter(id, files); } }, "rifqa-rec").start();
            return true;
        }
        @JavascriptInterface
        public void recCancel() { recCancel = true; }
        @JavascriptInterface
        public boolean recDelete(String id) {
            if (id == null || !id.matches(RECITER_ID) || id.equals(recBusy)) return false;
            File d = new File(recRoot(), id); File[] fs = d.listFiles();
            if (fs != null) for (File f : fs) f.delete();
            return d.delete() || !d.exists();
        }
        /** المساحة الحرة بالبايت */
        @JavascriptInterface
        public String recFree() { return String.valueOf(getFilesDir().getUsableSpace()); }
    }

    /** معرّفات مجلدات everyayah.com: حروف وأرقام و _ - . فقط */
    static final String RECITER_ID = "[A-Za-z0-9][A-Za-z0-9_.-]{1,80}";
    private volatile String recBusy = null;
    private volatile boolean recCancel = false;

    private File recRoot() { File r = new File(getFilesDir(), "reciters"); if (!r.exists()) r.mkdirs(); return r; }

    private boolean tryStart(Intent i) {
        try { i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); startActivity(i); return true; } catch (Exception e) { return false; }
    }

    /** ملف علامة: اكتمل التنزيل (الآيات غير الموجودة على الخادم تُتلى من الشبكة كالمعتاد) */
    static final String COMPLETE = ".complete";

    private void downloadReciter(String id, java.util.List<String> files) {
        File dir = new File(recRoot(), id); dir.mkdirs();
        new File(dir, COMPLETE).delete();
        int done = 0, failed = 0, absent = 0, total = files.size(); long last = 0;
        String state = "done";
        for (String f : files) {
            if (recCancel) { state = "cancelled"; break; }
            File out = new File(dir, f);
            if (!(out.exists() && out.length() > 0)) {
                String url = "https://everyayah.com/data/" + id + "/" + f;
                int r = fetchTo(url, out);
                if (r == 0 && !recCancel) r = fetchTo(url, out);   // محاولة ثانية للأخطاء العابرة
                if (r == -1) absent++;
                else if (r == 0) { failed++; if (failed >= 8 && done - absent == 0) { state = "error"; break; } }
            }
            done++;
            long now = System.currentTimeMillis();
            if (now - last > 400 || done == total) { last = now; notifyRec(id, done, total, "progress"); }
        }
        if ("done".equals(state) && failed > 0) state = "partial";
        if ("done".equals(state)) { try { new File(dir, COMPLETE).createNewFile(); } catch (Exception ignored) {} }
        recBusy = null;
        notifyRec(id, done - failed - absent, total, state);
    }

    /** 1 تم، 0 خطأ عابر (يُعاد)، -1 الملف غير موجود على الخادم (404) */
    private int fetchTo(String url, File out) {
        File part = new File(out.getPath() + ".part");
        java.net.HttpURLConnection c = null;
        try {
            c = (java.net.HttpURLConnection) new java.net.URL(url).openConnection();
            c.setConnectTimeout(15000); c.setReadTimeout(20000);
            c.setRequestProperty("User-Agent", "RifqaAndroid/2.6");
            int code = c.getResponseCode();
            if (code == 404) return -1;
            if (code != 200) return 0;
            String ct = c.getContentType();
            if (ct != null && !ct.startsWith("audio/")) return 0;
            InputStream in = c.getInputStream(); java.io.FileOutputStream o = new java.io.FileOutputStream(part);
            byte[] buf = new byte[16384]; int r; long n = 0;
            try { while ((r = in.read(buf)) > 0) { if (recCancel) return 0; o.write(buf, 0, r); n += r; } }
            finally { o.close(); in.close(); }
            return n > 512 && part.renameTo(out) ? 1 : 0;
        } catch (Exception e) {
            return 0;
        } finally {
            if (c != null) c.disconnect();
            if (part.exists()) part.delete();
        }
    }

    private void notifyRec(final String id, final int done, final int total, final String state) {
        final String safe = id.replaceAll("[^A-Za-z0-9_.-]", "");
        runOnUiThread(new Runnable() { public void run() {
            if (web != null) web.evaluateJavascript("window.__rifqaRec&&window.__rifqaRec('" + safe + "'," + done + "," + total + ",'" + state + "')", null);
        }});
    }

    private void speakNow(String id, String text, float rate, float pitch, String voiceName) {
        if (voiceName != null && voiceName.length() > 0) {
            try {
                Set<Voice> vs = tts.getVoices();
                if (vs != null) for (Voice v : vs) if (voiceName.equals(v.getName())) { tts.setVoice(v); break; }
            } catch (Exception ignored) {}
        } else {
            tts.setLanguage(new Locale(ttsLang));
        }
        tts.setSpeechRate(Math.max(0.5f, Math.min(2f, rate)));
        tts.setPitch(Math.max(0.5f, Math.min(2f, pitch)));
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, id);
    }

    /** إبلاغ الصفحة بانتهاء مقطع؛ المعرّف أرقام وحروف فقط لمنع أي حقن. */
    private void notifyJs(final String id, final String ev) {
        final String safeId = id == null ? "" : id.replaceAll("[^0-9A-Za-z]", "");
        runOnUiThread(new Runnable() { public void run() {
            if (web != null) web.evaluateJavascript("window.__rifqaTTS&&window.__rifqaTTS('" + safeId + "','" + ev + "')", null);
        }});
    }

    private void initTts() {
        tts = new TextToSpeech(getApplicationContext(), new TextToSpeech.OnInitListener() {
            @Override public void onInit(int status) {
                if (status != TextToSpeech.SUCCESS) { ttsState = "none"; return; }
                int r = tts.setLanguage(new Locale(ttsLang));
                ttsState = (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) ? "missing" : "ok";
                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override public void onStart(String id) {}
                    @Override public void onDone(String id) { notifyJs(id, "done"); }
                    @Override public void onError(String id) { notifyJs(id, "error"); }
                });
                if (pendingSpeak != null) {
                    String[] p = pendingSpeak; pendingSpeak = null;
                    if ("ok".equals(ttsState)) speakNow(p[0], p[1], Float.parseFloat(p[2]), Float.parseFloat(p[3]), p[4]);
                    else notifyJs(p[0], "error");
                }
                notifyJs("0", "voices");
            }
        });
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // نسخة الاختبار فقط (RIFQA_DEBUG=1 تجعل الحزمة debuggable): فحص الصفحة عبر chrome://inspect
        if ((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0) WebView.setWebContentsDebuggingEnabled(true);
        web = new WebView(this);
        web.setBackgroundColor(0xFFF7F2E4);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(0xFF2F4C3E);     // لون شريطي النظام في وضع «من الحافة إلى الحافة»
        root.addView(web, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(root);
        applyEdgeToEdgeInsets(root);
        registerBack();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);          // localStorage: المحفوظات والإعدادات
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);           // الأصول تُخدم عبر shouldInterceptRequest، لا عبر file://
        s.setAllowContentAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        if (Build.VERSION.SDK_INT >= 26) s.setSafeBrowsingEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);   // تلاوة الآية التالية تبدأ تلقائيًا بعد التمهيد
        s.setTextZoom(100);
        s.setUserAgentString(s.getUserAgentString() + " RifqaAndroid/2.6");

        initTts();
        web.addJavascriptInterface(new Bridge(), "AndroidBridge");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                return serveAsset(req.getUrl());
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (ASSET_HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) {}
                return true;   // الروابط الخارجية تفتح في المتصفح
            }
        });

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl(START_URL);
    }

    @Override
    protected void onDestroy() {
        if (Build.VERSION.SDK_INT >= 33 && backCallback != null) getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback(backCallback);
        if (web != null) { web.removeJavascriptInterface("AndroidBridge"); web.destroy(); web = null; }
        if (tts != null) { tts.stop(); tts.shutdown(); tts = null; }
        super.onDestroy();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    /** زر الرجوع يتنقل داخل التطبيق (يغلق لوحة التفاصيل ويعود للشاشة السابقة) قبل الخروج. */
    private void handleBack() {
        if (web != null && web.canGoBack()) web.goBack();
        else finish();
    }

    /** أندرويد 13+: الرجوع التنبؤي (onBackPressed لا يُستدعى عند استهداف API 36). */
    private void registerBack() {
        if (Build.VERSION.SDK_INT >= 33) {
            backCallback = new OnBackInvokedCallback() { @Override public void onBackInvoked() { handleBack(); } };
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, backCallback);
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() { handleBack(); }   // أندرويد 7–12

    /**
     * أندرويد 15+ يفرض العرض من الحافة إلى الحافة: نحجز مساحة شريطي النظام والقَطع ولوحة المفاتيح
     * كي لا يختفي الشريط العلوي أو حقل الكتابة خلفها.
     */
    private void applyEdgeToEdgeInsets(final View root) {
        if (Build.VERSION.SDK_INT < 35) return;   // قبل أندرويد 15 يتولى النظام ذلك (adjustResize)
        root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            @Override public WindowInsets onApplyWindowInsets(View v, WindowInsets in) {
                android.graphics.Insets bars = in.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                android.graphics.Insets ime = in.getInsets(WindowInsets.Type.ime());
                v.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, ime.bottom));
                return WindowInsets.CONSUMED;
            }
        });
    }

    /** يخدم ملفات assets/ للأصل الخاص فقط؛ ما عداه (تلاوات القراء، واجهة Claude) يمر إلى الشبكة. */
    private WebResourceResponse serveAsset(Uri u) {
        if (u == null || !ASSET_HOST.equals(u.getHost())) return null;
        String path = u.getPath() == null ? "" : u.getPath();
        if (path.startsWith("/rec/")) return serveRecitation(path);
        if (!path.startsWith("/assets/") || path.contains("..")) return notFound();
        String rel = path.substring("/assets/".length());
        String ext = rel.lastIndexOf('.') >= 0 ? rel.substring(rel.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT) : "";
        String mime = MIME.containsKey(ext) ? MIME.get(ext) : "application/octet-stream";
        try {
            InputStream in = getAssets().open(rel);
            boolean text = mime.startsWith("text/") || mime.endsWith("json") || mime.endsWith("javascript") || mime.endsWith("svg+xml");
            WebResourceResponse r = new WebResourceResponse(mime, text ? "UTF-8" : null, in);
            Map<String, String> h = new HashMap<String, String>();
            h.put("Cache-Control", "no-cache");
            h.put("X-Content-Type-Options", "nosniff");
            r.setResponseHeaders(h);
            return r;
        } catch (Exception e) {
            return notFound();
        }
    }

    /** /rec/<قارئ>/<ملف>.mp3 من مساحة التطبيق الخاصة (تلاوات نُزّلت مسبقًا) */
    private WebResourceResponse serveRecitation(String path) {
        String[] p = path.split("/");   // "", "rec", id, file
        if (p.length != 4 || !p[2].matches(RECITER_ID) || !p[3].matches("\\d{6}\\.mp3")) return notFound();
        File f = new File(new File(recRoot(), p[2]), p[3]);
        if (!f.isFile()) return notFound();
        try {
            WebResourceResponse r = new WebResourceResponse("audio/mpeg", null, new FileInputStream(f));
            Map<String, String> h = new HashMap<String, String>();
            h.put("Content-Length", String.valueOf(f.length()));
            h.put("Cache-Control", "no-cache");
            r.setResponseHeaders(h);
            return r;
        } catch (Exception e) { return notFound(); }
    }

    @Override
    protected void onResume() {
        super.onResume();
        // عائد من تنزيل الأصوات أو من إعدادات النطق: نعيد ضبط اللغة ونحدّث قائمة الأصوات
        if ("none".equals(ttsState)) {   // ربما ثُبّت محرك نطق للتو
            try { if (tts != null) tts.shutdown(); } catch (Exception ignored) {}
            ttsState = "init"; initTts(); return;
        }
        if (tts != null && !"none".equals(ttsState) && !"init".equals(ttsState)) {
            try {
                int r = tts.setLanguage(new Locale(ttsLang));
                ttsState = (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) ? "missing" : "ok";
            } catch (Exception ignored) {}
            notifyJs("0", "voices");
        }
    }

    private static WebResourceResponse notFound() {
        WebResourceResponse r = new WebResourceResponse("text/plain", "UTF-8", null);
        r.setStatusCodeAndReasonPhrase(404, "Not Found");
        return r;
    }
}
