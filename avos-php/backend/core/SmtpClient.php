<?php
/**
 * AV OS — pure-PHP SMTP client (no Composer, Hostinger-safe).
 * Supports plain, STARTTLS and implicit-SSL (SMTPS), AUTH LOGIN.
 * Credentials are never logged. Returns ['ok'=>bool,'error'=>string].
 */
final class SmtpClient
{
    private $sock = null;

    public function __construct(
        private string $host,
        private int $port = 587,
        private string $encryption = 'tls',   // none | tls (STARTTLS) | ssl (implicit)
        private string $username = '',
        private string $password = '',
        private string $from = '',
        private string $replyTo = '',
    ) {}

    public static function fromConfig(array $cfg): self
    {
        return new self(
            (string)($cfg['host'] ?? ''),
            (int)($cfg['port'] ?? 587),
            (string)($cfg['encryption'] ?? 'tls'),
            (string)($cfg['username'] ?? ''),
            (string)($cfg['password'] ?? ''),
            (string)($cfg['from'] ?? ''),
            (string)($cfg['reply_to'] ?? ''),
        );
    }

    public function send(string $to, string $subject, string $body): array
    {
        if ($this->host === '' || $this->from === '') return ['ok' => false, 'error' => 'SMTP not configured'];
        try {
            $this->connect();
            $this->cmd('EHLO avos.local');
            if ($this->encryption === 'tls') {
                $this->cmd('STARTTLS');
                $ok = stream_socket_enable_crypto($this->sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                if (!$ok) throw new RuntimeException('STARTTLS negotiation failed');
                $this->cmd('EHLO avos.local');
            }
            if ($this->username !== '') {
                $this->cmd('AUTH LOGIN');
                $this->cmd(base64_encode($this->username));
                $this->cmd(base64_encode($this->password));
            }
            $this->cmd('MAIL FROM:<' . $this->from . '>');
            $this->cmd('RCPT TO:<' . $to . '>');
            $this->cmd('DATA');
            $headers = "From: " . $this->from . "\r\n"
                     . "To: " . $to . "\r\n"
                     . "Subject: " . mb_encode_mimeheader($subject, 'UTF-8', 'B') . "\r\n"
                     . "Date: " . date('r') . "\r\n"
                     . "MIME-Version: 1.0\r\n"
                     . "Content-Type: text/plain; charset=UTF-8\r\n"
                     . ($this->replyTo !== '' ? "Reply-To: " . $this->replyTo . "\r\n" : '')
                     . "Message-ID: <" . bin2hex(random_bytes(8)) . "@avos.local>\r\n\r\n";
            $this->write($headers . str_replace("\r\n.", "\r\n..", $body));
            $this->cmd('.');
            $this->cmd('QUIT');
            fclose($this->sock);
            return ['ok' => true];
        } catch (Throwable $e) {
            if (is_resource($this->sock)) @fclose($this->sock);
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    private function connect(): void
    {
        $remote = ($this->encryption === 'ssl' ? 'ssl://' : 'tcp://') . $this->host . ':' . $this->port;
        $ctx = stream_context_create(['ssl' => ['verify_peer' => false, 'verify_peer_name' => false, 'allow_self_signed' => true]]);
        $sock = @stream_socket_client($remote, $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $ctx);
        if (!$sock) throw new RuntimeException("Connection failed: $errstr");
        $this->sock = $sock;
        stream_set_timeout($this->sock, 15);
        $this->read(); // banner
    }

    private function cmd(string $c): void
    {
        $this->write($c);
        $this->read();
    }

    private function write(string $c): void
    {
        if (!is_resource($this->sock)) throw new RuntimeException('SMTP socket closed');
        @fwrite($this->sock, $c . "\r\n");
    }

    private function read(): string
    {
        $resp = '';
        while (($line = fgets($this->sock, 1024)) !== false) {
            $resp .= $line;
            if (strlen($line) >= 4 && $line[3] === ' ') break;   // final line of a multi-line reply
            if ($line === '' ) break;
        }
        $code = (int)substr($resp, 0, 3);
        if ($code >= 400) throw new RuntimeException('SMTP error ' . trim($resp));
        return $resp;
    }
}
