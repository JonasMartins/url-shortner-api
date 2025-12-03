/*
  Warnings:

  - You are about to alter the column `access_count` on the `urls` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "urls" ALTER COLUMN "access_count" SET DATA TYPE INTEGER;
