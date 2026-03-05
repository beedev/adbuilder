-- Rename Section table to Vehicle
ALTER TABLE "Section" RENAME TO "Vehicle";

-- Rename the sectionId column in Page to vehicleId
ALTER TABLE "Page" RENAME COLUMN "sectionId" TO "vehicleId";

-- Drop old foreign key constraint
ALTER TABLE "Page" DROP CONSTRAINT IF EXISTS "Page_sectionId_fkey";

-- Add new foreign key constraint
ALTER TABLE "Page" ADD CONSTRAINT "Page_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rename the sequence used by the old Section_id_seq if it exists (postgres handles this automatically on table rename)
-- Rename index on Vehicle if needed (Prisma uses table names for index names)
