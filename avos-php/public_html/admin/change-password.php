<?php
/** AV OS — forced password change (first login) */
// Locate the app root (backend/includes live OUTSIDE the web root, so the
// web root may be public_html/ or a subdirectory like public_html/next/).
// Walk upward until includes/bootstrap.php is found - no hardcoded depth.
$__avos_root = __DIR__;
for ($__i = 0; $__i < 8; $__i++) {
    if (is_file($__avos_root . '/includes/bootstrap.php')) break;
    $__parent = dirname($__avos_root);
    if ($__parent === $__avos_root) { $__avos_root = null; break; }
    $__avos_root = $__parent;
}
if ($__avos_root === null || !is_file($__avos_root . '/includes/bootstrap.php')) {
    $__avos_root = dirname(__DIR__, 2);   // legacy fallback (unchanged behaviour)
}
require $__avos_root . '/includes/bootstrap.php';
unset($__avos_root, $__i, $__parent);

if (!Auth::check()) { header('Location: login.php'); exit; }
if (!Auth::mustChangePassword()) { header('Location: app/index.html'); exit; }
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Set a new password — AV OS</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0B1430;min-height:100svh;display:grid;place-items:center;padding:24px;color:#EFF0EA}
  .card{width:min(420px,100%);background:#0D1530;border:1px solid rgba(148,170,230,.18);border-radius:20px;padding:34px;box-shadow:0 40px 80px -40px #000}
  h1{font-size:21px;font-weight:700;letter-spacing:-.02em} h1 em{color:#6EA8FF;font-style:normal}
  p.sub{color:#96A0BE;font-size:13px;margin:6px 0 20px;line-height:1.6}
  label{display:grid;gap:6px;font-size:12px;font-weight:600;color:#C6CBDD;margin-bottom:14px}
  input{min-height:44px;background:rgba(8,15,34,.7);border:1px solid rgba(148,170,230,.22);border-radius:10px;padding:0 14px;color:#EFF0EA;font:inherit;font-size:14px}
  input:focus{outline:none;border-color:#6EA8FF;box-shadow:0 0 0 3px rgba(110,168,255,.15)}
  button{width:100%;min-height:48px;border-radius:10px;border:0;background:#2E5AAC;color:#fff;font:inherit;font-weight:600;font-size:14.5px;cursor:pointer;margin-top:4px}
  button:hover{background:#1E4390}
  .err{display:none;background:rgba(194,59,59,.12);border:1px solid rgba(194,59,59,.3);color:#FF8A8A;border-radius:10px;padding:10px 13px;font-size:12.5px;margin-bottom:14px}
  .err.show{display:block}
  .hint{font-size:11.5px;color:#66708C;margin-top:10px;text-align:center}
</style>
</head>
<body>
<div class="card">
  <h1>Set a new <em>password</em>.</h1>
  <p class="sub">For security, you must replace the temporary password before continuing.</p>
  <div class="err" id="err"></div>
  <form id="pf">
    <label>Current (temporary) password <input type="password" id="cur" autocomplete="current-password" required></label>
    <label>New password <input type="password" id="new1" minlength="12" autocomplete="new-password" required></label>
    <label>Confirm new password <input type="password" id="new2" autocomplete="new-password" required></label>
    <button type="submit">Set password &amp; continue</button>
    <p class="hint">Minimum 12 characters — mix letters, numbers and symbols.</p>
  </form>
</div>
<script>
const f = document.getElementById("pf"), err = document.getElementById("err"), btn = f.querySelector("button");
f.addEventListener("submit", async e => {
  e.preventDefault();
  err.classList.remove("show");
  const cur = document.getElementById("cur").value, n1 = document.getElementById("new1").value, n2 = document.getElementById("new2").value;
  if (n1 !== n2) { err.textContent = "New passwords do not match."; err.classList.add("show"); return; }
  if (n1.length < 12) { err.textContent = "New password must be at least 12 characters."; err.classList.add("show"); return; }
  btn.disabled = true; btn.textContent = "Saving…";
  try {
    const r = await fetch("/api/session", { credentials: "same-origin" });
    const s = await r.json();
    const csrf = s.data.csrf;
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
      credentials: "same-origin",
      body: JSON.stringify({ current_password: cur, new_password: n1 })
    });
    const d = await res.json();
    if (d.ok) { location.href = "app/index.html"; return; }
    err.textContent = d.error?.message || "Failed to change password.";
    err.classList.add("show");
  } catch (ex) { err.textContent = "Cannot reach the server."; err.classList.add("show"); }
  btn.disabled = false; btn.textContent = "Set password & continue";
});
</script>
</body>
</html>
