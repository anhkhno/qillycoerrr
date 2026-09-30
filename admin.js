/* ============================================================
   Google sign-in + Sheets API write
   ============================================================ */
let tokenClient;
let accessToken = null;

const admEls = {
  signInBtn: document.getElementById("signInBtn"),
  signedOutView: document.getElementById("signedOutView"),
  signedInView: document.getElementById("signedInView"),
  authError: document.getElementById("authError"),
  adminEmail: document.getElementById("adminEmail"),
  signOutBtn: document.getElementById("signOutBtn"),
  form: document.getElementById("addOrderForm"),
  submitBtn: document.getElementById("submitBtn"),
  formMsg: document.getElementById("formMsg"),
  fTab: document.getElementById("fTab"),
  fCode: document.getElementById("fCode"),
  fItem: document.getElementById("fItem"),
  fTelegram: document.getElementById("fTelegram"),
  fPrice: document.getElementById("fPrice"),
  fPayment: document.getElementById("fPayment"),
  fStatus: document.getElementById("fStatus"),
};

function populateSelects() {
  admEls.fTab.innerHTML = CONFIG.TABS
    .map((t) => `<option value="${t}">${t}</option>`).join("");

  const seen = new Set();
  const options = CONFIG.STATUS_RULES
    .filter((r) => (seen.has(r.label) ? false : seen.add(r.label)))
    .map((r) => `<option value="${r.label}">${r.label}</option>`);
  admEls.fStatus.innerHTML = options.join("");
}
populateSelects();

function showMsg(el, text, isError) {
  el.textContent = text;
  el.classList.remove("hidden");
  el.classList.toggle("form-msg-error", !!isError);
  el.classList.toggle("form-msg-ok", !isError);
}

function initGoogle() {
  if (!window.google || CONFIG.ADMIN.GOOGLE_CLIENT_ID.startsWith("PASTE_")) {
    showMsg(admEls.authError, "Admin login isn't set up yet — add a Google Client ID in config.js (see README).", true);
    admEls.signInBtn.disabled = true;
    return;
  }
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.ADMIN.GOOGLE_CLIENT_ID,
    scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email",
    callback: async (tokenResponse) => {
      if (tokenResponse.error) {
        showMsg(admEls.authError, "Sign-in was cancelled or failed. Try again.", true);
        return;
      }
      accessToken = tokenResponse.access_token;
      await onSignedIn();
    },
  });
}
window.addEventListener("load", initGoogle);

admEls.signInBtn.addEventListener("click", () => {
  admEls.authError.classList.add("hidden");
  tokenClient.requestAccessToken();
});

async function onSignedIn() {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const info = await res.json();
    admEls.adminEmail.textContent = info.email || "signed in";

    const expected = CONFIG.ADMIN.EXPECTED_ADMIN_EMAILS;
    if (expected && expected.length && !expected.includes(info.email)) {
      showMsg(
        admEls.authError,
        `Signed in as ${info.email}, which isn't on the expected admin list. If this should be allowed, add it in config.js — but note the sheet's own Editor permissions are what actually control write access.`,
        true
      );
    }

    admEls.signedOutView.classList.add("hidden");
    admEls.signedInView.classList.remove("hidden");
  } catch (err) {
    showMsg(admEls.authError, "Signed in, but couldn't confirm your account. Try again.", true);
  }
}

admEls.signOutBtn.addEventListener("click", () => {
  if (accessToken) google.accounts.oauth2.revoke(accessToken, () => {});
  accessToken = null;
  admEls.signedInView.classList.add("hidden");
  admEls.signedOutView.classList.remove("hidden");
  admEls.form.reset();
});

/* ============================================================
   Submit new order → Sheets API append
   ============================================================ */
function buildRow() {
  // Columns A→G, matching CONFIG.COLUMNS (A is always left blank in this sheet)
  const row = ["", "", "", "", "", "", ""];
  row[CONFIG.COLUMNS.code] = admEls.fCode.value.trim();
  row[CONFIG.COLUMNS.item] = admEls.fItem.value.trim();
  row[CONFIG.COLUMNS.telegram] = "@" + admEls.fTelegram.value.trim().replace(/^@/, "");
  row[CONFIG.COLUMNS.price] = admEls.fPrice.value.trim();
  row[CONFIG.COLUMNS.payment] = admEls.fPayment.value.trim();
  row[CONFIG.COLUMNS.status] = admEls.fStatus.value;
  return row;
}

admEls.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  admEls.formMsg.classList.add("hidden");
  admEls.submitBtn.disabled = true;
  admEls.submitBtn.textContent = "adding…";

  const tab = admEls.fTab.value;
  const range = `${tab}!B1:G`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [buildRow().slice(1)] }), // slice off column A
    });

    if (res.status === 403) {
      showMsg(admEls.formMsg, "Permission denied — your Google account doesn't have Editor access to this sheet. Ask the sheet owner to share it with you.", true);
    } else if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      showMsg(admEls.formMsg, `Couldn't add the order: ${errBody.error?.message || res.statusText}`, true);
    } else {
      showMsg(admEls.formMsg, "Order added! ✿", false);
      admEls.form.reset();
      populateSelects();
    }
  } catch (err) {
    showMsg(admEls.formMsg, "Network error — couldn't reach the sheet. Try again.", true);
  } finally {
    admEls.submitBtn.disabled = false;
    admEls.submitBtn.textContent = "add order";
  }
});
