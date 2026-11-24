/*
  Warnings:

  - You are about to drop the column `currency` on the `mentor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `hourlyRate` on the `mentor_profiles` table. All the data in the column will be lost.
  - Added the required column `sessionFee` to the `availabilities` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "availabilities" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "sessionFee" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "mentor_profiles" DROP COLUMN "currency",
DROP COLUMN "hourlyRate";
