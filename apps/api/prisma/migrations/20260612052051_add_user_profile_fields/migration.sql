-- AlterTable
ALTER TABLE `users` ADD COLUMN `banned_at` DATETIME(3) NULL,
    ADD COLUMN `banned_reason` VARCHAR(255) NULL,
    ADD COLUMN `bio` VARCHAR(500) NULL,
    ADD COLUMN `full_name` VARCHAR(100) NULL,
    ADD COLUMN `is_banned` BOOLEAN NOT NULL DEFAULT false;
