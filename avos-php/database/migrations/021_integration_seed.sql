-- ============================================================
-- AV OS — Migration 021: INTEGRATION HUB SEED
-- Real registry rows · quality research sources · social profiles
-- ============================================================

-- ---------- integration registry ----------
INSERT INTO integrations (code, label, name, provider, category, status, enabled, authentication_type, capabilities, free_tier, rate_limit, sync_interval_minutes, configuration) VALUES
  ('gsc', 'gsc',        'Google Search Console',    'google',     'search',       'not_connected', 1, 'oauth2',   JSON_OBJECT('read','queries,impressions,clicks,ctr,position,countries,devices'),      'free',     JSON_OBJECT('limit','16k rows/day per property'), 1440,  NULL),
  ('ga4', 'ga4',        'Google Analytics 4',       'google',     'analytics',    'not_connected', 1, 'oauth2',   JSON_OBJECT('read','users,sessions,pageviews,events,sources,countries,devices'), 'free',     JSON_OBJECT('limit','runReport quota'),                1440,  NULL),
  ('gtm', 'gtm',        'Google Tag Manager',       'google',     'tracking',     'manual',        1, 'manual',   JSON_OBJECT('embed','container snippet'),                                     'free',     NULL,                                                  0,     NULL),
  ('bing', 'bing',       'Bing Webmaster',           'microsoft',  'search',       'not_connected', 1, 'api_key',  JSON_OBJECT('read','queries,clicks,impressions,position,crawl'),               'free',     JSON_OBJECT('limit','standard API limits'),              1440,  NULL),
  ('clarity', 'clarity',    'Microsoft Clarity',        'microsoft',  'analytics',    'not_connected', 1, 'oauth2',   JSON_OBJECT('read','rage clicks,dead clicks,scroll depth,recordings (metrics)'), 'free',     JSON_OBJECT('limit','API preview'),                     1440,  NULL),
  ('cloudflare', 'cloudflare', 'Cloudflare',               'cloudflare', 'monitoring',   'not_connected', 1, 'api_token',JSON_OBJECT('read','dns,ssl,cache,traffic,security events,performance'),      'free',     JSON_OBJECT('limit','standard'),                        180,   NULL),
  ('calendly', 'calendly',   'Calendly',                 'calendly',   'business',     'not_connected', 1, 'api_key',  JSON_OBJECT('read','event_types,scheduled_events','webhook','invitee.created,canceled,rescheduled'), 'free', JSON_OBJECT('limit','standard'),                      60,    NULL),
  ('github', 'github',     'GitHub',                   'github',     'development',  'limited',       1, 'api_token',JSON_OBJECT('read','repos,commits,issues,releases,workflows','write','none'),  'free',     JSON_OBJECT('limit','60 req/h unauthenticated, 5000 authed'), 180,  NULL),
  ('drive', 'drive',      'Google Drive',             'google',     'storage',      'not_connected', 1, 'oauth2',   JSON_OBJECT('read','approved folders/files (metadata, export text)'),          'free',     JSON_OBJECT('limit','quota per project'),               10080, NULL),
  ('notion', 'notion',     'Notion',                   'notion',     'knowledge',    'not_connected', 1, 'api_token',JSON_OBJECT('read','pages,blocks'),                                             'free',     JSON_OBJECT('limit','3 req/s'),                        10080, NULL),
  ('youtube', 'youtube',    'YouTube',                  'google',     'social',       'limited',       1, 'rss',      JSON_OBJECT('read','channel videos, titles, dates (RSS)'),                      'free',     JSON_OBJECT('limit','none for RSS'),                    1440,  NULL),
  ('linkedin', 'linkedin',   'LinkedIn',                 'linkedin',   'social',       'manual',        1, 'manual',   JSON_OBJECT('read','profile reference (manual registration)'),                 'limited',  NULL,                                                  0,     NULL),
  ('instagram', 'instagram',  'Instagram',                'meta',       'social',       'manual',        1, 'manual',   JSON_OBJECT('read','profile reference (manual registration)'),                 'limited',  NULL,                                                  0,     NULL),
  ('behance', 'behance',    'Behance',                  'behance',    'social',       'manual',        1, 'manual',   JSON_OBJECT('read','portfolio reference (manual registration)'),               'limited',  NULL,                                                  0,     NULL),
  ('dribbble', 'dribbble',   'Dribbble',                 'dribbble',   'social',       'manual',        1, 'manual',   JSON_OBJECT('read','portfolio reference (manual registration)'),               'limited',  NULL,                                                  0,     NULL),
  ('canva', 'canva',      'Canva',                    'canva',      'creative',     'not_connected', 1, 'oauth2',   JSON_OBJECT('read','templates, designs (approval required)'),                 'limited',  JSON_OBJECT('limit','Connect API requires app approval'), 0,     NULL),
  ('whatsapp', 'whatsapp',   'WhatsApp Business',        'meta',       'business',     'not_connected', 1, 'api_token',JSON_OBJECT('read','click-to-chat','write','cloud API messages (if configured)'), 'free', JSON_OBJECT('limit','free-form service conversations'),  60,    NULL),
  ('email', 'email',      'Email (SMTP)',             'hostinger',  'communication','not_connected', 1, 'smtp',     JSON_OBJECT('write','send transactional email'),                               'free',     NULL,                                                  0,     NULL),
  ('trends', 'trends',     'Google Trends',            'google',     'research',     'connected',     1, 'rss',      JSON_OBJECT('read','trending searches (RSS, no key)'),                          'free',     JSON_OBJECT('limit','none'),                            60,    NULL),
  ('rss', 'rss',        'RSS Research Engine',      'open',       'research',     'connected',     1, 'none',     JSON_OBJECT('read','any RSS/Atom feed'),                                        'free',     JSON_OBJECT('limit','none'),                            60,    NULL)
ON DUPLICATE KEY UPDATE
  name=VALUES(name), provider=VALUES(provider), category=VALUES(category),
  authentication_type=VALUES(authentication_type), capabilities=VALUES(capabilities),
  free_tier=VALUES(free_tier), rate_limit=VALUES(rate_limit),
  sync_interval_minutes=VALUES(sync_interval_minutes);

-- virtual AI provider cards (real state lives in ai_providers)
INSERT INTO integrations (code, label, name, provider, category, status, enabled, authentication_type, capabilities, free_tier, sync_interval_minutes) VALUES
  ('openai', 'openai',  'OpenAI',      'openai',   'ai', 'not_connected', 1, 'api_key', JSON_OBJECT('write','chat, embeddings'), 'paid',  0),
  ('claude', 'claude',  'Anthropic Claude', 'anthropic', 'ai', 'not_connected', 1, 'api_key', JSON_OBJECT('write','chat'), 'paid', 0),
  ('gemini', 'gemini',  'Google Gemini','google',  'ai', 'not_connected', 1, 'api_key', JSON_OBJECT('write','chat'), 'free', 0)
ON DUPLICATE KEY UPDATE name=VALUES(name), provider=VALUES(provider), category=VALUES(category),
  authentication_type=VALUES(authentication_type), capabilities=VALUES(capabilities),
  free_tier=VALUES(free_tier), sync_interval_minutes=VALUES(sync_interval_minutes);

-- ---------- research sources (curated, real, high-quality feeds) ----------
INSERT INTO research_sources (name, rss_url, topic, priority, authority, relevance, freshness, trust) VALUES
  ('Google Trends — India', 'https://trends.google.com/trending/rss?geo=IN', 'trends', 'high', 95, 80, 100, 95),
  ('Google Trends — Global', 'https://trends.google.com/trending/rss?geo=US', 'trends', 'medium', 95, 75, 100, 95),
  ('UX Collective', 'https://uxdesign.cc/feed', 'experience design', 'high', 85, 90, 80, 80),
  ('Nielsen Norman Group', 'https://www.nngroup.com/feed/rss/', 'ux research', 'high', 95, 90, 70, 95),
  ('Smashing Magazine', 'https://www.smashingmagazine.com/feed/', 'web design', 'high', 90, 85, 85, 90),
  ('A List Apart', 'https://alistapart.com/main/feed/', 'web design', 'medium', 90, 85, 60, 90),
  ('MIT Technology Review', 'https://www.technologyreview.com/feed/', 'technology', 'medium', 95, 70, 90, 95),
  ('The Verge', 'https://www.theverge.com/rss/index.xml', 'technology', 'medium', 85, 60, 95, 85),
  ('Wired', 'https://www.wired.com/feed/rss', 'technology', 'medium', 85, 60, 90, 85),
  ('AI News — Google Blog', 'https://blog.google/technology/ai/rss/', 'artificial intelligence', 'high', 90, 85, 90, 90),
  ('MIT News — AI', 'https://news.mit.edu/rss/topic/artificial-intelligence2', 'artificial intelligence', 'high', 95, 80, 85, 95),
  ('Fast Company — Design', 'https://www.fastcompany.com/design/rss', 'design business', 'medium', 80, 75, 80, 80),
  ('XR — UploadVR', 'https://www.uploadvr.com/feed/', 'extended reality', 'medium', 75, 80, 85, 75),
  ('Creative Bloq', 'https://www.creativebloq.com/rss.xml', 'creative technology', 'medium', 75, 70, 85, 75),
  ('Harvard Business Review', 'https://hbr.org/feed', 'business strategy', 'medium', 95, 60, 80, 95)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ---------- social profile registry (user's real accounts) ----------
INSERT INTO social_profiles (platform, profile_url, display_name, handle, api_availability, connected, capabilities, notes) VALUES
  ('github',    'https://github.com/Abhijeet-Varghese',        'Abhijeet Varghese', 'Abhijeet-Varghese', 'available', 0, JSON_OBJECT('read','public repos, commits, issues, releases, workflows'), 'public API readable without token'),
  ('youtube',   'https://www.youtube.com/@AbhijeetVarghese',   'Abhijeet Varghese', '@AbhijeetVarghese', 'available', 0, JSON_OBJECT('read','videos via channel RSS'), ''),
  ('linkedin',  'https://www.linkedin.com/in/abhijeetvarghese/','Abhijeet Varghese','abhijeetvarghese', 'manual', 0, JSON_OBJECT('post','manual only'), 'posting requires approved LinkedIn app'),
  ('instagram', 'https://www.instagram.com/abhijeetvarghese/', 'Abhijeet Varghese', 'abhijeetvarghese', 'manual', 0, JSON_OBJECT('post','manual only'), 'Graph API requires Business/Creator account + app'),
  ('behance',   'https://www.behance.net/abhijeetvarghese',    'Abhijeet Varghese', 'abhijeetvarghese', 'manual', 0, JSON_OBJECT('post','manual only'), ''),
  ('dribbble',  'https://dribbble.com/Abhijeet_V',             'Abhijeet Varghese', 'Abhijeet_V',        'manual', 0, JSON_OBJECT('post','manual only'), ''),
  ('calendly',  'https://calendly.com/abhijeetvarghese',       'Abhijeet Varghese', 'abhijeetvarghese', 'available', 1, JSON_OBJECT('booking','public booking URL'), 'webhook inbound already supported')
ON DUPLICATE KEY UPDATE profile_url=VALUES(profile_url), display_name=VALUES(display_name), handle=VALUES(handle),
  api_availability=VALUES(api_availability), capabilities=VALUES(capabilities), notes=VALUES(notes);
