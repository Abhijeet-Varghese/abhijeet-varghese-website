-- AV OS — Contact form transactional email templates
-- Migration 012: replace generic lead emails with the customized website contact flow.

UPDATE email_templates
SET
  name = 'New intro call request (owner alert)',
  subject = 'New intro call request — {name}',
  body = 'Hi Abhijeet,\n\nYou have a new intro call request through your website.\n\nYOUR DETAILS\n\nName: {name}\nEmail: {email}\nOrganization: {company}\nMobile Number: {phone}\n\nANYTHING I SHOULD KNOW?\n\n{message}\n\nPREFERRED TIME\n\nDate: {booking_date}\nTime: {booking_time}\n\n—\nAbhijeet Varghese\nhi@abhijeetvarghese.com\n{site_url}\n',
  enabled = 1
WHERE slug = 'new_lead';

UPDATE email_templates
SET
  name = 'Intro call request confirmation (visitor)',
  subject = 'Your intro call request — Abhijeet Varghese',
  body = 'Hi {name},\n\nThank you for reaching out.\n\nI have received your intro call request and the details you shared.\n\nYOUR REQUEST\n\nOrganization: {company}\n\nWhat you would like to discuss:\n{message}\n\nPreferred date: {booking_date}\nPreferred time: {booking_time}\n\nI will review your request and get back to you at {email} to confirm the conversation.\n\nLooking forward to speaking with you.\n\nYou can also reach me directly at {owner_mobile}.\n\nBest,\nAbhijeet Varghese\nCreative Director · Experience Designer\nhi@abhijeetvarghese.com\n{site_url}\n',
  enabled = 1
WHERE slug = 'lead_confirmation';

UPDATE email_templates
SET
  name = 'Contact confirmation (visitor)',
  subject = 'Your message — Abhijeet Varghese',
  body = 'Hi {name},\n\nThank you for reaching out. I have received your message and will get back to you shortly.\n\nYou can also reach me directly at {owner_mobile}.\n\nBest,\nAbhijeet Varghese\nCreative Director · Experience Designer\nhi@abhijeetvarghese.com\n{site_url}\n',
  enabled = 1
WHERE slug = 'contact_confirmation';
