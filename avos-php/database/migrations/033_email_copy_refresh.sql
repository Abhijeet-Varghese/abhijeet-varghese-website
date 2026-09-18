-- ============================================================
-- AV OS — Migration 033: email copy refresh (canonical contact emails)
-- Owner notification and visitor confirmation updated to the final
-- polished copy. Both the backend (this table) and the EmailJS
-- emergency fallback must render this same content.
-- Idempotent: UPDATE only — safe to re-run.
-- ============================================================

UPDATE email_templates SET
  name = 'New intro call request (owner alert)',
  subject = 'New intro call request — {name}',
  body = 'Hi Abhijeet,

You have received a new intro call request through your website.

NAME
{name}

EMAIL
{email}

ORGANIZATION
{company}

MOBILE NUMBER
{phone}

MESSAGE
{message}

PREFERRED DATE
{booking_date}

PREFERRED TIME
{booking_time}

Abhijeet Varghese
hi@abhijeetvarghese.com
{site_url}
',
  enabled = 1
WHERE slug = 'new_lead';

UPDATE email_templates SET
  name = 'Intro call request confirmation (visitor)',
  subject = 'Your intro call request — Abhijeet Varghese',
  body = 'Hi {name},

Thank you for reaching out to Abhijeet Varghese.

Your intro call request has been received successfully.

ORGANIZATION
{company}

DISCUSSION / MESSAGE
{message}

PREFERRED DATE
{booking_date}

PREFERRED TIME
{booking_time}

Your request has been received and the details have been recorded successfully.

Abhijeet will review the request and confirm the conversation/call accordingly.

If you need to get in touch directly, you can contact Abhijeet at:

+91 969 408 0706

Best,
Abhijeet Varghese

hi@abhijeetvarghese.com

{site_url}
',
  enabled = 1
WHERE slug = 'lead_confirmation';
