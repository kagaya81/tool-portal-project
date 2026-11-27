# CLAUDE.md

## Tech Stack
- Plain HTML, CSS, and JavaScript only.
- No frameworks, no libraries unless approved, and no build step. Files open directly in a browser.

## Project Structure
- `index.html` — the portal homepage
- `css/style.css` — shared styles, including the light and dark theme colours
- `js/theme.js` — the theme toggle, shared by every page
- `js/solver.js` — the equation solver's logic only (no page code, so it can be tested on its own)
- `js/equation-solver.js` — connects the solver page's form, keypad and results to `solver.js`
- `tools/` — one page per tool (`equation-solver.html` is the first)
- `assets/` — images and other static files (not created yet; add when needed)

Update this section whenever the structure changes.

## Key Requirements
1. Every page must be responsive and work on desktop, tablet, and phone.
2. Users can toggle between a light and a dark theme. The default is the light theme.
3. Text must stay easy to read, with good contrast, in both the light and the dark theme.

## Feature Plan

### Portal structure
- **Homepage (`index.html`):** a header with the theme toggle, and one card per subject: English, Higher Chinese, Mathematics, Science. A subject with no tool yet shows "Coming soon".
- **Opening a tool:** each tool is its own page in `tools/`. The visitor clicks its link on the homepage.
- **Getting back:** every tool page has a "Back to portal" link at the top that goes to `index.html`. Every page also has the theme toggle.
- **Adding a tool later:** create one new page in `tools/` (its script goes in `js/`), then add one link under its subject on the homepage. Nothing else should need to change.

### Phases
Only Phase 1 is agreed. Later phases are ideas to confirm with the user first.

1. **Phase 1: the portal plus its first tool.** The homepage, the theme toggle, and one tool: a Math equation solver for the Singapore P4 syllabus. The visitor enters a number sentence with one blank (like `? + 7 = 15`) and gets the missing number, plain-language steps, and a check.
   - [x] Portal page with subject cards, theme toggle, and a placeholder "Tool 1 — coming soon" card that opens `tools/tool-1.html` and returns with "Back to portal". Styling is simple and neutral on purpose; the visual design is chosen later.
   - [x] The real equation solver (`tools/equation-solver.html`), replacing the placeholder. It takes a sentence with one `?` (blank on either side, up to two operations, whole numbers up to 100000), typed or tapped on a keypad. It shows the answer, steps and a check. If the answer isn't a whole number (or is below 0) it says there is no whole-number answer.
2. **Phase 2 (idea): grow the math tool.** Fractions and decimals.
3. **Phase 3 (idea): tools for the other subjects.** English, Higher Chinese, Science.
4. **Phase 4 (idea): easier browsing.** Search or filter on the homepage.

## Rules for Claude
- Explain technical terms in plain language.
- Ask before making big changes (for example, adding files or folders, restructuring, or adding dependencies).
- When something is unclear, ask rather than guess.
