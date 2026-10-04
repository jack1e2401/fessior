-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `bio` VARCHAR(500) NULL,
    `full_name` VARCHAR(100) NULL,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `elo_rating` INTEGER NOT NULL DEFAULT 1200,
    `streak_count` INTEGER NOT NULL DEFAULT 0,
    `max_streak` INTEGER NOT NULL DEFAULT 0,
    `last_active_date` DATE NULL,
    `code_coins` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `is_banned` BOOLEAN NOT NULL DEFAULT false,
    `banned_at` DATETIME(3) NULL,
    `banned_reason` VARCHAR(255) NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `elo_histories` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `old_elo` INTEGER NOT NULL,
    `new_elo` INTEGER NOT NULL,
    `change` INTEGER NOT NULL,
    `reason` VARCHAR(50) NOT NULL,
    `match_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `elo_histories_user_id_idx`(`user_id`),
    INDEX `elo_histories_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_activities` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `activity_date` DATE NOT NULL,
    `submissions_count` INTEGER NOT NULL DEFAULT 0,
    `problems_solved_count` INTEGER NOT NULL DEFAULT 0,

    INDEX `user_activities_user_id_idx`(`user_id`),
    INDEX `user_activities_activity_date_idx`(`activity_date`),
    UNIQUE INDEX `user_activities_user_id_activity_date_key`(`user_id`, `activity_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(36) NOT NULL,
    `token` VARCHAR(500) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `user_agent` VARCHAR(500) NULL,
    `ip_address` VARCHAR(45) NULL,
    `last_used_at` DATETIME(3) NULL,
    `is_revoked` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matches` (
    `id` VARCHAR(36) NOT NULL,
    `problem_id` VARCHAR(36) NOT NULL,
    `winner_id` VARCHAR(36) NULL,
    `status` ENUM('PENDING', 'RUNNING', 'FINISHED', 'DRAW') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `match_participants` (
    `id` VARCHAR(36) NOT NULL,
    `match_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `status` ENUM('CODING', 'SUBMITTED_WA', 'ACCEPTED') NOT NULL DEFAULT 'CODING',
    `score_change` INTEGER NOT NULL DEFAULT 0,
    `is_winner` BOOLEAN NOT NULL DEFAULT false,
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `match_participants_match_id_user_id_key`(`match_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `problems` (
    `id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `difficulty` ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL,
    `time_limit` INTEGER NOT NULL DEFAULT 2000,
    `memory_limit` INTEGER NOT NULL DEFAULT 256,
    `starter_code_cpp` TEXT NOT NULL,
    `starter_code_java` TEXT NOT NULL,
    `starter_code_python` TEXT NOT NULL,
    `editorial_markdown` TEXT NULL,
    `editorial_video_url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `active_testcase_set_id` VARCHAR(36) NULL,

    UNIQUE INDEX `problems_slug_key`(`slug`),
    UNIQUE INDEX `problems_active_testcase_set_id_key`(`active_testcase_set_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `testcases` (
    `id` VARCHAR(36) NOT NULL,
    `testcase_set_id` VARCHAR(36) NOT NULL,
    `position` INTEGER NOT NULL,
    `is_example` BOOLEAN NOT NULL DEFAULT false,
    `input` TEXT NOT NULL,
    `output` TEXT NOT NULL,

    UNIQUE INDEX `testcases_testcase_set_id_position_key`(`testcase_set_id`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `testcase_sets` (
    `id` VARCHAR(36) NOT NULL,
    `problem_id` VARCHAR(36) NOT NULL,
    `version` INTEGER NOT NULL,
    `checksum` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `testcase_sets_problem_id_version_key`(`problem_id`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `submissions` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `problem_id` VARCHAR(36) NOT NULL,
    `testcase_set_id` VARCHAR(36) NOT NULL,
    `code` LONGTEXT NOT NULL,
    `language` ENUM('cpp', 'java', 'python') NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'ACCEPTED', 'WA', 'TLE', 'MLE', 'RE', 'CE', 'SYSTEM_ERROR') NOT NULL DEFAULT 'PENDING',
    `execution_time` DOUBLE NULL,
    `memory_used` INTEGER NULL,
    `error_message` TEXT NULL,
    `test_cases_passed` INTEGER NOT NULL DEFAULT 0,
    `test_cases_total` INTEGER NOT NULL DEFAULT 0,
    `match_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `submissions_user_id_idx`(`user_id`),
    INDEX `submissions_problem_id_idx`(`problem_id`),
    INDEX `submissions_testcase_set_id_idx`(`testcase_set_id`),
    INDEX `submissions_status_idx`(`status`),
    INDEX `submissions_match_id_idx`(`match_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `elo_histories` ADD CONSTRAINT `elo_histories_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_activities` ADD CONSTRAINT `user_activities_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_participants` ADD CONSTRAINT `match_participants_match_id_fkey` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_participants` ADD CONSTRAINT `match_participants_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `problems` ADD CONSTRAINT `problems_active_testcase_set_id_fkey` FOREIGN KEY (`active_testcase_set_id`) REFERENCES `testcase_sets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testcases` ADD CONSTRAINT `testcases_testcase_set_id_fkey` FOREIGN KEY (`testcase_set_id`) REFERENCES `testcase_sets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testcase_sets` ADD CONSTRAINT `testcase_sets_problem_id_fkey` FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_problem_id_fkey` FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_testcase_set_id_fkey` FOREIGN KEY (`testcase_set_id`) REFERENCES `testcase_sets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
