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
