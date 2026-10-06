"""Visual verification pass. Boots a local server, screenshots the page at
desktop + mobile widths, and dumps any console errors."""
import http.server, socketserver, threading, functools, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "_shots"
OUT.mkdir(exist_ok=True)
PORT = 8899

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
socketserver.TCPServer.allow_reuse_address = True
srv = socketserver.TCPServer(("127.0.0.1", PORT), Handler)
threading.Thread(target=srv.serve_forever, daemon=True).start()

URL = f"http://127.0.0.1:{PORT}/index.html"
problems = []

with sync_playwright() as p:
    b = p.chromium.launch()

    # ---- desktop ----
    pg = b.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
    pg.on("console", lambda m: problems.append(f"[console:{m.type}] {m.text}")
          if m.type in ("error", "warning") else None)
    pg.on("pageerror", lambda e: problems.append(f"[pageerror] {e}"))
    pg.on("requestfailed", lambda r: problems.append(f"[404/failed] {r.url}"))

    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_timeout(2600)          # let the loader lift + hero reveal
    pg.screenshot(path=OUT / "01-hero.png")

    for name, sel in [
        ("02-services", "#services"),
        ("03-difference", "#difference"),
        ("04-who", "#who"),
        ("05-work", "#work"),
        ("06-process", "#process"),
        ("07-coverage", "#coverage"),
        ("08-contact", "#contact"),
        ("09-footer", ".foot"),
    ]:
        pg.locator(sel).scroll_into_view_if_needed()
        pg.wait_for_timeout(1250)
        pg.screenshot(path=OUT / f"{name}.png")

    pg.screenshot(path=OUT / "10-full.png", full_page=True)

    # form validation state
    pg.locator("#submitBtn").click()
    pg.wait_for_timeout(500)
    pg.locator("#contact").scroll_into_view_if_needed()
    pg.screenshot(path=OUT / "11-form-invalid.png")

    pg.close()

    # ---- mobile ----
    mb = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2,
                    is_mobile=True, has_touch=True)
    mb.goto(URL, wait_until="networkidle")
    mb.wait_for_timeout(2600)
    mb.screenshot(path=OUT / "20-m-hero.png")
    mb.locator("#burger").click()
    mb.wait_for_timeout(700)
    mb.screenshot(path=OUT / "21-m-drawer.png")
    mb.keyboard.press("Escape")
    mb.wait_for_timeout(500)
    mb.locator("#services").scroll_into_view_if_needed()
    mb.wait_for_timeout(1200)
    mb.screenshot(path=OUT / "22-m-services.png")
    mb.locator("#contact").scroll_into_view_if_needed()
    mb.wait_for_timeout(1200)
    mb.screenshot(path=OUT / "23-m-contact.png")
    mb.screenshot(path=OUT / "24-m-full.png", full_page=True)
    mb.close()

    b.close()

srv.shutdown()

print("SHOTS:", ", ".join(sorted(f.name for f in OUT.glob("*.png"))))
print("--- PROBLEMS ---")
if problems:
    for x in dict.fromkeys(problems):
        print(x)
else:
    print("none")
