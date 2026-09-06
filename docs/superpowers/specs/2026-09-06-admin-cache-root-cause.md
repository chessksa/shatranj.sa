# Admin cache root cause

The production admin panel appeared unchanged because the service worker used cache-first behavior for non-play assets, including `admin.js`, while `admin.html` loaded `admin.js` without a version query. Existing clients could therefore execute the old cached admin bundle after a successful deployment.

Fix: version the admin script URL, bump the service-worker cache namespace, and make `/admin.html` and `/admin.js` network-first with `cache: "no-store"` fallback to cache.
