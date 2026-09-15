-- ------------------------------------------------------------
-- 028 — Contact form: mobile number is now a required lead field.
-- The /api/public/lead endpoint already stores a normalized phone in
-- leads.phone (existing VARCHAR(40) column, no schema change needed).
-- This migration surfaces the collected mobile number in the visitor
-- acknowledgement email so the value is visible in the notification
-- pipeline (the admin 'new_lead' alert already includes {phone}).
-- Idempotent: UPDATE only, safe to re-run.
-- ------------------------------------------------------------

UPDATE email_templates SET
  body = 'Hi {name},

Thank you for reaching out through {site_name}. I have received your message about {project_type} and will get back to you within one business day.

We have your contact details on file:
Phone: {phone}

If you would like to book a time directly, you can schedule a call here: {calendly_url}

Best regards,
Abhijeet Varghese'
WHERE slug = 'lead_confirmation';
