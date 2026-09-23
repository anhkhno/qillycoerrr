/* ============================================================
   CONFIG — edit these to match your sheet
   ============================================================ */
const CONFIG = {
  // The ID from your Google Sheet's URL (…/d/THIS_PART/edit)
  SHEET_ID: "1Gc6oy0_d6dE7_SWtb3d6Sl93jRinKYnPKa23swH6QTM",

  // Every tab name you want searched (must match the tab names exactly)
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
  // the first match wins, checked top to bottom.
  STATUS_RULES: [
    { keyword: "posted",              category: "posted",  label: "posted out" },
    { keyword: "admin house",         category: "admin",   label: "admin house" },
    { keyword: "otw to my",           category: "transit", label: "otw to my" },
    { keyword: "arrived to wh",       category: "transit", label: "arrived at wh" },
    { keyword: "arrived at wh",       category: "transit", label: "arrived at wh" },
    { keyword: "otw to wh",           category: "transit", label: "otw to wh" },
    { keyword: "secured",             category: "secured", label: "secured" },
    { keyword: "paid to the seller",  category: "secured", label: "secured" },
  ],

  // Shown in the top banner. Edit freely, or leave editing to index.html directly.
  ANNOUNCEMENT: null, // e.g. "PO closes 30 Sept! DM admin for late slots 🌸"
};

/* ============================================================
   Data fetching
   ============================================================ */
function sheetCsvUrl(tabName) {
  return `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
}

// Minimal CSV parser that handles quoted fields containing commas/newlines.
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ""; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function classifyStatus(rawStatus) {
  const text = (rawStatus || "").toLowerCase();
  for (const rule of CONFIG.STATUS_RULES) {
    if (text.includes(rule.keyword)) return { category: rule.category, label: rule.label };
  }
  return { category: "other", label: rawStatus || "pending" };
}

function normalizeHandle(raw) {
  return (raw || "").trim().toLowerCase().replace(/^@/, "");
}

async function fetchAllOrders() {
  const cols = CONFIG.COLUMNS;
  const results = await Promise.allSettled(CONFIG.TABS.map(async (tab) => {
    const res = await fetch(sheetCsvUrl(tab));
    if (!res.ok) throw new Error(`Could not load tab "${tab}"`);
    const rows = parseCsv(await res.text());
    return rows
      .map((r) => ({
        code: (r[cols.code] || "").trim(),
        item: (r[cols.item] || "").trim(),
        telegram: (r[cols.telegram] || "").trim(),
        price: (r[cols.price] || "").trim(),
        payment: (r[cols.payment] || "").trim(),
        statusRaw: (r[cols.status] || "").trim(),
        tab,
      }))
      // Only keep rows that actually belong to a customer and have an item
      .filter((o) => o.telegram && o.item);
  }));

  return results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);
}

/* ============================================================
   UI wiring
   ============================================================ */
const els = {
  banner: document.getElementById("bannerText"),
  form: document.getElementById("searchForm"),
  input: document.getElementById("searchInput"),
  hint: document.getElementById("searchHint"),
  results: document.getElementById("results"),
  orderList: document.getElementById("orderList"),
  empty: document.getElementById("emptyState"),
  loading: document.getElementById("loadingState"),
  statTotal: document.getElementById("statTotal"),
  statSecured: document.getElementById("statSecured"),
  statTransit: document.getElementById("statTransit"),
  statAdmin: document.getElementById("statAdmin"),
  statPosted: document.getElementById("statPosted"),
};

if (CONFIG.ANNOUNCEMENT) els.banner.textContent = CONFIG.ANNOUNCEMENT;

let allOrders = [];
let dataReady = false;

function setLoading(isLoading) {
  els.loading.classList.toggle("hidden", !isLoading);
}

function renderStats(orders) {
  const counts = { secured: 0, transit: 0, admin: 0, posted: 0 };
  orders.forEach((o) => {
    if (counts[o.status.category] !== undefined) counts[o.status.category]++;
  });
  els.statTotal.textContent = orders.length;
  els.statSecured.textContent = counts.secured;
  els.statTransit.textContent = counts.transit;
  els.statAdmin.textContent = counts.admin;
  els.statPosted.textContent = counts.posted;
}

function pillClass(category) {
  return { secured: "pill-secured", transit: "pill-transit", admin: "pill-admin", posted: "pill-posted" }[category] || "pill-other";
}

function renderOrders(orders) {
  els.orderList.innerHTML = orders.map((o) => `
    <div class="order-card">
      <div class="order-info">
        ${o.code ? `<div class="order-code">${escapeHtml(o.code)}</div>` : ""}
        <p class="order-item">${escapeHtml(o.item)}</p>
        ${o.price ? `<p class="order-price">${escapeHtml(o.price)}</p>` : ""}
      </div>
      <span class="status-pill ${pillClass(o.status.category)}">${escapeHtml(o.status.label)}</span>
    </div>
  `).join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function runSearch(query) {
  const handle = normalizeHandle(query);
  if (!handle) return;

  if (!dataReady) {
    els.hint.textContent = "still loading the masterlist, one sec…";
    return;
  }
  els.hint.textContent = "";

  const matches = allOrders
    .filter((o) => normalizeHandle(o.telegram) === handle)
    .map((o) => ({ ...o, status: classifyStatus(o.statusRaw) }));

  els.results.classList.toggle("hidden", matches.length === 0);
  els.empty.classList.toggle("hidden", matches.length > 0);

  if (matches.length > 0) {
    renderStats(matches);
    renderOrders(matches);
  }
}

els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  runSearch(els.input.value);
});

/* ============================================================
   Init
   ============================================================ */
(async function init() {
  setLoading(true);
  try {
    allOrders = await fetchAllOrders();
  } catch (err) {
    els.hint.textContent = "couldn't load the masterlist right now — try refreshing.";
  } finally {
    dataReady = true;
    setLoading(false);
  }
})();
