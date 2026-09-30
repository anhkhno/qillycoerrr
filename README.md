# qillycoer masterlist tracker

A small static site that reads directly from your Google Sheet, so you never have to update the site itself — just keep editing the sheet as usual.

## 1. Make the sheet readable by the site

The site fetches your sheet's data anonymously, so it needs to be viewable by anyone with the link:
1. In Google Sheets, click **Share** (top right).
2. Under "General access," change it to **Anyone with the link → Viewer**.

(Customers still can't *see* the sheet itself or edit anything — the site only pulls the columns it needs and shows each customer their own rows.)

## 2. Put it on GitHub Pages

1. Create a new GitHub repo (e.g. `qillycoer-tracker`).
2. Upload these three files to the root: `index.html`, `style.css`, `script.js`.
3. Go to the repo's **Settings → Pages**.
4. Under "Build and deployment," set Source to **Deploy from a branch**, branch `main`, folder `/ (root)`.
5. Save — GitHub gives you a link like `https://yourname.github.io/qillycoer-tracker/` within a minute or two.

## 3. Check it matches your sheet

Open `script.js` and check the `CONFIG` block at the top:

- `SHEET_ID` — already set from the sheet you shared.
- `TABS` — currently `["kr", "jp", "ch", "my", "xianyu", "Sheet6"]`, matching the tabs I saw. Add/remove names here if you add or rename tabs.
- `COLUMNS` — currently assumes: **B** = order code, **C** = item, **D** = Telegram username, **E** = price, **F** = payment status, **G** = order status. Update the numbers (A=0, B=1, C=2…) if you ever reorder columns.
- `STATUS_RULES` — this is the part most likely to need your attention. I only saw two status phrases in your sheet ("secured/already paid to the seller" and "arrived to admin house"), so I've guessed the wording for "otw to wh," "arrived at wh," "otw to my," and "posted out." **Open your sheet and check the exact phrases you use for those statuses**, then update the `keyword` values so they match — the site looks for these as substrings (lowercase) inside column G.

## 4. Announcement banner

Edit the sentence directly in `index.html` (search for `id="bannerText"`), or set `ANNOUNCEMENT` in `script.js`'s CONFIG to override it from there instead.

## How search works

A customer types their Telegram handle (with or without the @) and the site pulls every row across all tabs where column D matches, then shows:
- A dashboard: total orders, secured, in transit (combining otw to wh / arrived at wh / otw to my), admin house, posted out.
- A card per order with its code, item name, price, and current status.

## 5. Admin login (`admin.html`) — one-time Google Cloud setup

The admin page lets you sign in with your Google account and add new order rows straight to the sheet, without opening Google Sheets yourself. Because the site has no backend, this works by having *your browser* talk to the Sheets API directly using your own Google login — so the real security boundary is who you've shared the sheet with as **Editor**, not anything in the code.

**One-time setup (~5 minutes):**

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a new project (any name).
2. Go to **APIs & Services → Library**, search for **Google Sheets API**, and click **Enable**.
3. Go to **APIs & Services → OAuth consent screen**:
   - User type: **External** is fine.
   - Fill in the app name (e.g. "qillycoer masterlist admin") and your email.
   - Add scope `.../auth/spreadsheets` if prompted (or skip — it'll still work while the app is in "Testing" mode).
   - Under **Test users**, add every Google account that should be allowed to log in as admin (this is what actually gates who can even attempt to sign in, while the app is in Testing mode — no need to publish it).
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Under **Authorized JavaScript origins**, add your GitHub Pages URL, e.g. `https://yourname.github.io` (no trailing slash, no path).
   - Create it, then copy the **Client ID** (ends in `.apps.googleusercontent.com`).
5. Paste that Client ID into `config.js`, in `ADMIN.GOOGLE_CLIENT_ID`.
6. Make sure the sheet is shared with each admin's Google account as **Editor** (Share button in Google Sheets — separate from the "Anyone with the link → Viewer" setting for customers).

That's it — reload `admin.html`, sign in, and the add-order form appears. If someone without Editor access signs in, they'll get a clear permission-denied message instead of being able to write anything.

`ADMIN.EXPECTED_ADMIN_EMAILS` in `config.js` is optional and purely cosmetic (a friendlier warning banner) — leave it empty if you don't want it.
