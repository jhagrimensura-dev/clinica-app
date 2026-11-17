---
name: abrir-no-chrome
description: "Always open sites/links for the user in Google Chrome, not the default browser"
metadata:
  node_type: memory
  type: feedback
  originSessionId: d5ee1ee9-508f-4877-857c-10d83ebc02c5
  modified: 2026-11-11T12:42:56.543Z
---

When opening any site for the user (e.g. the clinic site draamandaliima.com.br), open it in Google Chrome: `Start-Process chrome "<url>"`.

**Why:** User explicitly said "quero que abra sempre no chrome" after I opened the site in the default browser.
**How to apply:** Any time I launch a URL in a browser on this machine, target Chrome instead of the system default.
