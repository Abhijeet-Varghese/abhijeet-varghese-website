<?php
declare(strict_types=1);
namespace AvOS\Auth;

/**
 * Minimal mail boundary needed by password reset (Phase 2 §3C.15).
 * The full email module (templates, queue, owner/client audiences) is Phase 3O.
 *
 * `isConfigured()` exists so the reset service can report honestly instead of
 * claiming an email was sent when no transport is wired up.
 */
interface MailerInterface
{
    public function isConfigured(): bool;
    public function sendPasswordReset(string $toEmail, string $token): bool;
}
