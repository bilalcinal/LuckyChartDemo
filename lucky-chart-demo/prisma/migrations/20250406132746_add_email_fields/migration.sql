/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `OTP` ADD COLUMN `email` VARCHAR(191) NULL,
    MODIFY `phone` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `email` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `OTP_email_idx` ON `OTP`(`email`);

-- CreateIndex
CREATE UNIQUE INDEX `User_email_key` ON `User`(`email`);
