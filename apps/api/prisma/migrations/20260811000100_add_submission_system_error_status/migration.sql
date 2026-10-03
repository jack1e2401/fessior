ALTER TABLE `submissions`
  MODIFY `status` ENUM(
    'PENDING',
    'PROCESSING',
    'ACCEPTED',
    'WA',
    'TLE',
    'MLE',
    'RE',
    'CE',
    'SYSTEM_ERROR'
  ) NOT NULL DEFAULT 'PENDING';
