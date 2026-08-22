-- ============================================================
-- AV OS v2 — Creative Business Operating System
-- Migration 003: Email templates · Campaign descriptions ·
-- Automation inactivity checks (idempotent)
-- ============================================================

-- ------------------------------------------------------------
-- EMAIL TEMPLATES (server-side, editable in CMS, rendered by
-- the email engine with {variables}; SMTP/credentials never
-- exposed to the frontend)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_templates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  subject VARCHAR(190) NOT NULL,
  body TEXT NOT NULL,
  enabled TINYINT(1) DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO email_templates (slug, name, subject, body) VALUES
('new_lead', 'New Lead (admin alert)', 'New lead from {site_name}: {name}',
 'A new lead just arrived.\n\nName: {name}\nEmail: {email}\nPhone: {phone}\nCompany: {company}\nProject type: {project_type}\nSource: {source}\nMessage: {message}\n\nOpen it in AV OS: {admin_url}'),
('lead_confirmation', 'Lead confirmation (visitor)', 'Thanks, {name} — we received your message',
 'Hi {name},\n\nThank you for reaching out through {site_name}. I have received your message about {project_type} and will get back to you within one business day.\n\nIf you would like to book a time directly, you can schedule a call here: {calendly_url}\n\nBest regards,\nAbhijeet Varghese'),
('contact_confirmation', 'Contact confirmation (visitor)', 'Thanks for writing, {name}',
 'Hi {name},\n\nThanks for getting in touch. I will reply to your message shortly.\n\nBest regards,\nAbhijeet Varghese'),
('meeting_confirmation', 'Meeting confirmation', 'Meeting confirmed: {meeting_type}',
 'Hi {name},\n\nYour meeting has been confirmed:\n\nDate: {date}\nTime: {time}\nType: {meeting_type}\n\nIf you need to reschedule, just reply to this email.\n\nBest regards,\nAbhijeet Varghese'),
('password_reset', 'Password reset', 'Reset your AV OS password',
 'Hi {name},\n\nUse this link to reset your AV OS password (expires in 60 minutes):\n{reset_link}\n\nIf you did not request this, ignore this email.\n\nAV OS — {site_name}'),
('admin_alert', 'Admin alert', 'AV OS alert: {alert_subject}',
 '{alert_body}\n\n— AV OS · {site_name}'),
('follow_up', 'Follow-up task reminder', 'Follow-up: {lead_name}',
 'This is a follow-up reminder from AV OS.\n\nLead: {lead_name} ({lead_email})\nScore: {lead_score}\nDays without activity: {inactive_days}\n\nOpen the lead: {admin_url}\n\n— AV OS · {site_name}');

-- ------------------------------------------------------------
-- CAMPAIGNS: description + date window for campaign manager
-- ------------------------------------------------------------
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS description TEXT NULL AFTER budget;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS start_date DATE NULL AFTER description;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS end_date DATE NULL AFTER start_date;

-- ------------------------------------------------------------
-- AUTOMATIONS: track last inactivity sweep (cron / manual)
-- ------------------------------------------------------------
ALTER TABLE automations ADD COLUMN IF NOT EXISTS last_check_at DATETIME NULL AFTER last_run_at;

