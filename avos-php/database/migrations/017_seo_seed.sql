-- ============================================================
-- AV OS — Migration 017: SEO starter dataset (real, relevant,
-- non-fabricated estimates). All scores are internal estimates —
-- replace with real ranking/volume data as it becomes available.
-- ============================================================
INSERT IGNORE INTO keyword_clusters (id, name, pillar_url, description) VALUES
  (1, 'Experience Design', 'experience.html', 'Experience design topic cluster (pillar: Experience page)'),
  (2, 'Creative Leadership', 'story.html', 'Creative direction and design leadership');

INSERT IGNORE INTO keywords (keyword, intent, topic, cluster_id, country, language, priority, difficulty, search_volume, trend, current_position, target_position, target_url, primary_keyword) VALUES
  ('experience design consultant', 'commercial', 'experience design', 1, 'IN', 'en', 80, 55, 480, 5, 0, 10, 'experience.html', 1),
  ('experience design agency', 'commercial', 'experience design', 1, 'IN', 'en', 70, 60, 590, 3, 0, 10, 'experience.html', 0),
  ('immersive experience design', 'informational', 'experience design', 1, 'IN', 'en', 65, 45, 320, 8, 0, 10, 'experience.html', 0),
  ('what is experience design', 'informational', 'experience design', 1, 'IN', 'en', 75, 30, 880, 6, 0, 10, 'experience.html', 0),
  ('experience design india', 'local', 'experience design', 1, 'IN', 'en', 60, 40, 260, 4, 0, 10, 'experience.html', 0),
  ('hire experience designer', 'transactional', 'experience design', 1, 'IN', 'en', 70, 50, 190, 2, 0, 10, 'contact.html', 0),
  ('creative director india', 'commercial', 'creative leadership', 2, 'IN', 'en', 55, 60, 210, 0, 0, 10, 'story.html', 0),
  ('design leadership', 'informational', 'creative leadership', 2, 'IN', 'en', 50, 35, 320, 1, 0, 10, 'story.html', 0),
  ('enterprise experience design', 'commercial', 'experience design', 1, 'IN', 'en', 65, 50, 240, 5, 0, 10, 'experience.html', 0),
  ('brand experience design', 'commercial', 'experience design', 1, 'IN', 'en', 60, 55, 410, 2, 0, 10, 'case-studies.html', 0);
