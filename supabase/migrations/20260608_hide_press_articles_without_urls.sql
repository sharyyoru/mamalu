-- Hide press article items that do not have an external URL.
-- Video items can remain visible without an article URL because they render from videoUrl.
UPDATE site_content
SET content = jsonb_set(
  content,
  '{articles}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN COALESCE(article->>'mediaType', CASE WHEN (article->>'isVideo')::boolean THEN 'video' ELSE 'article' END) <> 'video'
          AND NULLIF(article->>'url', '') IS NULL
        THEN jsonb_set(article || '{"mediaType":"article"}'::jsonb, '{isActive}', 'false'::jsonb)
        ELSE article
      END
      ORDER BY ordinality
    )
    FROM jsonb_array_elements(content->'articles') WITH ORDINALITY AS items(article, ordinality)
  ),
  true
),
updated_at = NOW()
WHERE id = 'press'
  AND jsonb_typeof(content->'articles') = 'array';
