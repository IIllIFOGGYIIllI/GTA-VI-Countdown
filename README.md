# Vice City Countdown — GTA VI

Unofficial, spoiler-conscious Grand Theft Auto VI live countdown and installable progressive web app (PWA), optimized for GitHub Pages.

## Features

- Live days / hours / minutes / seconds countdown to **19 November 2026 at midnight in the selected timezone**, based on the official Rockstar Support schedule.
- Automatic device timezone detection, full available IANA timezone list and persistent user selection.
- Official, **manually reviewed** launch / pre-load news with source links; no automatic feeds, story spoilers or leaks.
- Responsive Vice City-inspired original artwork, PWA installation and offline countdown with a service worker.
- Privacy Policy, Terms of Use and Spoiler Policy.
- No backend, tracking, ads, analytics, external JavaScript libraries or GPS permission requests.

## Publishing

GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → main → / (root) → Save**.

Website (once GitHub Pages is enabled): https://iillifoggyiilli.github.io/GTA-VI-Countdown/

For installation, open the site in a supported browser. Android/desktop may show an Install action; on iPhone/iPad, use Safari **Share → Add to Home Screen**. The first visit requires internet; a successful service-worker installation enables an offline countdown.

## Editorial news updates

The news section intentionally does **not** auto-import unreviewed headlines, videos or images. To add a new item, verify it against the Rockstar Newswire or Rockstar Support, confirm the summary contains no story details, then add a matching article to the news section of index.html. Update the "verified" date. Maintain the spoiler rules documented in spoilers.html.

## Launch time accuracy

Rockstar's current regional launch guidance: https://support.rockstargames.com/articles/29jV3Cv2cCgvwM1XgtMO5o/grand-theft-auto-vi-regional-pre-load-and-release-times-on-playstation-5-and-xbox-series-x-or-s

The countdown calculates the UTC epoch corresponding to **2026-11-19 00:00 in the selected IANA timezone** using built-in Intl timezone rules. This is a region-relative countdown, not one shared global release time; platform account region may differ from a user's current location.

## Updating / debugging

- Main styles: styles.css
- Countdown and timezone logic: app.js
- App metadata: manifest.webmanifest
- Offline cache: sw.js (increment CACHE version after deployment changes)
- Legal / spoiler pages: privacy.html, terms.html, spoilers.html
- PWA icons: assets/icon-192.png, assets/icon-512.png, assets/icon.svg

Open a GitHub issue for bugs and requests. Please do not post story spoilers.

## Disclaimer

Independent fan-made project. Not affiliated with or endorsed by Rockstar Games or Take-Two Interactive. Their trademarks remain their property. The site is provided as-is. See Terms of Use.

Licensed under the MIT license in this repository (software code only; does not grant rights to third-party trademarks).


## Official trailers and screenshots

A user-initiated reveal section links all five official Rockstar videos (including YouTube) and the full official Rockstar gallery of 138 screenshots. The site **does not** embed YouTube or host Rockstar's promotional images. Titles and direct outbound links are intentionally hidden until the visitor chooses to reveal them. Video and image galleries on external sites may contain spoilers. The media page was verified 15 November 2026.

Official Rockstar collections:
- https://www.rockstargames.com/VI/media/videos
- https://www.rockstargames.com/VI/media/screenshots
- https://www.rockstargames.com/VI/launch-gallery

## PWA startup performance

From v1.1 onward the service worker caches the full app shell and uses a cache-first strategy for repeat navigations, refreshing cached HTML in the background. This is intended to improve installed-app startup latency on slow networks. Initial navigation remains subject to GitHub Pages and connection speed.

## Full in-site screenshot gallery (v1.2)

An opt-in 138-image screenshot catalogue is sourced from Rockstar's official GTA VI media page. The catalogue lives in data/screenshots.json.

- All 138 Rockstar screenshot entries are represented.
- Images are not requested until the visitor clicks Reveal official media.
- Filter by region, or browse characters; search screenshot titles.
- Show more thumbnails 18 at a time, open fullscreen, navigate with keyboard arrows, on-screen buttons and touch swipe.
- Screenshots load directly from Rockstar Games and are not copied into this repository or offline PWA cache.
- External source: https://www.rockstargames.com/VI/media/screenshots
- Update screenshot entries if Rockstar changes its URLs. Their official gallery remains linked as a fallback.

## v2.0 — Vice City: Ocean Drive overhaul

- Sitewide pastel-neon / Miami art deco refresh across header, typography, cards, countdown, newsroom, media lounge, screenshot gallery, PWA panel, and policy pages.
- Original locally hosted vector skyline and palms in assets/vice-city-skyline.svg.
- Style overrides in assets/vice-city-theme.css, loaded after the core stylesheet. No third-party fonts, trackers, or artwork.

## Official Newswire monitoring + manual publishing

**The scheduled workflow NEVER publishes a headline or screenshot automatically.** It creates review issues only. The public PWA reads only approved entries from data/news.json.

- The workflow in .github/workflows/news-check.yml is scheduled every six hours while GitHub Actions is enabled. It queries Rockstar's public Newswire GraphQL endpoint, considers recently published release / pre-load logistics, excludes sensitive topics, and creates at most four review issues per run with the news-review label.
- Newswire has no documented RSS feed, and the underlying GraphQL API may change. A failure leaves the website unchanged. Inspect Actions → Check Official GTA VI News (review only), or use Run workflow to test manually.
- The review issue contains an official link and ID, not a republished article or its images. Review the source carefully offsite; the source itself may contain spoilers.
- To publish: go to Actions → Publish Reviewed GTA VI News → Run workflow. Enter an OPEN review issue number, a carefully written spoiler-free headline and summary, the category (launch / preload / updates), a short label, and official publication date in YYYY-MM-DD format.
- The publish script validates the issue, Rockstar domain and editorial text; commits an approved entry to data/news.json and closes the issue only after successful push. A rejected item can be closed without publishing.
- GitHub Issues in a public repo are publicly readable, but their contents do NOT automatically appear on the website. Avoid entering story details even in review issue comments.
- News is safely rendered as DOM text, never untrusted HTML. Existing approved cards are retained as an offline fallback.
- The PWA fetches the approved news JSON over the network on each visit, with a cached approved feed available offline. Images and trailers remain opt-in.

**Operational note:** GitHub Actions must be enabled in Settings → Actions. These workflow files are installed, but execution and successful API responses must be checked on the repository's Actions tab.

## v2.1 — Vice City visual polish

- Joined the VICE / CITY display lockup and attached the neon period to CITY.
- Removed the page-wide scanline treatment; kept subtle texture inside the scenic backdrop only.
- Enhanced skyline colour, copy readability, countdown typography, timer contrast, and time-zone metadata.
- Unified the below-the-fold cards and the Privacy, Terms and Spoiler Policy pages with the Ocean Drive theme.
- Rebuilt the PWA cache version (`vice-city-countdown-v5`) for stylesheet changes. No countdown, news, or gallery JavaScript behaviour changed.

## v2.2 — Remove heading punctuation and repair installed PWA updates

- Remove ornamental periods from all headings, titles, site logos, news-card art and policy pages; ordinary prose punctuation remains unchanged.
- A separate `Refresh to latest version` control on the PWA panel issues an update check and navigates with a cache-busting query parameter.
- Install the service worker with `updateViaCache: none`, check for updates when the application is opened or focused, and reload after the next service worker takes control.
- Use **network-first navigation** rather than serving old cached HTML by default. Maintain an offline cached fallback.
- Publish a new service worker cache version (`v6`), versioned JS/CSS asset URLs, and an update stamp (`APP v2.2`).
- The first load of an already-installed older PWA may still use its existing service worker. Use the new Refresh control once available, or do one hard refresh of the PWA/browser to pick up the new worker.

## v2.3 — Mobile and news reliability

### Mobile experience
- Four-button bottom navigation for Countdown, News, Media and App, with safe-area padding on iOS and Android.
- A responsive hero structure presents the countdown immediately after the Vice City title on phones; secondary description and buttons appear below it.
- More compact countdown typography, larger tap targets, horizontally scrollable filter chips, and improved card grids.
- Full-screen screenshot viewer with navigation controls and swipe support on small touch screens.
- Smaller PWA install section, optimized backgrounds and fewer decorative mobile animations.
- The desktop design is retained. assets/mobile-experience.css is loaded after the main theme and included in the offline PWA shell.
- PWA v2.3 and cache v7 keep the existing update functionality.

### News checker reliability
- scripts/check_news.py now tries Rockstar's standard Newswire GraphQL query and a minimal fallback query, using official metadata only. Both are read-only. If both fail, public website content remains unchanged.
- Duplicate Newswire post IDs are suppressed within each run.
- tests/test_news.py verifies date parsing, spoiler-topic exclusions, strict Rockstar-only source links, GraphQL fallback and review-only operation.
- tests/test_site.py verifies HTML IDs, mobile navigation, approved-news sources, 138-image gallery and offline mobile CSS.
- GitHub Actions Verify GTA VI Countdown runs Python tests and JavaScript / JSON validation whenever main changes.
- The scheduled news-check workflow runs its safety tests before contacting Rockstar.

**Operational note:** The workflows are committed, but a successful scheduled Newswire fetch has not been independently verified in this chat. View the repository Actions tab; GitHub can delay or disable scheduled jobs. Manually run Check Official GTA VI News (review only) to verify connectivity and permissions. Publication still requires a separate maintainer action.


## v2.4 — Launch-day experience

- At the selected region's midnight on **19 November 2026**, the live countdown automatically switches to a **GTA VI HAS LAUNCHED** panel and the standalone launch guide. The transition is tied to the selected IANA timezone and the same release timestamp as the original countdown.
- Before the scheduled release, the original countdown stays visible. At midnight, the zeroed-out timer and progress bar are hidden; after launch the panel displays time elapsed since the scheduled release.
- Users can select another region at any time, including one where midnight has **not** arrived. The view switches correctly in either direction without a page reload.
- The site retains its news, trailer links and spoiler-gated screenshot gallery. Nothing in the release transition loads external images or unmasks the media section.
- The launch guide links to official PlayStation, Xbox and Rockstar support, and explains that actual availability depends on the player's platform account, store and eligibility. This is a scheduled-time indicator, **not** a real-time guarantee that an account can access the game.
- The installed PWA caches the launch stylesheet and script under **v2.4 / cache v8**.
- **Tests:** Node integration test tests/test_launch.cjs simulates Sydney midnight, a still-pending Los Angeles release, switching back and elapsed-time behaviour after one day. Static site tests check launch markup and hidden-state CSS. Both run in the GitHub Actions verification workflow.

Official source: https://support.rockstargames.com/articles/29jV3Cv2cCgvwM1XgtMO5o/grand-theft-auto-vi-regional-pre-load-and-release-times-on-playstation-5-and-xbox-series-x-or-s

### Editorial review closure

The November 2026 pre-load review issue #1 was closed as a duplicate: the manually approved news feed already covers the pre-load announcement. This does **not** change automatic review behaviour for future unique announcements.

## v2.5 — Launch Week overhaul

### Five integrated upgrades

1. **Launch Eve effects:** The original countdown enters region-aware phases at 24 hours, 6 hours, 1 hour, 10 minutes and 60 seconds before the selected midnight. Stages change the status banner and deepen sunset/neon accents; motion respects the system reduced-motion preference or the user's chosen setting. After midnight, the already implemented launch-day view remains authoritative.
2. **Shareable cards:** Generate an original, spoiler-free 1080 × 1350 PNG sunset postcard locally via Canvas. No Rockstar screenshots, third-party media, CDN dependencies or backend uploads. A separate copy-text action includes the selected timezone and optional platform.
3. **Personal settings:** Choose PS5, Xbox Series X|S or no platform; reduce effects; opt in to soft UI tones (off by default); and enable Strict spoiler lock. The strict option disables the media reveal control until unlocked. The original opt-in media gate still applies when strict lock is off.
4. **Launch checklist and calendar:** Six tasks can be ticked and saved locally, independently of the chosen timezone. An .ics download targets the selected region's actual scheduled midnight instant in UTC, with a 30-minute reminder to import into a calendar app. A generated calendar file does not automatically configure the user's calendar.
5. **Launch readiness checks:** GitHub Actions runs offline launch phase boundary tests, Sydney timezone rollover and regional reversal, calendar format and safety checks, static mobile/PWA asset integrity, approved-news checks, screenshot catalogue checks, and JavaScript/JSON syntax validation.

### Operational and privacy notes

- Static site and installed PWA version **2.5.0**; offline cache **vice-city-countdown-v9**. Files: assets/launch-week-core.js, assets/launch-week.js, assets/launch-week.css.
- All checklist and preferences data is stored with localStorage on this browser only. Clearing site data resets these items. The saved timezone uses its existing storage key.
- New audio never starts automatically: sounds are off by default and require an explicit user gesture to enable. Unsupported audio silently stays off.
- The app automatically recalculates phase based on the **selected region**, not just device-local time, so travellers and fans choosing a different launch region see the correct phase.
- Spoiler safety is preserved across the launch transition. Official news still requires editorial review; new gameplay media remains hidden unless explicitly revealed, or entirely blocked when Strict spoiler lock is enabled.
- Official launch availability continues to depend on account region, store and eligibility. This independent website is not an account entitlement checker.
- Launch night guidance remains available after the clock reaches zero. The share card becomes an original launch-time card, not a vanished countdown.

### Testing

Run locally: python3 -m unittest discover -s tests -p 'test_*.py' -v; node tests/test_launch.cjs; node tests/test_launch_week.cjs; node --check app.js; node --check sw.js; node --check assets/launch-week-core.js; node --check assets/launch-week.js.

## Isolated live concept — Midnight Spectacular

The separate interactive browser preview is at **/preview/celebration.html**.
The production GTA VI countdown, PWA and 19 November regional launch logic are **unchanged**.

The previous three hand-drawn motifs were not convincing fireworks. The preview now uses the open-source **Grand Fireworks JS v1.11.1** engine by Travis MacDonald (MIT licence) for genuine aerial shells, varied launch trajectories, rocket exhaust, long-exposure trails, spark fall, secondary crackles and a staged grand finale. The engine's browser build is self-hosted under preview/vendor/GrandFireworks.min.js, with the full MIT licence in preview/vendor/GRAND-FIREWORKS-LICENSE.txt. No external CDN required.

- Automatic eight-second simulated countdown starts the firework show.
- Visitors can start immediately, replay the show, restart the demo or trigger the staged grand finale manually.
- The show is choreographed for approximately 33 seconds: opening volleys, alternating mid-show salvos and a multi-stage finale.
- Full-width night sky gives fireworks the screen space they need; skyline and launch messages are secondary.
- Original Ocean Drive at Midnight synthwave remains, alongside optional procedural booms and whistles from the engine. Sound is off by default and requires a click or tap.
- Adjustable density, reduced motion and stage fullscreen, with the engine's Canvas 2D fallback.
- No gameplay, story spoilers, Rockstar soundtrack or external photo assets.
- GitHub Chromium QA verifies real engine mounting and active particle/rocket counts at phone/tablet/desktop widths, grand finale activation, replay, sound opt-in and isolation from the main PWA.

### Midnight Spectacular v2.2 — Final ten-second music cue

- The standalone preview now begins with a **20-second demo countdown**. Its final ten seconds change the stage appearance and cue a visitor-selected local audio recording.
- GTA VI Trailer 1's song is **Tom Petty — Love Is a Long Road**. The copyrighted recording is **not included** in this repository or served to visitors. For private testing, use the preview's local file picker to choose a recording you are allowed to play, then select the cue's start position in seconds.
- Local audio is decoded via the browser's Web Audio API. It stays in memory and is never uploaded, cached or sent to a server. Reloading the preview clears it. File size limit: 35 MB.
- Music and fireworks sound remain **off by default** and require explicit opt-in. At T−10 the selected file fades in; at simulated midnight it fades out as the original Ocean Drive at Midnight synthwave soundtrack starts and the first fireworks fire.
- **Preview final 10 seconds** restarts a short 11-second simulation so the T−10 trigger can be tested quickly without waiting for the full 20-second countdown.
- The pyrotechnics sequence is now choreographed as **Act I — Skyline Salute** (gold shell opening), **Act II — Neon Rush** (alternating colourful salvos), and **Act III — Grand Finale** (layered carrier rockets, crackles and gold waterfall), approximately 42 seconds in total.
- Browser QA verifies local WAV decoding, cue start at ten seconds, local-only audio, offset selection, fade-out at midnight, fireworks particles, mobile and desktop layouts, replay and existing PWA integrity.
- Public hosting or automatic playback of Tom Petty's commercial recording would require the appropriate music licence; this personal file selection is a preview-only alternative.


## Cinematic Launch Mode v2.6 (main website and PWA)

The main countdown now provides **Preview the cinematic 60-second countdown** inside the existing countdown card. Preview is a simulated 60-second journey and never changes the production countdown, regional launch state, spoilers or PWA settings. A **Jump to final 10 seconds** option allows fast testing. At zero it transitions to **WELCOME TO VICE CITY**, with a replay button and an optional link to the separate fireworks concept.

When the selected region's real release clock enters the final 60 seconds, the fullscreen-styled cinematic overlay appears automatically (once per region/session). Visitors can exit, which prevents reopening against their wishes; **Return to Launch Mode** remains available during the remaining minute. The source of truth is the existing window.ViceCountdown.getState() release and selectedZone. The actual milestone shows no unsupported claim of game access; that still depends on the console account and storefront.

No third-party imagery, autoplay audio, commercial music or story spoilers are introduced. Animations respect both system reduced-motion settings and the existing launch-kit preference. ESC/close and keyboard focus management make the overlay dismissible. The real selected timezone continues to drive the background page exactly as before. This new mode is pre-cached by **vice-city-countdown-v10** for offline PWA use. Browser QA covers 60-second preview, final-ten transitions, real T−60 activation, user dismissal, real region launch, mobile layouts and privacy.


### v2.6.1 visual polish

The simulated final-ten button now disappears as soon as the countdown reaches its final-ten sequence and stays hidden after the welcome transition. The separate fireworks concept link is accessible only in the explicit preview, not forced upon visitors at real midnight. Browser QA captures the completed welcome fade-in and includes an additional 320px narrow-mobile test. Static PWA cache namespace is `vice-city-countdown-v11`; existing region clock and spoiler controls remain unchanged.


### v2.7.0 — Actual midnight fireworks integrated

The cinematic launch mode now plays the **real Grand Fireworks JS** particle show **inside the main site** at the selected region's scheduled midnight, and at zero in the user-triggered simulation. No redirect to the separate concept preview is required. Real aerial rockets, shell bursts, spark trails and a 38-second sequence with a staged grand finale display behind a slightly lowered welcome title; **Replay fireworks** is available after the simulated or actual midnight transition.

The commercial recording/music concept remains **out of the main website**. Fireworks are silent, audio is never requested or unlocked and no copyrighted song is included. Reduced-motion users get lower-density effects. Closing or restarting the cinematic experience destroys the fireworks renderer and cancels pending cues; replay replaces the renderer rather than piling up canvases. The already vendored MIT Grand Fireworks JS v1.11.1 is cached in the PWA core at `preview/vendor/GrandFireworks.min.js?v=1.11.1` (cache namespace `vice-city-countdown-v12`). Existing spoiler safeguards, user's selected release region, and no auto-launch-after-dismiss behaviour are preserved.

Automated Chromium checks verify real particles, playback and replay on 320/360/1440-pixel viewports and automatic Sydney-midnight fireworks with no regression to timezone and offline-PWA tests.


### v2.7.1 fireworks polish

Refined the actual launch-mode firework renderer for subtler ignition flashes, reduced white glare, clearer pastel/gold shell palettes and smaller direct bursts. Mobile welcome text is raised to keep the two replay controls below it; these layouts are asserted at phone sizes. The updated PWA cache `vice-city-countdown-v13` serves versioned v2.7.1 CSS and JavaScript to installed devices.


### v2.7.2 replay contrast

The cinematic fireworks replay action uses a high-contrast white-on-deep-teal button on desktop and mobile. Chromium QA asserts its computed text colour. The PWA core has been advanced to `vice-city-countdown-v14` to refresh the CSS on installed devices.


## v2.8.0 — Editorial Newswire and opt-in Rockstar information guide

As of 16 November 2026, the editor-approved neutral Newswire contains **11** verified Rockstar news stories (formerly three), covering launch times, pre-loading, pre-orders, the launch trailer, the extended presentation, launch gallery, soundtrack, original score by Justice, in-game radio and podcasts, and the 21 November festival. Editorial review is manual: automated checks never publish.

The new **Leonida Files** section between News and Media contains **19 source-backed official records**: the confirmed story premise, Jason Duval, Lucia Caminos, six other featured character profiles, six announced locations and four world/technical topics. Records are in `data/official-guide.json` and never displayed until the visitor selects **Show Story Details**. The guide has category filters, search, Rockstar source links and a **Hide Story Details** action. Hiding clears all cards from the DOM, and reveals reset when the page reloads.

The pre-existing **Strict Spoiler Lock** overrides the guide and media gallery: it disables reveals and immediately hides any open promotional details. The optional guide JSON is fetched only after a deliberate reveal, not downloaded during PWA installation. No new visitor tracking, automatic screenshots or commercial music are added. The spoiler and privacy policies explain this behaviour.

Versioned v2.8.0 assets: `assets/official-guide.css`, `assets/official-guide.js`, `data/official-guide.json` and the editor-approved `data/news.json`. The offline cache namespace is `vice-city-countdown-v15`. Chromium QA tests 11 Newswire cards, 19 official detail records, lazy reveal, filters, search, strict locking, mobile layout and offline PWA reload. No leaks, rumours or unreleased plot events are included.


### Editorial artwork v2.9.0

The 11 editor-approved Newswire cards now use distinct **official scenic GTA VI screenshots** sourced from Rockstar's already verified public 138-image catalogue. The 19 opt-in Leonida Files cards use matching character, world or location screenshots from the same catalogue. All 30 JSON records include a validated official `image` URL and descriptive `imageAlt`. Photos appear above each article with a subtle overlay and Rockstar credit; they fall back to the existing branded gradient/monogram if the network or official CDN fails. This is not an assumption that a given scenic screenshot came from that particular news story — it is clearly labeled as an illustrative official promotional screenshot.

The website displays Rockstar-hosted, optimized image URLs lazily (`imwidth=960` for News and `imwidth=800` for optional character/location photos). It does **not** redistribute or bundle Rockstar's original photographs in the GitHub repository. Only same-origin JSON, JS and CSS are pre-cached for the PWA. News thumbnails are suppressed and never requested under **Strict Spoiler Lock**. Character/location imagery is not requested before the user selects Show Story Details; hiding clears it from the DOM and strict lock immediately revokes reveal. This matches the privacy/spoiler policies updated in the same release. Cache namespace: `vice-city-countdown-v16`.


### v2.9.1 editorial image review

A contact sheet of all 27 official Vice City scenic screenshots was used to select more relevant images for each news story. Pre-loading uses a marina overview, the festival uses nightlife, the gallery and release-time announcements use city panoramas, music stories use nightlife imagery and the extended presentation uses an aerial resort screenshot. All 30 published thumbnails remain distinct Rockstar-hosted assets, and character images remain hidden until opt-in. Image attribution appears only once a picture actually loads, and mobile browser QA waits for the image before capturing screenshots. The optional guide remains excluded from PWA install-time caching (cache v18); it can be fetched and cached only after deliberate reveal.

## v3.7 — After Launch hub

- A dedicated `after-launch.html` route extends the site beyond the countdown without changing regional release calculations, the cinematic launch mode, or OBS scenes.
- Dynamic, selected-region milestone readout uses the existing read-only `assets/region-clock.js`; it describes a **scheduled midnight milestone**, not confirmed entitlement or real-time gameplay access.
- Spoiler-conscious news cards display at most three approved entries from `data/news.json`. There is no automatic publication and no media or image preload.
- A five-item first-session checklist is stored only in this browser under `vc-first-session-v1`, with an explicit reset control.
- Quick routes to news, launch help, media, Leonida Files, Vice City History, and PWA settings each open their own page.
- Shared desktop/page-menu navigation, home page directory and banner, PWA shortcuts, and offline shell include the new route.
- The service-worker cache namespace is `vice-city-countdown-v34`. Versioned after-launch CSS is loaded on the home page and dedicated page; existing countdown and OBS scripts were not changed.
- Privacy notice explicitly includes the new local checklist. Release news remains manually reviewed.
