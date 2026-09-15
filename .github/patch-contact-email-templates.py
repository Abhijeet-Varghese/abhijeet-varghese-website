from pathlib import Path

p = Path('avos-php/backend/controllers/ApiController.php')
s = p.read_text()

if "EmailTemplateModel::getBySlug($template)" in s:
    print('Contact email code already uses email_templates.')
    raise SystemExit(0)

start_marker = '    // Transactional contact emails — use only the form data.'
end_marker = "    Response::json(['ok' => true, 'id' => $id, 'status' => 'new', 'score' => $leadData['score']], 201);"
start = s.index(start_marker)
end = s.index(end_marker, start)

new_block = r'''    // Transactional contact emails — render CMS templates and deliver from the verified sender.
    try {
        $rawMessage = (string)$leadData['message'];
        $bookingDate = '';
        $bookingTime = '';
        $formMessage = $rawMessage;
        if (preg_match('/(?:^|\n\n)Requested intro call:\s*(.*?)\s+at\s+([^\r\n]+)\s+IST\s*$/s', $rawMessage, $m)) {
            $bookingDate = trim($m[1]);
            $bookingTime = trim($m[2]);
            $formMessage = trim(preg_replace('/(?:^|\n\n)Requested intro call:.*$/s', '', $rawMessage));
        }

        $ownerRecipients = [
            'hi@abhijeetvarghese.com',
            'abhijeetvarghese33@gmail.com',
            'write4abhijeet@gmail.com',
        ];
        $sender = 'hi@abhijeetvarghese.com';
        $siteUrl = AV_SITE_URL ?: 'https://abhijeetvarghese.com';
        $emailVars = [
            'name' => $name,
            'email' => $email,
            'phone' => $leadData['phone'] !== '' ? $leadData['phone'] : '—',
            'company' => $leadData['company'] !== '' ? $leadData['company'] : '—',
            'project_type' => $leadData['lead_type'],
            'source' => $leadData['source'],
            'message' => $formMessage !== '' ? $formMessage : '—',
            'booking_date' => $bookingDate !== '' ? $bookingDate : '—',
            'booking_time' => $bookingTime !== '' ? $bookingTime . ' IST' : '—',
            'owner_mobile' => '+91 969 408 0706',
            'site_name' => 'Abhijeet Varghese',
            'site_url' => $siteUrl,
            'admin_url' => $siteUrl . '/admin/',
        ];

        $sendTemplate = static function (string $template, string $to, string $replyTo, array $vars) use ($sender): void {
            $tpl = EmailTemplateModel::getBySlug($template);
            if (!$tpl) {
                throw new RuntimeException("Email template not found: {$template}");
            }
            $subject = EmailModel::render($tpl['subject'], $vars);
            $body = EmailModel::render($tpl['body'], $vars);
            $smtp = SiteConfig::get('smtp');
            $ok = false;
            $error = '';
            try {
                if (!empty($smtp['host'])) {
                    $smtpCfg = array_merge($smtp, ['from' => $sender, 'reply_to' => $replyTo !== '' ? $replyTo : $sender]);
                    $result = SmtpClient::fromConfig($smtpCfg)->send($to, $subject, $body);
                    $ok = (bool)($result['ok'] ?? false);
                    $error = (string)($result['error'] ?? '');
                } else {
                    $headers = "From: " . $sender . "\r\n"
                        . "Reply-To: " . ($replyTo !== '' ? $replyTo : $sender) . "\r\n"
                        . "Content-Type: text/plain; charset=UTF-8\r\n";
                    $ok = @mail($to, $subject, $body, $headers);
                }
            } catch (Throwable $e) {
                $error = $e->getMessage();
            }
            try {
                Database::q(
                    "INSERT INTO email_log (template, recipient, subject, status, sent_at, error) VALUES (?,?,?,?,NOW(),?)",
                    [$template, $to, $subject, $ok ? 'sent' : 'failed', mb_substr($error, 0, 480)]
                );
            } catch (Throwable $e) {
                // Email logging must never affect lead submission.
            }
        };

        foreach ($ownerRecipients as $recipient) {
            $sendTemplate('new_lead', $recipient, $email, $emailVars);
        }
        if ($email !== '') {
            $sendTemplate('lead_confirmation', $email, $sender, $emailVars);
        }
    } catch (Throwable $e) {
        ErrorModel::log('lead_email_send', $e->getMessage(), 'POST');
    }
'''

p.write_text(s[:start] + new_block + s[end:])
print('Contact lead email flow patched to use email_templates.')
