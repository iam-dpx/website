/*
  encrypt.ts
  Dead Pixel — link encryptor
  Written by Dead Pixel (iamreal.dpx@gmail.com)

  Encryption approach (deliberately standard, not custom):
    - Password -> PBKDF2 (SHA-256, 250,000 iterations) -> AES-256-GCM key
    - Fresh random salt + IV generated per encryption (never reused)
    - Payload format stored in the URL fragment (never sent to a server):
        #v1.<salt_b64url>.<iv_b64url>.<ciphertext_b64url>
    - GCM's built-in authentication tag means a wrong password fails
      cleanly (throws) rather than producing corrupted-but-plausible output.
*/
const PBKDF2_ITERATIONS = 250000;
const PAYLOAD_VERSION = "v1";
/* ---------- base64url helpers ---------- */
function bufToBase64url(buf) {
    const bytes = new Uint8Array(buf);
    let binary = "";
    bytes.forEach((b) => {
        binary += String.fromCharCode(b);
    });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64urlToBuf(b64url) {
    const padded = b64url.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const binary = atob(padded + pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}
/* ---------- key derivation ---------- */
async function deriveKey(password, salt) {
    const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({
        name: "PBKDF2",
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
    }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
/* ---------- encrypt / decrypt ---------- */
async function encryptLink(url, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, new TextEncoder().encode(url));
    return [
        PAYLOAD_VERSION,
        bufToBase64url(salt.buffer),
        bufToBase64url(iv.buffer),
        bufToBase64url(ciphertext),
    ].join(".");
}
/**
 * Throws if the password is wrong or the payload is malformed/tampered —
 * callers should catch and show a generic "incorrect password" message.
 */
async function decryptLink(payload, password) {
    const parts = payload.trim().replace(/^#/, "").split(".");
    if (parts.length !== 4 || parts[0] !== PAYLOAD_VERSION) {
        throw new Error("Malformed payload");
    }
    const [, saltB64, ivB64, cipherB64] = parts;
    const salt = new Uint8Array(base64urlToBuf(saltB64));
    const iv = new Uint8Array(base64urlToBuf(ivB64));
    const ciphertext = base64urlToBuf(cipherB64);
    const key = await deriveKey(password, salt);
    const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ciphertext);
    return new TextDecoder().decode(plainBuf);
}
/* ---------- extracting a payload from pasted input ---------- */
function extractPayload(raw) {
    const trimmed = raw.trim();
    const hashIndex = trimmed.indexOf("#");
    const candidate = hashIndex >= 0 ? trimmed.slice(hashIndex + 1) : trimmed;
    const parts = candidate.split(".");
    return parts.length === 4 && parts[0] === PAYLOAD_VERSION ? candidate : null;
}
/* ---------- UI wiring ---------- */
function showResult(el, html, tone) {
    el.hidden = false;
    el.className = `crypto-result crypto-result--${tone}`;
    el.innerHTML = html;
}
function showDecryptFormIfLinked() {
    const encryptForm = document.getElementById("encryptForm");
    const decryptForm = document.getElementById("decryptForm");
    const payload = extractPayload(window.location.hash);
    if (!payload || !encryptForm || !decryptForm)
        return null;
    encryptForm.hidden = true;
    decryptForm.hidden = false;
    return payload;
}
function initEncryptForm() {
    const form = document.getElementById("encryptForm");
    const urlInput = document.getElementById("encryptUrl");
    const passwordInput = document.getElementById("encryptPassword");
    const result = document.getElementById("cryptoResult");
    if (!form || !urlInput || !passwordInput || !result)
        return;
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const url = urlInput.value.trim();
        const password = passwordInput.value;
        if (!url || !password)
            return;
        try {
            const payload = await encryptLink(url, password);
            const shareUrl = `${location.origin}${location.pathname}#${payload}`;
            showResult(result, `
          <p class="crypto-result__label">Encrypted link:</p>
          <p class="crypto-result__value" id="encryptedOutput">${shareUrl}</p>
          <button class="btn btn--ghost" type="button" id="copyEncryptedBtn">Copy link</button>
        `, "success");
            const copyBtn = document.getElementById("copyEncryptedBtn");
            copyBtn === null || copyBtn === void 0 ? void 0 : copyBtn.addEventListener("click", async () => {
                try {
                    await navigator.clipboard.writeText(shareUrl);
                    copyBtn.textContent = "Copied!";
                    window.setTimeout(() => {
                        copyBtn.textContent = "Copy link";
                    }, 1500);
                }
                catch {
                    // Clipboard API unavailable — the link is still selectable as
                    // plain text above the button.
                }
            });
        }
        catch {
            showResult(result, "Something went wrong encrypting that link. Try again.", "error");
        }
    });
}
const REDIRECT_SECONDS = 10;
function initDecryptForm(payload) {
    const form = document.getElementById("decryptForm");
    const passwordInput = document.getElementById("decryptPassword");
    const result = document.getElementById("cryptoResult");
    if (!form || !passwordInput || !result)
        return;
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const password = passwordInput.value;
        if (!password)
            return;
        try {
            const original = await decryptLink(payload, password);
            startRedirectCountdown(result, original);
        }
        catch {
            showResult(result, "Incorrect password. Try again.", "error");
        }
    });
}
function startRedirectCountdown(result, destination) {
    let secondsLeft = REDIRECT_SECONDS;
    showResult(result, `
      <p class="crypto-result__label">
        Correct password — redirecting in <span id="redirectCountdown">${secondsLeft}</span>s
      </p>
      <a class="crypto-result__value link" href="${destination}" id="redirectLink">${destination}</a>
    `, "success");
    const countdownEl = document.getElementById("redirectCountdown");
    const timer = window.setInterval(() => {
        secondsLeft -= 1;
        if (countdownEl)
            countdownEl.textContent = String(secondsLeft);
        if (secondsLeft <= 0) {
            window.clearInterval(timer);
            window.location.href = destination;
        }
    }, 1000);
}
function init() {
    const payload = showDecryptFormIfLinked();
    if (payload) {
        initDecryptForm(payload);
    }
    else {
        initEncryptForm();
    }
}
document.addEventListener("DOMContentLoaded", init);
export {};
