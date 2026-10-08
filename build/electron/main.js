/* رِفقة الأُسوة — غلاف سطح المكتب (Windows) */
const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");

if (!app.requestSingleInstanceLock()) { app.quit(); }

function createWindow() {
  const win = new BrowserWindow({
    width: 1100, height: 860, minWidth: 380, minHeight: 560,
    title: "رفقة الأسوة",
    backgroundColor: "#F7F2E4",
    icon: path.join(__dirname, "www", "icons", "icon-512.png"),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, "www", "index.html"));
  // الروابط الخارجية تُفتح في المتصفح الافتراضي، لا داخل التطبيق
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });
  win.webContents.on("will-navigate", (e, url) => { if (!url.startsWith("file://")) { e.preventDefault(); shell.openExternal(url); } });
  // اختصارات: F11 ملء الشاشة، Ctrl +/- تكبير، Ctrl+0 إعادة الضبط
  win.webContents.on("before-input-event", (e, input) => {
    if (input.type !== "keyDown") return;
    if (input.key === "F11") { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (input.control && (input.key === "=" || input.key === "+")) { win.webContents.setZoomLevel(win.webContents.getZoomLevel() + 0.5); e.preventDefault(); }
    if (input.control && input.key === "-") { win.webContents.setZoomLevel(win.webContents.getZoomLevel() - 0.5); e.preventDefault(); }
    if (input.control && input.key === "0") { win.webContents.setZoomLevel(0); e.preventDefault(); }
  });
}
app.on("second-instance", () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });
app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
