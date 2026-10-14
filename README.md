# Responsive Image Slider Library

A responsive, looping image slider built with semantic HTML, CSS transitions, and vanilla JavaScript.

## Features
- Next and Previous arrow controls
- Dots generated from the slide count and direct dot navigation
- Horizontal `transform: translateX()` animation
- Forward and backward boundary wrapping
- Responsive 16:9 / mobile 4:3 viewport and `object-fit: cover`
- Keyboard arrow navigation and live status text
- Reduced-motion support
- No third-party carousel library

## Run locally
1. Extract the ZIP.
2. Open `index.html` in a modern browser. Internet access is needed for the sample Unsplash images.
3. For a local web server, run `python -m http.server 8000` in this directory and visit `http://localhost:8000`.

## Project files
- `index.html` — semantic markup and sample image slides
- `style.css` — responsive layout, viewport clipping, controls, and transitions
- `slider.js` — modular `ImageSlider` class and interaction logic
- `report.docx` — 5–6 page APA 7-style project report
- `screenshots/` — illustrative screenshots for the report

## GitHub
Create a public repository on your GitHub account, then run:
```bash
git init
git add .
git commit -m "Build responsive vanilla JavaScript image slider"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/image-slider-library.git
git push -u origin main
```
Replace `YOUR-USERNAME` with your GitHub username. Do not publish credentials or private information.
