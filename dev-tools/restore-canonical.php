<?php
/** AV OS — restore canonical seed into content_store (dev tool). */
error_reporting(E_ALL);
$root = dirname(__DIR__, 2);
$file = dirname($root) . '/avos-data/site.json';
if (!is_file($file)) { fwrite(STDERR, "seed not found: $file\n"); exit(1); }
$site = json_decode((string) file_get_contents($file), true);
if (!is_array($site)) { fwrite(STDERR, "invalid seed JSON\n"); exit(1); }
$db = new mysqli('127.0.0.1', 'avos', 'aV0s_d3v_9xKq2mN7', 'avos');
if ($db->connect_errno) { fwrite(STDERR, "db: " . $db->connect_error . "\n"); exit(1); }
$db->set_charset('utf8mb4');
$stmt = $db->prepare("INSERT INTO content_store (key_name, data, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = NOW()");
foreach ($site as $key => $data) {
    if (!is_string($key) || $key === '') continue;
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) { fwrite(STDERR, "encode failed for: $key\n"); continue; }
    $stmt->bind_param('ss', $key, $json);
    $stmt->execute();
    echo "restored: $key\n";
}
$stmt->close();
$db->query("INSERT INTO feature_flags (flag, enabled, updated_at) VALUES ('auto_publish', 1, NOW()) ON DUPLICATE KEY UPDATE enabled = 1, updated_at = NOW()");
echo "auto_publish=true\nDONE\n";
$db->close();
