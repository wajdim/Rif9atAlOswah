// رِفقة الأُسوة — واجهة iOS: WKWebView يحمّل التطبيق من حزمة التطبيق ويعمل بلا إنترنت.
// يوفّر للصفحة الجسر نفسه الذي توفره نسخة أندرويد (window.AndroidBridge):
// مشاركة، نسخ، وقراءة صوتية أصلية عبر AVSpeechSynthesizer (صوت «ماجد» الرجالي في iOS).
import UIKit
import WebKit
import AVFoundation

final class WebViewController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler, AVSpeechSynthesizerDelegate {

    private var webView: WKWebView!
    private let synth = AVSpeechSynthesizer()
    private var utteranceIds: [ObjectIdentifier: String] = [:]

    // MARK: - الجسر (يُحقن قبل تحميل الصفحة)
    // دوال AndroidBridge المتزامنة (ttsStatus / ttsVoices) تقرأ قيمًا يرسلها التطبيق مسبقًا؛
    // والباقي رسائل غير متزامنة إلى Swift.
    private static let bridgeJS = """
    (function(){
      var st = {status: "init", voices: "[]", statusEn: "init", voicesEn: "[]", statusNl: "init", voicesNl: "[]", lang: "ar"};
      var SUF = {ar: "", en: "En", nl: "Nl"};
      window.__rifqaIOS = function(k, v){ st[k] = v; if (/^voices/.test(k) && window.__rifqaTTS) window.__rifqaTTS("0", "voices"); };
      function post(m){ try { window.webkit.messageHandlers.rifqa.postMessage(m); } catch (e) {} }
      window.AndroidBridge = {
        share: function(t){ post({cmd: "share", text: String(t)}); },
        copy: function(t){ post({cmd: "copy", text: String(t)}); },
        ttsStatus: function(){ return st["status" + SUF[st.lang]]; },
        ttsVoices: function(){ return st["voices" + SUF[st.lang]]; },
        ttsSetLang: function(l){ st.lang = SUF[l] !== undefined ? l : "ar"; post({cmd: "lang", lang: st.lang}); },
        ttsSpeak: function(id, text, rate, pitch, voice){ post({cmd: "speak", id: String(id), text: String(text), rate: +rate || 1, pitch: +pitch || 1, voice: voice || ""}); },
        ttsStop: function(){ post({cmd: "stop"}); },
        ttsInstall: function(){ post({cmd: "install"}); }
      };
      window.RifqaIOS = true;
    })();
    """

    override func loadView() {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []          // التلاوة التالية تبدأ تلقائيًا
        config.websiteDataStore = .default()                           // المحفوظات والتقييمات في localStorage تبقى
        let ucc = WKUserContentController()
        ucc.addUserScript(WKUserScript(source: Self.bridgeJS, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        ucc.addUserScript(WKUserScript(source: voicesScript(), injectionTime: .atDocumentStart, forMainFrameOnly: true))
        ucc.add(WeakHandler(self), name: "rifqa")
        config.userContentController = ucc

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.allowsBackForwardNavigationGestures = true           // السحب للرجوع = زر الرجوع في التطبيق
        webView.scrollView.contentInsetAdjustmentBehavior = .never     // الصفحة تتعامل مع الشق بنفسها (safe-area)
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.969, green: 0.949, blue: 0.894, alpha: 1)
        if #available(iOS 16.4, *) { webView.isInspectable = true }
        view = webView
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        synth.delegate = self
        // .playback: تُسمع القراءة والتلاوة حتى لو كان زر الصامت مفعّلًا
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
        guard let www = Bundle.main.url(forResource: "www", withExtension: nil) else { return }
        webView.loadFileURL(www.appendingPathComponent("index.html"), allowingReadAccessTo: www)
    }

    // MARK: - الأصوات (العربية، والإنجليزية والهولندية للواجهتين المترجمتين)
    private var lang = "ar"
    private func voices(_ l: String) -> [AVSpeechSynthesisVoice] {
        AVSpeechSynthesisVoice.speechVoices().filter { $0.language.hasPrefix(l) }
    }
    private func arabicVoices() -> [AVSpeechSynthesisVoice] { voices(lang) }

    private func voicesScript() -> String {
        voicesScript("ar", key: "voices", statusKey: "status") + voicesScript("en", key: "voicesEn", statusKey: "statusEn")
            + voicesScript("nl", key: "voicesNl", statusKey: "statusNl")
    }
    private func voicesScript(_ l: String, key: String, statusKey: String) -> String {
        let vs = voices(l)
        let list: [[String: Any]] = vs.map { v in
            var g = "?"
            if #available(iOS 13.0, *) { g = v.gender == .male ? "m" : (v.gender == .female ? "f" : "?") }
            let q = v.quality == .enhanced ? (l == "en" ? " — enhanced" : l == "nl" ? " — verbeterd" : " — محسّن") : ""
            return ["name": v.identifier, "label": v.name + q, "lang": v.language, "gender": g,
                    "network": false, "quality": v.quality == .enhanced ? 400 : 300]
        }
        let json = (try? JSONSerialization.data(withJSONObject: list)).flatMap { String(data: $0, encoding: .utf8) } ?? "[]"
        let status = vs.isEmpty ? "missing" : "ok"
        return "window.__rifqaIOS && (window.__rifqaIOS('\(key)', \(jsString(json))), window.__rifqaIOS('\(statusKey)', '\(status)'));"
    }

    private func jsString(_ s: String) -> String {
        let data = try? JSONSerialization.data(withJSONObject: [s])
        let arr = data.flatMap { String(data: $0, encoding: .utf8) } ?? "[\"\"]"
        return String(arr.dropFirst().dropLast())
    }

    // MARK: - رسائل الصفحة
    func userContentController(_ ucc: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let m = message.body as? [String: Any], let cmd = m["cmd"] as? String else { return }
        switch cmd {
        case "speak":
            speak(id: m["id"] as? String ?? "", text: m["text"] as? String ?? "",
                  rate: (m["rate"] as? NSNumber)?.floatValue ?? 1, pitch: (m["pitch"] as? NSNumber)?.floatValue ?? 1,
                  voice: m["voice"] as? String ?? "")
        case "lang":
            let l = m["lang"] as? String ?? "ar"
            lang = ["en", "nl"].contains(l) ? l : "ar"
        case "stop":
            utteranceIds.removeAll()
            synth.stopSpeaking(at: .immediate)
        case "copy":
            UIPasteboard.general.string = m["text"] as? String
        case "share":
            let vc = UIActivityViewController(activityItems: [m["text"] as? String ?? ""], applicationActivities: nil)
            vc.popoverPresentationController?.sourceView = view
            vc.popoverPresentationController?.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.maxY - 80, width: 1, height: 1)
            present(vc, animated: true)
        case "install":
            // iOS: الإعدادات ← تسهيلات الاستخدام ← المحتوى المنطوق ← الأصوات ← العربية
            if let url = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(url) }
        default: break
        }
    }

    private func speak(id: String, text: String, rate: Float, pitch: Float, voice: String) {
        try? AVAudioSession.sharedInstance().setActive(true)
        let u = AVSpeechUtterance(string: text)
        u.voice = AVSpeechSynthesisVoice(identifier: voice) ?? arabicVoices().first(where: { v in
            if #available(iOS 13.0, *) { return v.gender == .male }
            return true
        }) ?? AVSpeechSynthesisVoice(language: ["en": "en-US", "nl": "nl-NL"][lang] ?? "ar-SA")
        // سرعة الصفحة 1.0 = السرعة الطبيعية في iOS (0.5)
        u.rate = max(AVSpeechUtteranceMinimumSpeechRate, min(AVSpeechUtteranceMaximumSpeechRate, AVSpeechUtteranceDefaultSpeechRate * rate))
        u.pitchMultiplier = max(0.5, min(2.0, pitch))
        u.postUtteranceDelay = 0.15
        utteranceIds[ObjectIdentifier(u)] = id
        synth.speak(u)
    }

    func speechSynthesizer(_ s: AVSpeechSynthesizer, didFinish u: AVSpeechUtterance) { finished(u, "done") }
    func speechSynthesizer(_ s: AVSpeechSynthesizer, didCancel u: AVSpeechUtterance) { utteranceIds.removeValue(forKey: ObjectIdentifier(u)) }

    private func finished(_ u: AVSpeechUtterance, _ ev: String) {
        guard let id = utteranceIds.removeValue(forKey: ObjectIdentifier(u)) else { return }
        let safe = id.filter { $0.isLetter || $0.isNumber }
        webView.evaluateJavaScript("window.__rifqaTTS && window.__rifqaTTS('\(safe)', '\(ev)')", completionHandler: nil)
    }

    // MARK: - التنقل: الروابط الخارجية تُفتح في Safari
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { return decisionHandler(.cancel) }
        if url.isFileURL || url.scheme == "about" { return decisionHandler(.allow) }
        if action.navigationType == .linkActivated || ["mailto", "tel", "http", "https"].contains(url.scheme ?? "") {
            UIApplication.shared.open(url)
            return decisionHandler(.cancel)
        }
        decisionHandler(.allow)
    }

    // إن أُنهيت عملية العرض (ذاكرة منخفضة) نعيد التحميل بدل شاشة فارغة
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { webView.reload() }
}

/// يمنع دورة الاحتفاظ بين WKUserContentController والمتحكم
private final class WeakHandler: NSObject, WKScriptMessageHandler {
    weak var target: WKScriptMessageHandler?
    init(_ t: WKScriptMessageHandler) { target = t }
    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
        target?.userContentController(c, didReceive: m)
    }
}
