# 10X Accountability Coach - Landing Page

This is a **standalone landing page** that can be hosted separately from the main application.

## Quick Deploy

### Option 1: GitHub Pages
1. Push this folder to a GitHub repo
2. Settings → Pages → Select branch and `/` (root)
3. Your site is live!

### Option 2: Netlify
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop this entire folder
3. Instant deployment!

### Option 3: Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import this folder
3. Deploy in seconds!

### Option 4: Any Web Host
Upload these files to any web server:
- `index.html`
- `styles.css`
- `script.js`
- `assets/` (folder)

## Files Structure

```
docs/
├── index.html      # Main landing page
├── styles.css      # All styling (dark theme)
├── script.js       # Interactions & animations
├── assets/         # Images, icons (if any)
└── README.md       # This file
```

## Customization

### Change Colors
Edit `styles.css` and modify the CSS variables:
```css
:root {
  --oa-accent: #8b5cf6;        /* Primary purple */
  --oa-bg-primary: #0a0a0f;    /* Dark background */
  --gradient-start: #8b5cf6;   /* Gradient start */
  --gradient-end: #3b82f6;     /* Gradient end */
}
```

### Change Content
Edit `index.html` directly - it's plain HTML with no build step.

### Change GitHub Links
Search for `github.com/Anit-1to10x` in `index.html` and replace with your repo URL if forking.

## No Build Required

This landing page is pure HTML, CSS, and JavaScript. No npm, no build tools, no frameworks. Just upload and it works.

## Custom Domain

To use with your own domain:
1. Upload files to your web host
2. Point your domain's DNS to the host
3. The landing page loads at `yourdomain.com`

---

*Developed by Team 10X | Powered by OpenAnalyst*
