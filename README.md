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
