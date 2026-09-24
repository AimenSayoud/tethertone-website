# Tethertone launch kit

Everything here needs a human account: the steps below, then copy you can
paste. Nothing in this folder is published on the website.

Order matters. Get indexed first (1–2), then create mentions (3–6), so people
arriving from a post find a site search engines already know.

---

## 1. Google Search Console — do this first (10 minutes)

1. Open https://search.google.com/search-console and **Add property** →
   **URL prefix** → `https://aimensayoud.github.io/tethertone-website/`.
2. Choose **HTML tag**. Copy only the `content="…"` value.
3. Put it in `site.config.mjs` → `verification.google`, commit and push. (Or
   send it to Claude.) Wait for the deploy, then click **Verify**.
4. **Sitemaps** → submit `sitemap.xml`.
5. **URL inspection** → paste the home page URL → **Request indexing**. Repeat
   for `/download/` and `/android-phone-as-mac-speaker/`.

Brand searches ("Tethertone") usually appear within days. Generic searches take
weeks and depend on the mentions in sections 3–6.

## 2. Bing Webmaster Tools — ChatGPT search and Copilot use Bing (5 minutes)

1. Open https://www.bing.com/webmasters → **Import from Google Search Console**
   (fastest). Or add the site manually with the **HTML Meta Tag** option and put
   its value in `verification.bing`.
2. Submit `sitemap.xml` if it wasn't imported.

IndexNow is already automated: every deploy tells Bing (and Yandex, Seznam,
Naver) which pages changed. To resubmit everything, run the **Build, check and
deploy** workflow manually from the Actions tab.

## 3. GitHub polish (5 minutes)

- Repository **Settings → Social preview** → upload
  `tethertone-website/src/assets/img/og-image.png`. This is the card shown
  whenever the repo link is shared.
- Pin `tethertone` on your GitHub profile.
- Enable **Discussions** for questions, which keeps issues for bugs.

## 4. Show HN (Hacker News)

Post Tuesday–Thursday morning, US Eastern time. Stay around for the first two
hours and answer every comment; that engagement matters more than the post.

**Title** (plain, no marketing words; HN strips them anyway):

```
Show HN: Tethertone – stream a Mac's audio to an Android phone over USB or Wi-Fi
```

**URL:** `https://github.com/AimenSayoud/tethertone`

**First comment:**

```
Hi HN — I built Tethertone because I wanted to use my Android phone as a speaker
for my Mac, and Bluetooth can't do it (phones don't act as Bluetooth speakers).

It's a native SwiftUI app on the Mac and a Kotlin app on the phone:

- Captures the system mix with ScreenCaptureKit (or a BlackHole device), sends
  uncompressed 16-bit PCM in 10 ms packets over plain TCP.
- The QR code lists every route (USB via adb reverse, Wi-Fi, Tailscale); the
  phone races them and keeps the first to answer, so the cable wins when it's
  plugged in.
- The part that took the longest: clock drift. The Mac's and phone's audio
  clocks disagree by tens of ppm, so the buffer slowly drains or fills. The
  phone plays ±0.2% off nominal rate to hold it at target: inaudible, and
  latency stays flat for hours. On some phones a low-latency AudioTrack
  refuses rate changes entirely, so it rebuilds the track without it.

The wire protocol is documented and implemented independently in Swift, Kotlin
and Python, with shared test vectors. MIT licensed, no accounts, no telemetry.

Known gaps: no encryption (token auth only; use USB or a VPN), not notarized,
Mac → Android only. Happy to answer anything.
```

## 5. Reddit

Read each subreddit's rules first. Most allow self-promotion by the developer
if you say so plainly and answer questions. Space the posts a few days apart.

**r/macapps** — title:

```
[Open source] Tethertone — use your Android phone as a speaker for your Mac (USB or Wi-Fi, free)
```

**r/androidapps** — title:

```
I made a free, open-source app that turns your Android phone into a speaker for your Mac
```

**Body** (adapt per subreddit):

```
I'm the developer. Tethertone streams everything your Mac plays to your Android
phone, over a USB cable or Wi-Fi, paired with one QR scan.

- Free, MIT licensed, no ads, no account, no tracking
- Uncompressed audio, 90 ms default buffer (adjustable), and continuous
  clock-drift correction so it doesn't slowly fall out of sync
- Plays with the screen off (foreground service)
- macOS 14+ and Android 8+

Website: https://aimensayoud.github.io/tethertone-website/
Source: https://github.com/AimenSayoud/tethertone

It's early (v0.2.0), so bug reports and phone models it does or doesn't work on
are very welcome.
```

Also worth answering, not posting: existing threads asking how to "use Android
as Mac speaker". A genuinely helpful reply that mentions Tethertone among the
options earns links that last.

## 6. Directories and lists (backlinks that keep working)

| Where | What to submit |
|---|---|
| [AlternativeTo](https://alternativeto.net) | New app → "Tethertone". Mark it as an alternative to **AudioRelay**, **Airfoil Satellite** and **SoundWire**. Licence: Open Source (MIT). Platforms: Mac, Android. |
| [Product Hunt](https://www.producthunt.com) | Tagline: *Your Mac's audio on your Android phone, over USB or Wi-Fi*. Launch 12:01 am Pacific; reuse the HN comment as the maker comment. |
| [open-source-mac-os-apps](https://github.com/serhii-londar/open-source-mac-os-apps) | Pull request under **Audio**: `- [Tethertone](https://github.com/AimenSayoud/tethertone) - Stream your Mac's audio to an Android phone over USB or Wi-Fi.` with the Swift language badge the list uses. |
| [android-foss](https://github.com/offa/android-foss) | Pull request under the closest section (**Music & Audio Player**), same one-line description. |
| [F-Droid](https://f-droid.org) | See `tethertone/docs/FDROID.md` in the app repo: the metadata is ready; you open the merge request. |

## 7. Keep it fresh

- Every release: update `version` in `site.config.mjs`, push. IndexNow
  announces the changed pages the same day.
- Revisit `/compare/` every few months: prices and features change, and an
  up-to-date comparison is exactly what AI answers like to cite.
- Write one new article when real questions repeat in issues or Reddit, e.g.
  "Mac audio to Android with low latency for video". Each one should answer
  a single question fully, with the short answer first.
