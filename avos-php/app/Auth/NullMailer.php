<?php
declare(strict_types=1);
namespace AvOS\Auth;

/**
 * The only mailer in Phase 3C. Reports itself as unconfigured so nothing can
 * mistake it for working delivery. It never pretends to send.
 */
final class NullMailer implements MailerInterface
{
    public function isConfigured(): bool { return false; }
    public function sendPasswordReset(string $toEmail, string $token): bool { return false; }
}
