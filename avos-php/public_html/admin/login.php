<?php
/**
 * AV OS — admin login (premium, minimal)
 * POSTs to /api/auth/login, then boots the CMS.
 */
require __DIR__ . '/../../includes/bootstrap.php';

if (Auth::check()) {
    header("Location: app/index.html");
    exit;
}

// rate-limited token issuance is handled by the API; page itself is static shell
$csrf = Auth::csrf();
?>
<!doctype html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sign in — AV OS</title>
  <meta name="robots" content="noindex, nofollow">
  <style>
    @font-face { font-family:"Inter Tight"; font-weight:300 700; font-display:swap;
      src:url("app/assets/fonts/inter-tight-normal.woff2") format("woff2"); }
    @font-face { font-family:"Poppins"; font-weight:500 600; font-display:swap;
      src:url("app/assets/fonts/poppins-medium.woff2") format("woff2"); }
    * { box-sizing:border-box; margin:0; padding:0; }
    body {
      font-family:"Inter Tight",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      background:
        radial-gradient(720px 420px at 85% -10%, rgba(110,168,255,.14), transparent 60%),
        radial-gradient(620px 420px at -10% 110%, rgba(110,168,255,.08), transparent 60%),
        linear-gradient(180deg,#050B1A 0%, #080F22 55%, #0B1430 100%);
      min-height:100svh; display:grid; place-items:center; padding:24px; color:#EFF0EA;
      -webkit-font-smoothing:antialiased;
    }
    .card {
      width:min(400px,100%); background:rgba(13,21,48,.82);
      border:1px solid rgba(148,170,230,.18); border-radius:22px;
      box-shadow:0 60px 120px -50px rgba(0,0,0,.8);
      padding:38px 34px 30px; -webkit-backdrop-filter:blur(18px); backdrop-filter:blur(18px);
    }
    .logo { display:flex; align-items:center; gap:12px; margin-bottom:26px; }
    .logo__mark {
      width:42px; height:42px; border-radius:12px; display:grid; place-items:center;
      background:linear-gradient(135deg,#12224C,#0B1430); border:1px solid rgba(148,170,230,.3);
      color:#6EA8FF; font-weight:700; font-size:14px; letter-spacing:.05em;
    }
    .logo__name { font-family:"Poppins",sans-serif; font-weight:600; font-size:19px; letter-spacing:-.01em; }
    .logo__name em { font-style:normal; color:#6EA8FF; }
    .logo__sub { font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:#96A0BE; margin-top:2px; }
    h1 { font-size:22px; font-weight:600; letter-spacing:-.02em; }
    p.lead { color:#96A0BE; font-size:13px; margin-top:6px; line-height:1.6; }
    form { margin-top:24px; display:grid; gap:14px; }
    label { font-size:12px; font-weight:600; color:#C6CBDD; display:grid; gap:7px; }
    input {
      min-height:46px; background:rgba(8,15,34,.7); border:1px solid rgba(148,170,230,.22);
      border-radius:11px; padding:0 15px; color:#EFF0EA; font:inherit; font-size:14.5px;
      transition:border-color .2s, box-shadow .2s, background .2s;
    }
    input:focus { outline:none; border-color:#6EA8FF; background:#0A1430; box-shadow:0 0 0 3px rgba(110,168,255,.15); }
    button {
      min-height:48px; border-radius:11px; border:0; cursor:pointer;
      background:#2E5AAC; color:#fff; font:inherit; font-weight:600; font-size:14.5px;
      transition:background .2s, transform .2s, box-shadow .2s;
    }
    button:hover { background:#1E4390; box-shadow:0 12px 28px -10px rgba(46,90,172,.6); }
    button:active { transform:translateY(1px); }
    button:disabled { opacity:.6; cursor:default; }
    .err { display:none; font-size:12.5px; color:#FF8A8A; background:rgba(194,59,59,.12);
      border:1px solid rgba(194,59,59,.3); border-radius:10px; padding:10px 13px; }
    .err.show { display:block; }
    .foot { margin-top:22px; text-align:center; font-size:11.5px; color:#66708C; }
    .spinner { display:none; width:16px; height:16px; border-radius:50%;
      border:2px solid rgba(255,255,255,.35); border-top-color:#fff;
      animation:spin .7s linear infinite; vertical-align:-3px; margin-right:8px; }
    @keyframes spin { to { transform:rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card" role="main">
    <div class="logo">
      <div class="logo__mark">AV</div>
      <div>
        <p class="logo__name">AV <em>OS</em></p>
        <p class="logo__sub">Creative Intelligence Platform</p>
      </div>
    </div>
    <h1>Welcome back.</h1>
    <p class="lead">Sign in to manage AbhijeetVarghese.com — content, design, AI and growth.</p>
    <form id="loginForm" novalidate>
      <div class="err" id="err"></div>
      <label>Email
        <input type="email" id="email" autocomplete="username" placeholder="admin@abhijeetvarghese.com" required>
      </label>
      <label>Password
        <input type="password" id="password" autocomplete="current-password" placeholder="••••••••••••" required>
      </label>
      <button type="submit" id="btn"><span class="spinner" id="spinner"></span><span id="btnLabel">Sign in</span></button>
    </form>
    <form id="twofaForm" style="display:none" autocomplete="off">
      <p style="font-size:12.5px;color:#C6CBDD;margin-bottom:12px;line-height:1.6">Two-factor authentication is enabled for this account. Enter the 6-digit code from your authenticator app (or a recovery code).</p>
      <label>Authentication code
        <input type="text" id="twofa" inputmode="numeric" placeholder="000000" maxlength="10" required>
      </label>
      <button type="submit" id="btn2"><span class="spinner" id="spinner2"></span><span id="btnLabel2">Verify</span></button>
      <p style="font-size:11.5px;margin-top:12px"><a href="#" id="backToLogin" style="color:#96A0BE">← Back to sign in</a></p>
    </form>
    <p class="foot">Protected by secure sessions · login throttling · audit logging · optional TOTP 2FA</p>
  </div>
  <script>
    const form = document.getElementById("loginForm");
    const err = document.getElementById("err");
    const btn = document.getElementById("btn");
    const spinner = document.getElementById("spinner");
    const label = document.getElementById("btnLabel");
    form.addEventListener("submit", async e => {
      e.preventDefault();
      err.classList.remove("show");
      btn.disabled = true; spinner.style.display = "inline-block"; label.textContent = "Signing in…";
      try {
        const r = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: document.getElementById("email").value.trim(), password: document.getElementById("password").value })
        });
        const d = await r.json();
        if (r.ok && d.ok) {
          if (d.data && d.data.must_change_password) { location.href = "/admin/change-password.php"; return; }
          if (d.data && d.data.must_2fa) {
            form.style.display = "none";
            twofaForm.style.display = "block";
            document.getElementById("twofa").focus();
            return;
          }
          location.href = "/admin/app/index.html"; return;
        }
        err.textContent = (d.error && d.error.message) || d.error || "Sign in failed.";
        err.classList.add("show");
      } catch (ex) {
        err.textContent = "Cannot reach the server. Is the backend running?";
        err.classList.add("show");
      }
      btn.disabled = false; spinner.style.display = "none"; label.textContent = "Sign in";
    });
    const twofaForm = document.getElementById("twofaForm");
    const err2 = document.getElementById("err");
    twofaForm.addEventListener("submit", async e => {
      e.preventDefault();
      err2.classList.remove("show");
      const b2 = document.getElementById("btn2");
      b2.disabled = true; document.getElementById("spinner2").style.display = "inline-block";
      try {
        const r = await fetch("/api/auth/2fa/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: document.getElementById("twofa").value.trim() })
        });
        const d = await r.json();
        if (r.ok && d.ok) { location.href = "/admin/app/index.html"; return; }
        err2.textContent = (d.error && d.error.message) || "Verification failed.";
        err2.classList.add("show");
      } catch (ex) {
        err2.textContent = "Cannot reach the server.";
        err2.classList.add("show");
      }
      b2.disabled = false; document.getElementById("spinner2").style.display = "none";
    });
    document.getElementById("backToLogin").addEventListener("click", e => {
      e.preventDefault();
      twofaForm.style.display = "none";
      form.style.display = "block";
    });
  </script>
</body>
</html>
