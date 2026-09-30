/* ============================================================
   SHARED CONFIG — used by both script.js (customer search) and
   admin.js (admin add-order form)
   ============================================================ */
const CONFIG = {
  // The ID from your Google Sheet's URL (…/d/THIS_PART/edit)
  SHEET_ID: "1Gc6oy0_d6dE7_SWtb3d6Sl93jRinKYnPKa23swH6QTM",

  // Every tab name you want searched / addable to (must match tab names exactly)
  TABS: ["kr", "jp", "ch", "my", "xianyu", "Sheet6"],

  // Which column each field is in (A=0, B=1, C=2 …) — matches your current layout
  COLUMNS: {
    code: 1,      // B — order code, e.g. #KR_01
    item: 2,      // C — item name
    telegram: 3,  // D — @username
    price: 4,     // E — price
    payment: 5,   // F — payment status
    status: 6,    // G — order status text
  },

  // How raw text in the status column maps to a dashboard category.
  // Add more keywords on the left if your sheet uses different wording —
  // the first match wins, checked top to bottom. `label` is also what
  // fills the status dropdown on the admin add-order form.
  STATUS_RULES: [
    { keyword: "posted",              category: "posted",  label: "posted out" },
    { keyword: "admin house",         category: "admin",   label: "arrived to admin house" },
    { keyword: "otw to my",           category: "transit", label: "otw to my" },
    { keyword: "arrived to wh",       category: "transit", label: "arrived at wh" },
    { keyword: "arrived at wh",       category: "transit", label: "arrived at wh" },
    { keyword: "otw to wh",           category: "transit", label: "otw to wh" },
    { keyword: "secured",             category: "secured", label: "secured/already paid to the seller" },
  ],

  // Shown in the top banner on the customer page. Edit freely, or leave
  // editing to index.html directly (search id="bannerText").
  ANNOUNCEMENT: null,

  /* --------------------------------------------------------
     ADMIN — only relevant to admin.html / admin.js
     -------------------------------------------------------- */
  ADMIN: {
    // From Google Cloud Console → APIs & Services → Credentials
    // (OAuth 2.0 Client ID, Web application type). See README step 5.
    GOOGLE_CLIENT_ID: "PASTE_YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",

    // Optional: only used to show a friendlier "not authorized" message
    // before Google's own permission check kicks in. Real enforcement
    // is done by who you've shared the sheet with as Editor — this list
    // is just cosmetic, not security.
    EXPECTED_ADMIN_EMAILS: [
      // "you@gmail.com",
    ],
  },
};
