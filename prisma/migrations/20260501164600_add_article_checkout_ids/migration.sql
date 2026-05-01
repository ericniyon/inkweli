-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN "article_id" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN "article_id" TEXT;

-- AlterTable
ALTER TABLE "urubutopay_transactions" ADD COLUMN "article_id" TEXT;
