# Deltacoms — deltacoms.ca

Single-page dark-mode landing site. Plain HTML/CSS/JS, no build step, no framework.
Drop the files on any static host and it runs.

---

## 1. Connect the form (required — do this first)

The form posts to [Web3Forms](https://web3forms.com), which relays submissions to
`scott@deltacoms.ca`. Until you add the key, the form shows a message telling
visitors to email directly, so nothing silently disappears.

1. Go to **https://web3forms.com**
2. Enter `scott@deltacoms.ca` → they email you an **access key** (free, no account needed)
3. Open `index.html`, find this line (~line 480):

   ```html
   <input type="hidden" name="access_key" value="YOUR_WEB3FORMS_ACCESS_KEY">
   ```

4. Replace `YOUR_WEB3FORMS_ACCESS_KEY` with the key
5. Submit the form once yourself to confirm it lands in the inbox

Free tier is 250 submissions/month. A honeypot field (`botcheck`) is already wired
in for spam.

---

## 2. Deploy

Any static host works. Easiest options:

| Host | How |
|---|---|
| **Cloudflare Pages** | Free, fast, free SSL. Upload the folder or connect a git repo. |
| **Netlify** | Drag the folder onto app.netlify.com/drop. |
| **Your existing web host** | FTP the files into the web root. |

**Upload these:**

```
index.html
robots.txt
sitemap.xml
css/
js/
assets/
```

**Do not upload:** `Pictures/`, `_shots/`, `shots.py`, `claude.exe`, `README.md`.
`Pictures/` holds the full-size originals; `assets/img/` holds the web-optimised
copies the site actually uses.

Then point the `deltacoms.ca` DNS at the host and enable SSL.

---

## 3. Design system

Everything is driven by CSS custom properties at the top of `css/styles.css`.
Change a value there and it propagates site-wide.

**Colour** — sampled directly from the logo file:

| Token | Value | Use |
|---|---|---|
| `--navy` | `#082D4F` | The logo background colour, used verbatim |
| `--acc` | `#2E9CFF` | Accent — the same hue as the logo, raised in lightness so it's legible on black |
| `--acc-hi` | `#7CC6FF` | Hover / highlight |
| `--bg` | `#05090F` | Page base (near-black with a blue cast) |
| `--ink` | `#E8EFF7` | Body text |

The logo navy itself is far too dark to read against a dark background, so it
serves as the *surface* colour (badges, section tints, the radar) while the
brightened version of the same hue does the accent work. Body text hits ~14:1
contrast, the accent ~7.5:1 — both above WCAG AA.

**Type** — deliberately not the usual Inter/system-sans default:

- **Space Grotesk** — headings and buttons. Slightly squared, technical.
- **IBM Plex Sans** — body copy, at weight 330 for a lighter texture.
- **IBM Plex Mono** — eyebrow labels, stats, tags, town chips.

Loaded from Google Fonts. To self-host later, download the files into
`assets/fonts/` and swap the `<link>` for `@font-face` rules.

---

## 4. Animations

| Where | What |
|---|---|
| Load | Logo + progress bar boot screen, then the hero staggers in |
| Hero background | `<canvas>` network graph — nodes, links, and data pulses travelling the links; links tether toward your cursor |
| Hero | Count-up stats, animated scroll hint |
| Ticker | Infinite marquee of capabilities, pauses on hover |
| Service cards | Lift on hover + a radial glow that tracks the pointer; the Wi-Fi icon's arcs pulse outward |
| Sections | Staggered scroll reveals via `IntersectionObserver` |
| Coverage | Rotating radar sweep with pings on each town |
| Form | Floating labels, focus glow, inline validation, spinner, animated success tick |
| Nav | Shrinks and frosts on scroll; the active section underlines itself |
| Mobile | Slide-down drawer, floating "Get a Quote" button |

Every one of these is disabled under `prefers-reduced-motion: reduce`, and the
canvas stops painting when the hero scrolls offscreen or the tab is hidden.

---

## 5. Editing content

| To change | Where |
|---|---|
| Headline / any copy | `index.html` — sections are commented (`<!-- ==== HERO ==== -->` etc.) |
| Service area towns | `index.html`, the `<ul class="towns">` list |
| Radar pin positions | `index.html`, the `.pin` spans — `--x` / `--y` are percentages |
| Photos | Replace files in `assets/img/`, keep the same filenames |
| Colours / fonts / spacing | `:root` block at the top of `css/styles.css` |
| Stats row | `index.html`, `.hero__stats` — `data-to` is the number counted to |

### Adding a photo
Resize to roughly 1600px on the long edge and save as JPEG ~82% quality before
uploading — the originals are 2–3 MB each and would slow the page badly.

---

## 6. Verification harness

`shots.py` serves the folder and screenshots it at desktop and mobile widths into
`_shots/`, reporting any console errors or failed requests. Useful after edits.

```powershell
python -m pip install playwright
python -m playwright install chromium
python shots.py
```

This is the same tooling the `webapp-testing` skill uses.

---

## 7. Notes

- **No equipment vendor is named anywhere** in the copy, and the photos used are
  the ones where hardware badges aren't legible. The unused originals in
  `Pictures/` do show vendor logos — check before swapping any in.
- The `10Gb` stat refers to Cat6A being 10-gigabit rated. Fine as written, but
  worth knowing what it's claiming.
- There's no phone number on the site. If Scott wants one added, it belongs in
  the nav, the contact list, and the footer.
- `LocalBusiness` structured data is in the `<head>` for local search. Adding a
  Google Business Profile for London ON would do more for local ranking than
  anything else on the page.
