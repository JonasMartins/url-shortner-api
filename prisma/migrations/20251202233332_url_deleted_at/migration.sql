/*
  Warnings:

  - You are about to drop the column `enabled` on the `urls` table. All the data in the column will be lost.
  - Added the required column `deleted_at` to the `urls` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "urls" DROP COLUMN "enabled",
ADD COLUMN     "deleted_at" TIMESTAMP(3) NOT NULL;
