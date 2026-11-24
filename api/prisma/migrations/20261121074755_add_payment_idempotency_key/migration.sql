/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `idempotencyKey` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "idempotencyKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotencyKey_key" ON "payments"("idempotencyKey");
