/* ============================================================
   Telegram-username + code login, backed by the Apps Script
   ============================================================ */
let session = null; // { username, code } once logged in — sent with every request

const admEls = {
  loginForm: document.getElementById("loginForm"),
  lUsername: document.getElementById("lUsername"),
  lCode: document.getElementById("lCode"),
  loginBtn: document.getElementById("loginBtn"),
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

async function callBackend(payload) {
  if (CONFIG.ADMIN.APPS_SCRIPT_URL.startsWith("PASTE_")) {
    return { ok: false, error: "Admin login isn't set up yet — deploy apps-script/Code.gs and paste its URL into config.js (see README)." };
  }
  const res = await fetch(CONFIG.ADMIN.APPS_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(payload), // no explicit Content-Type — avoids a CORS preflight
  });
  return res.json();
}

/* --------------------------- login --------------------------- */
admEls.loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  admEls.authError.classList.add("hidden");
  admEls.loginBtn.disabled = true;
  admEls.loginBtn.textContent = "checking…";

  const username = admEls.lUsername.value.trim().replace(/^@/, "");
  const code = admEls.lCode.value.trim();

  try {
    const result = await callBackend({ action: "verify", username, code });
    if (result.ok) {
      session = { username, code };
      admEls.adminEmail.textContent = "@" + username;
      admEls.signedOutView.classList.add("hidden");
      admEls.signedInView.classList.remove("hidden");
    } else {
      showMsg(admEls.authError, result.error || "Login failed.", true);
    }
  } catch (err) {
    showMsg(admEls.authError, "Couldn't reach the login server. Try again.", true);
  } finally {
    admEls.loginBtn.disabled = false;
    admEls.loginBtn.textContent = "log in";
  }
});

admEls.signOutBtn.addEventListener("click", () => {
  session = null;
  admEls.loginForm.reset();
  admEls.signedInView.classList.add("hidden");
  admEls.signedOutView.classList.remove("hidden");
  admEls.form.reset();
});

/* ---------------------- add order submit ---------------------- */
function buildOrder() {
  return {
    code: admEls.fCode.value.trim(),
    item: admEls.fItem.value.trim(),
    telegram: admEls.fTelegram.value.trim(),
    price: admEls.fPrice.value.trim(),
    payment: admEls.fPayment.value.trim(),
    status: admEls.fStatus.value,
  };
}

admEls.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  admEls.formMsg.classList.add("hidden");
  admEls.submitBtn.disabled = true;
  admEls.submitBtn.textContent = "adding…";

  try {
    const result = await callBackend({
      action: "addOrder",
      username: session.username,
      code: session.code,
      tab: admEls.fTab.value,
      order: buildOrder(),
    });

    if (result.ok) {
      showMsg(admEls.formMsg, "Order added! ✿", false);
      admEls.form.reset();
      populateSelects();
    } else if (result.error && result.error.toLowerCase().includes("invalid")) {
      // login expired/was wrong — send them back to the login screen
      session = null;
      admEls.signedInView.classList.add("hidden");
      admEls.signedOutView.classList.remove("hidden");
      showMsg(admEls.authError, "Your login couldn't be verified — please log in again.", true);
    } else {
      showMsg(admEls.formMsg, result.error || "Couldn't add the order.", true);
    }
  } catch (err) {
    showMsg(admEls.formMsg, "Network error — couldn't reach the sheet. Try again.", true);
  } finally {
    admEls.submitBtn.disabled = false;
    admEls.submitBtn.textContent = "add order";
  }
});
