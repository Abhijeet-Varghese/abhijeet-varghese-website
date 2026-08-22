<?php
/**
 * AV OS — web installer (Hostinger). Self-disables after success.
 *
 * Single engine: backend/core/Installer.php → MigrationRunner (the SAME
 * migration chain + checksum + portability handling as database/migrate.php).
 * Requires config.local.php (DB credentials) already present at the AV OS root.
 */
$root = dirname(__DIR__, 2);

if (is_file(__DIR__ . '/.installed')) {
    http_response_code(404);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><meta charset="utf-8"><title>Installer</title><body style="font-family:system-ui;display:grid;place-items:center;min-height:100vh;background:#0B1430;color:#EFF0EA"><div style="text-align:center"><h2 style="margin:0 0 8px">Installation already completed.</h2><p style="color:#96A0BE">The installer is locked. Use the admin panel instead.</p><a href="../admin/login.php" style="color:#6EA8FF">Go to admin →</a></div></body>';
    exit;
}

// config.php loads config.local.php itself (outside web root, never committed)
require $root . '/backend/config/config.php';   // defines AV_DB, AV_ROOT, AV_ENC_KEY …
require $root . '/backend/core/MigrationRunner.php';
require $root . '/backend/core/Installer.php';

$errors = [];
$done = false;
$tempPass = '';
$adminEmail = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $adminEmail = strtolower(trim($_POST['email'] ?? ''));
    $name = trim($_POST['name'] ?? 'Abhijeet Varghese');
    $pass = $_POST['password'] ?? '';
    $pass2 = $_POST['password2'] ?? '';
    $createPass = !empty($_POST['generate']);

    if (!filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) $errors[] = 'Enter a valid admin email.';
    if (!$createPass && strlen($pass) < 12) $errors[] = 'Password must be at least 12 characters.';
    if (!$createPass && $pass !== $pass2) $errors[] = 'Passwords do not match.';
    if (empty(AV_DB['name']) || empty(AV_DB['user'])) $errors[] = 'Database not configured — create config.local.php at the AV OS root first (see docs/DEPLOY-HOSTINGER-PHP.md).';

    if (!$errors) {
        $res = Installer::run([
            'email' => $adminEmail,
            'name' => $name,
            'password' => $pass,
            'create_pass' => $createPass,
            'lock_path' => __DIR__ . '/.installed',
        ]);
        if ($res['ok']) {
            $done = true;
            $tempPass = $res['temp_pass'];
            $adminEmail = $res['email'];
        } else {
            $errors = $res['errors'];
        }
    }
}
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Install — AV OS</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0B1430;min-height:100svh;display:grid;place-items:center;padding:24px;color:#EFF0EA}
  .card{width:min(440px,100%);background:#0D1530;border:1px solid rgba(148,170,230,.18);border-radius:20px;padding:34px;box-shadow:0 40px 80px -40px #000}
  h1{font-size:22px;font-weight:700;letter-spacing:-.02em} h1 em{color:#6EA8FF;font-style:normal}
  p.sub{color:#96A0BE;font-size:13px;margin:6px 0 22px;line-height:1.6}
  label{display:grid;gap:6px;font-size:12px;font-weight:600;color:#C6CBDD;margin-bottom:14px}
  input{min-height:44px;background:rgba(8,15,34,.7);border:1px solid rgba(148,170,230,.22);border-radius:10px;padding:0 14px;color:#EFF0EA;font:inherit;font-size:14px}
  input:focus{outline:none;border-color:#6EA8FF;box-shadow:0 0 0 3px rgba(110,168,255,.15)}
  button{width:100%;min-height:48px;border-radius:10px;border:0;background:#2E5AAC;color:#fff;font:inherit;font-weight:600;font-size:14.5px;cursor:pointer;margin-top:6px}
  button:hover{background:#1E4390}
  .err{background:rgba(194,59,59,.12);border:1px solid rgba(194,59,59,.3);color:#FF8A8A;border-radius:10px;padding:10px 13px;font-size:12.5px;margin-bottom:14px}
  .ok{background:rgba(30,142,90,.12);border:1px solid rgba(30,142,90,.35);color:#7FDCA9;border-radius:10px;padding:14px;font-size:13px;line-height:1.7;margin-bottom:14px}
  .hint{font-size:11.5px;color:#66708C}
  code{background:rgba(110,168,255,.12);padding:2px 7px;border-radius:6px;font-size:12.5px}
</style>
</head>
<body>
<div class="card">
<?php if ($done): ?>
  <h1>Install <em>complete</em>.</h1>
  <div class="ok" style="margin-top:16px">
    <b>Admin created</b>
    Email: <code><?= htmlspecialchars($adminEmail) ?></code><br>
    <?php if ($tempPass): ?>
      Temporary password: <code><?= htmlspecialchars($tempPass) ?></code><br>
      <span style="font-size:11px">Copy it now — you'll be asked to change it on first login.</span>
    <?php else: ?>
      Use the password you set — you'll be asked to change it on first login.
    <?php endif; ?>
  </div>
  <p class="sub" style="margin-bottom:18px">The installer is now <b>locked</b>.</p>
  <a href="../admin/login.php" style="display:block;text-align:center;background:#2E5AAC;color:#fff;text-decoration:none;font-weight:600;padding:14px;border-radius:10px">Go to admin →</a>
<?php else: ?>
  <h1>Install <em>AV OS</em></h1>
  <p class="sub">First-run setup: applies all migrations (001–026), seeds real content and provisions the Super Admin.</p>
  <?php foreach ($errors as $e): ?><div class="err"><?= htmlspecialchars($e) ?></div><?php endforeach; ?>
  <form method="post">
    <label>Admin name <input name="name" value="Abhijeet Varghese" required></label>
    <label>Admin email <input type="email" name="email" placeholder="you@abhijeetvarghese.com" required></label>
    <label>Password <input type="password" name="password" minlength="12" autocomplete="new-password"></label>
    <label>Confirm password <input type="password" name="password2" autocomplete="new-password"></label>
    <label style="flex-direction:row;align-items:center;gap:9px;font-weight:500;color:#C6CBDD">
      <input type="checkbox" name="generate" value="1" style="width:18px;min-height:0;height:18px;accent-color:#6EA8FF">
      Generate a secure temporary password</label>
    <button type="submit">Install AV OS</button>
    <p class="hint" style="margin-top:12px;text-align:center">Requires config.local.php with DB credentials at the AV OS root. Installer disables itself after success.</p>
  </form>
<?php endif; ?>
</div>
</body>
</html>
