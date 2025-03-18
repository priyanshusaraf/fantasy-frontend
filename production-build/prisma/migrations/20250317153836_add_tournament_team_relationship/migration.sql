-- AlterTable
ALTER TABLE `Team` ADD COLUMN `tournamentId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Tournament` ADD COLUMN `isTeamBased` BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE `Team` ADD CONSTRAINT `Team_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `Tournament`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
