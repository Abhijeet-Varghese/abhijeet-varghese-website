from pathlib import Path

p = Path('avos-php/backend/controllers/ApiController.php')
s = p.read_text()
marker = '        // v2: email engine — confirmation to visitor + admin alert'
if marker not in s:
    print('Contact email customization already applied.')
    raise SystemExit(0)
start = s.index(marker)
end_marker = "        Response::json(['ok' => true, 'id' => $id, 'status' => 'new', 'score' => $leadData['score']], 201);"
end = s.index(end_marker, start)

replacement = r'''        // Transactional contact emails — use only the form data.
        // Delivery is best-effort and never blocks the lead being saved in AV OS.
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

            $ownerSubject = 'New intro call request — ' . $name;
            $ownerBody = "Hi Abhijeet,\n\n"
                . "You have a new intro call request through your website.\n\n"
                . "YOUR DETAILS\n\n"
                . "Name: {$name}\n"
                . "Email: {$email}\n"
                . "Organization: " . ($leadData['company'] !== '' ? $leadData['company'] : '—') . "\n"
                . "Mobile Number: " . ($leadData['phone'] !== '' ? $leadData['phone'] : '—') . "\n\n"
                . "ANYTHING I SHOULD KNOW?\n\n"
                . ($formMessage !== '' ? $formMessage : '—') . "\n\n"
                . "PREFERRED TIME\n\n"
                . "Date: " . ($bookingDate !== '' ? $bookingDate : '—') . "\n"
                . "Time: " . ($bookingTime !== '' ? $bookingTime . ' IST' : '—') . "\n\n"
                . "—\n"
                . "Abhijeet Varghese\n"
                . $sender . "\n"
                . $siteUrl . "\n";

            $visitorSubject = 'Your intro call request — Abhijeet Varghese';
            $visitorBody = "Hi {$name},\n\n"
                . "Thank you for reaching out.\n\n"
                . "I've received your intro call request and the details you've shared.\n\n"
                . "YOUR REQUEST\n\n"
                . "Organization: " . ($leadData['company'] !== '' ? $leadData['company'] : '—') . "\n\n"
                . "What you'd like to discuss:\n"
                . ($formMessage !== '' ? $formMessage : '—') . "\n\n"
                . "Preferred date: " . ($bookingDate !== '' ? $bookingDate : '—') . "\n"
                . "Preferred time: " . ($bookingTime !== '' ? $bookingTime . ' IST' : '—') . "\n\n"
                . "I'll review your request and get back to you at {$email} to confirm the conversation.\n\n"
                . "Looking forward to speaking with you.\n\n"
                . "Best,\n"
                . "Abhijeet Varghese\n"
                . "Creative Director · Experience Designer\n"
                . $sender . "\n"
                . $siteUrl . "\n";

            $sendMail = static function (string $to, string $subject, string $body, string $replyTo = '') use ($sender): void {
                $smtp = SiteConfig::get('smtp');
                $ok = false;
                $error = '';
                try {
                    if (!empty($smtp['host'])) {
                        $smtpCfg = array_merge($smtp, ['from' => $sender, 'reply_to' => $replyTo]);
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
                        ['contact_form', $to, $subject, $ok ? 'sent' : 'failed', mb_substr($error, 0, 480)]
                    );
                } catch (Throwable $e) {
                    // Email logging must never affect lead submission.
                }
            };

            foreach ($ownerRecipients as $recipient) {
                $sendMail($recipient, $ownerSubject, $ownerBody, $email);
            }
            if ($email !== '') {
                $sendMail($email, $visitorSubject, $visitorBody, $sender);
            }
        } catch (Throwable $e) {
            ErrorModel::log('lead_email_send', $e->getMessage(), 'POST');
        }
'''

p.write_text(s[:start] + replacement + s[end:])
print('Contact email customization applied.')
