-- CreateEnum
CREATE TYPE "OrganizationAccessMode" AS ENUM ('OPEN', 'INVITE_ONLY');

-- AlterEnum
ALTER TYPE "OrganizationRole" ADD VALUE 'VIEWER';

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "accessMode" "OrganizationAccessMode" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
