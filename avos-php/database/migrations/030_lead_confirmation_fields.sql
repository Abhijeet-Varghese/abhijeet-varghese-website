-- ------------------------------------------------------------
-- 030 — Acknowledgement email: surface Name, Email, Organisation and
-- Mobile in the visitor confirmation. The admin 'new_lead' alert already
-- includes all four; this brings the visitor-facing email in line with the
-- mobile-first contact brief (migration 028 added {phone}).
-- Idempotent UPDATE — safe to re-run.
-- ------------------------------------------------------------

UPDATE email_templates SET
  subject = 'Thanks, {name} — we received your message',
  body = 'Hi {name},

Thank you for reaching out through {site_name}. I have received your message about {project_type} and will get back to you within one business day.

Your contact details:
Name: {name}
Email: {email}
Organisation: {company}
Mobile: {phone}

If you would like to book a time directly, you can schedule a call here: {calendly_url}

Best regards,
Abhijeet Varghese'
WHERE slug = 'lead_confirmation';
