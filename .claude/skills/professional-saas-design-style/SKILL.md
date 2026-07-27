---
name: professional-saas-design-style
description: Design system and visual style guide for this project, inspired by professional SaaS dashboards (e.g. DealSpace-style). Use this skill whenever building, styling, or reviewing any UI component, page, or dashboard in this project — including layouts, cards, tables, sidebars, buttons, badges, typography, and color choices. Always consult this before writing UI/CSS/component code so the visual style stays consistent across the whole app.
---

# Professional SaaS Design Style

This project should look and feel like a premium, professional SaaS product (dashboards, fintech tools, enterprise platforms) — clean, calm, and trustworthy. Apply the rules below to every page/component you build or edit.

## Overall Feel
- Minimalist layout, generous whitespace, never cramped or cluttered.
- Calm, neutral color palette as the base:
  - Background: very light beige or light gray (not pure white)
  - Cards/panels: pure white, rounded corners, very subtle soft shadow (not harsh)
- ONE accent color used sparingly — only on primary buttons, active states, links, and small status badges. Do not spread the accent color everywhere.

## Typography
- Headings / hero text: an elegant serif font (e.g. Georgia, Playfair Display) — gives a premium, trustworthy feel.
- Body text, labels, UI copy: a clean modern sans-serif (e.g. Inter, Söhne, system-ui) — optimized for fast scanning.
- Large stat numbers (e.g. "62%", "£4.6m") should be bold and prominent, with small green "+12%"-style growth indicators next to them where relevant.

## Layout Structure
- Fixed left sidebar: logo/brand at top, nav items grouped under small gray section labels (e.g. "Work", "Your practice", "Other").
- Top bar: search input + icon buttons (messages, notifications).
- Main content: a top summary/profile card, followed by horizontally-scrollable card rows (e.g. "matches"), then a data table + side panel (e.g. "tasks") below.

## Components
- **Cards**: white background, rounded-xl corners, subtle shadow, comfortable internal padding.
- **Badges/status pills**: small, rounded, light background with a matching-toned text color (e.g. light green bg + dark green text for "New" or a percentage match).
- **Icons**: thin line-style icons only — never heavy filled/solid icons.
- **Tables**: clean rows with clear spacing between rows, muted gray column headers, avatar thumbnails next to row names where relevant.
- **Avatars**: small circular profile images; can include a thin circular progress ring around them to show a percentage/score.
- **Buttons**: primary action = solid dark/black or accent-colored button with rounded corners; secondary action = outlined/white button.

## When implementing
1. Default to this style for any new page or component unless the user explicitly asks for a different aesthetic.
2. Keep the accent color consistent — don't introduce a new color per page.
3. Prefer Tailwind utility classes (or the project's existing CSS system) that match these tokens: light neutral backgrounds, white cards, rounded-lg/rounded-xl, subtle shadow-sm/shadow-md, one accent color for interactive elements.
4. If a design decision isn't covered here, default to "minimal, calm, premium SaaS" as the tiebreaker.
