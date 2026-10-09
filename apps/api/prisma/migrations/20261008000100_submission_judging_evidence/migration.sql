CREATE TABLE `submission_status_events` (
  `id` VARCHAR(36) NOT NULL,
  `submission_id` VARCHAR(36) NOT NULL,
  `sequence` INTEGER NOT NULL,
  `status` ENUM('PENDING', 'PROCESSING', 'ACCEPTED', 'WA', 'TLE', 'MLE', 'RE', 'CE', 'SYSTEM_ERROR') NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `submission_status_events_submission_id_sequence_key` (`submission_id`, `sequence`),
  INDEX `submission_status_events_submission_id_created_at_idx` (`submission_id`, `created_at`),
  PRIMARY KEY (`id`),
  CONSTRAINT `submission_status_events_submission_id_fkey` FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `submission_case_results` (
  `id` VARCHAR(36) NOT NULL,
  `submission_id` VARCHAR(36) NOT NULL,
  `position` INTEGER NOT NULL,
  `status` ENUM('PENDING', 'PROCESSING', 'ACCEPTED', 'WA', 'TLE', 'MLE', 'RE', 'CE', 'SYSTEM_ERROR') NOT NULL,
  `execution_time` DOUBLE NULL,
  `memory_used` INTEGER NULL,
  UNIQUE INDEX `submission_case_results_submission_id_position_key` (`submission_id`, `position`),
  PRIMARY KEY (`id`),
  CONSTRAINT `submission_case_results_submission_id_fkey` FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
