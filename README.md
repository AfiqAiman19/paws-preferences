# Paws & Preferences 🐱

A swipe-based web application that allows users to discover and express preferences for cats.  
Users can swipe right to like or swipe left to dislike, inspired by familiar mobile interaction patterns.

---

## 🔗 Live Demo
https://afiqaiman19.github.io/paws-preferences/

---

## ✨ Features
- Swipe right to like, swipe left to dislike
- Button-based controls as an alternative to swiping
- Touch, mouse, and pointer event support
- Responsive, mobile-first layout
- Summary view of liked cats after completion

---

## 🛠 Tech Stack
- **HTML** – structure and content
- **CSS** – responsive layout and visual styling
- **Vanilla JavaScript** – swipe logic and state management

No external frameworks were used to keep the implementation lightweight and easy to reason about.

---

## 🧠 Design & Implementation Notes
- Swipe interactions are implemented using **Pointer Events**, with graceful fallback to touch and mouse events for broader compatibility.
- Dragging works even when the user interacts directly with the image element.
- Images use `object-fit: contain` to ensure the full image is always visible and not cropped, allowing fair visual evaluation.
- The layout is designed to resemble a portrait mobile interface for a more natural swipe experience.
- Tested on desktop browsers and **real iPhone Safari** to validate touch behavior and responsiveness.

---

## ▶️ Running Locally
You can run the project locally by:
- Opening `index.html` directly in a browser, or
- Using **VS Code Live Server** for automatic reload during development.

No build step or installation is required.

---

## 📷 Image Source
- Cat images provided by https://cataas.com/

---

## 📌 Notes
This project was created as a technical task to demonstrate interaction handling, UI responsiveness, and attention to edge cases in user behavior.

