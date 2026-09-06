# Admin cache refresh fix

The admin panel now loads its JavaScript with an explicit version query and the service worker treats admin assets as network-first/no-store. This prevents previously cached admin.js from hiding newly deployed administration features.
