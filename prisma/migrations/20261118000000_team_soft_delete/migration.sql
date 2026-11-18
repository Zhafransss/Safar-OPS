-- DropIndex
DROP INDEX "Team_color_key";

-- DropIndex
DROP INDEX "Team_leaderId_key";

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Team_color_key" ON "Team"("color") WHERE ("deletedAt" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "Team_leaderId_key" ON "Team"("leaderId") WHERE ("deletedAt" IS NULL);

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

