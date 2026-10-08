package com.rifqa.aluswa;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.util.Locale;
import java.util.Set;

import org.json.JSONArray;
import org.json.JSONObject;

/** رِفقة الأُسوة — واجهة أندرويد: WebView يحمّل التطبيق من أصول الحزمة ويعمل بلا إنترنت. */
public class MainActivity extends Activity {
    private WebView web;
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
                startActivity(Intent.createChooser(i, "en".equals(ttsLang) ? "Share" : "nl".equals(ttsLang) ? "Delen" : "مشاركة"));
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
                ttsLang = ("en".equals(lang) || "nl".equals(lang)) ? lang : "ar";
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

        @JavascriptInterface
        public void ttsInstall() {
            runOnUiThread(new Runnable() { public void run() {
                try { startActivity(new Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA)); }
                catch (Exception e) {
                    try { startActivity(new Intent("com.android.settings.TTS_SETTINGS")); } catch (Exception ignored) {}
                }
            }});
        }
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
        web = new WebView(this);
        web.setBackgroundColor(0xFFF7F2E4);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);          // localStorage: المحفوظات والإعدادات
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);            // تحميل الملفات من assets
        s.setAllowContentAccess(false);
        s.setMediaPlaybackRequiresUserGesture(false);   // تلاوة الآية التالية تبدأ تلقائيًا بعد التمهيد
        s.setTextZoom(100);
        s.setUserAgentString(s.getUserAgentString() + " RifqaAndroid/2.1");

        initTts();
        web.addJavascriptInterface(new Bridge(), "AndroidBridge");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if ("file".equals(u.getScheme())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) {}
                return true;   // الروابط الخارجية تفتح في المتصفح
            }
        });

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    protected void onDestroy() {
        if (tts != null) { tts.stop(); tts.shutdown(); tts = null; }
        super.onDestroy();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    /** زر الرجوع يتنقل داخل التطبيق (يغلق لوحة التفاصيل ويعود للشاشة السابقة) قبل الخروج. */
    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }
}
