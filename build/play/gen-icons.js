// رِفقة الأُسوة — يولّد أيقونات أندرويد (كل الكثافات + الأيقونة التكيفية والأحادية) وأيقونة متجر Play.
// الاستخدام: node build/play/gen-icons.js   (يحتاج playwright؛ انظر build/play/README.md)
const { webkit } = require("playwright");
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const RES = path.join(ROOT, "build/android/res");
const png = f => "data:image/png;base64," + fs.readFileSync(path.join(ROOT, f)).toString("base64");

const DPI = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const BG = [31, 46, 40], GOLD = [201, 161, 92];

(async () => {
  const b = await webkit.launch(); const p = await b.newPage();
  const render = (src, size, mode) => p.evaluate(async ({ src, size, mode, BG, GOLD }) => {
    const i = new Image(); i.src = src; await i.decode();
    const c = document.createElement("canvas"); c.width = c.height = size;
    const x = c.getContext("2d"); x.imageSmoothingQuality = "high"; x.drawImage(i, 0, 0, size, size);
    if (mode === "mono") {   // الكتاب بالأبيض على خلفية شفافة (أيقونات أندرويد 13 الملوّنة بسمة النظام)
      const d = x.getImageData(0, 0, size, size), a = d.data;
      const full = Math.hypot(GOLD[0] - BG[0], GOLD[1] - BG[1], GOLD[2] - BG[2]);
      for (let k = 0; k < a.length; k += 4) {
        const t = Math.min(1, Math.hypot(a[k] - BG[0], a[k + 1] - BG[1], a[k + 2] - BG[2]) / full);
        a[k] = a[k + 1] = a[k + 2] = 255; a[k + 3] = Math.round(t * 255);
      }
      x.putImageData(d, 0, 0);
    }
    return c.toDataURL("image/png").split(",")[1];
  }, { src, size, mode, BG, GOLD });
  const save = (f, b64) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, Buffer.from(b64, "base64")); };

  const rounded = png("icons/icon-512.png"), square = png("icons/icon-512-maskable.png");
  for (const [d, k] of Object.entries(DPI)) {
    const dir = path.join(RES, "mipmap-" + d);
    save(path.join(dir, "ic_launcher.png"), await render(rounded, Math.round(48 * k)));                       // أندرويد 7
    save(path.join(dir, "ic_launcher_foreground.png"), await render(square, Math.round(108 * k)));            // تكيفية 8+
    save(path.join(dir, "ic_launcher_monochrome.png"), await render(square, Math.round(108 * k), "mono"));    // 13+
  }
  const storeIcon = await render(square, 512);                                                               // متجر Play
  for (const loc of ["ar", "en-US", "nl-NL"]) save(path.join(__dirname, "listing", loc, "images/icon.png"), storeIcon);
  console.log("✓ icons");
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
