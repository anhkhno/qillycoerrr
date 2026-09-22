# qillycoer Order Tracker

A single-page site that reads your masterlist Google Sheet live and lets customers
search their order status by Telegram username.

## 1. Make sure your Google Sheet is viewable

The page reads your sheet's tabs directly from the browser, so it needs to be public:
**File → Share → General access → "Anyone with the link" → Viewer.**
(No one can edit it this way — read-only.)

## 2. Check the tab names

The site currently reads these tabs, in this order: `kr, jp, ch, my, xianyu, Sheet6`
(matches the tabs at the bottom of your sheet). If you rename, add, or remove tabs,
open `index.html` and update the `SHEET_TABS` array near the top of the `<script>` block.

## 3. Column layout it expects (per tab)

| Column | Content |
|---|---|
| B | Order ID (e.g. `#KR_01`) — optional |
| C | Item name |
| D | Telegram username (e.g. `@cvcoola`) — **required**, this is what customers search by |
| E | Price |
| F | Payment status |
| G | Order status — must contain one of these keywords so it sorts into the right bucket: |

- `secured` / `paid to the seller` → **Secured**
- `otw to wh` / `arrived ... wh` / `otw to my` → **In Transit**
- `admin house` → **Admin House**
- `posted` → **Posted Out**
- anything else → **Processing** (shown only if it happens)

## 4. Edit the announcement banner

Open `index.html`, search for `ANNOUNCEMENT BANNER`, and edit the text inside the
`<div class="banner">` directly — no need to touch any JavaScript.

## 5. Put it on GitHub Pages

1. Create a new GitHub repo (or use an existing one).
2. Upload `index.html` to the root of the repo.
3. Go to **Settings → Pages**, set **Source** to your main branch, root folder.
4. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

That's it — the page has no build step, it's plain HTML/CSS/JS.
