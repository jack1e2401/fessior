-- Prior 1v1 matches were created as PENDING even though both participants could submit.
-- Preserve those unfinished matches and align them with the RUNNING lifecycle.
UPDATE matches AS m
SET m.status = 'RUNNING'
WHERE m.status = 'PENDING'
  AND m.winner_id IS NULL
  AND (SELECT COUNT(*) FROM match_participants AS p WHERE p.match_id = m.id) = 2;
