/*
  Warnings:

  - You are about to drop the column `hour` on the `SmsSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `minute` on the `SmsSchedule` table. All the data in the column will be lost.
  - Added the required column `message` to the `SmsSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduleTime` to the `SmsSchedule` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SmsSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "message" TEXT NOT NULL,
    "scheduleTime" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
-- Eski verileri yeni tabloya taşırken, eksik alanlar için varsayılan değerler atıyoruz
-- hour ve minute'dan yararlanarak uygun bir DATETIME oluşturuyoruz
INSERT INTO "new_SmsSchedule" ("id", "isActive", "createdAt", "updatedAt", "message", "scheduleTime") 
SELECT 
    "id", 
    "isActive", 
    "createdAt", 
    "updatedAt", 
    'Otomatik oluşturulan SMS mesajı', -- Varsayılan mesaj
    DATETIME('now', '+1 day', printf('%02d:%02d:00', "hour", "minute")) -- Saati dönüştürüyoruz
FROM "SmsSchedule";
DROP TABLE "SmsSchedule";
ALTER TABLE "new_SmsSchedule" RENAME TO "SmsSchedule";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
