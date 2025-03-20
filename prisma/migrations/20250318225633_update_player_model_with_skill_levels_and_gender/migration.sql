/*
  Warnings:

  - You are about to drop the column `currentEntries` on the `FantasyContest` table. All the data in the column will be lost.
  - You are about to drop the column `rules` on the `FantasyContest` table. All the data in the column will be lost.
  - You are about to alter the column `entryFee` on the `FantasyContest` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Double`.
  - You are about to alter the column `prizePool` on the `FantasyContest` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Double`.
  - You are about to alter the column `status` on the `FantasyContest` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(8))` to `Enum(EnumId(6))`.
  - You are about to drop the column `dominantHand` on the `Player` table. All the data in the column will be lost.
  - The values [BEGINNER,INTERMEDIATE,ADVANCED,PROFESSIONAL] on the enum `Player_skillLevel` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `FantasyContest` DROP COLUMN `currentEntries`,
    DROP COLUMN `rules`,
    ADD COLUMN `adminFee` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `entryDeadline` DATETIME(3) NULL,
    ADD COLUMN `feePercentage` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `isPrizesDistributed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isPrizesProcessing` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `platformFee` DOUBLE NOT NULL DEFAULT 0,
    MODIFY `entryFee` DOUBLE NOT NULL DEFAULT 0,
    MODIFY `prizePool` DOUBLE NOT NULL DEFAULT 0,
    MODIFY `maxEntries` INTEGER NOT NULL DEFAULT 100,
    MODIFY `status` ENUM('DRAFT', 'OPEN', 'CLOSED', 'ONGOING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
    MODIFY `description` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Player` DROP COLUMN `dominantHand`,
    ADD COLUMN `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL,
    MODIFY `skillLevel` ENUM('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C', 'D') NULL;

-- AlterTable
ALTER TABLE `Tournament` ADD COLUMN `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isPrizesDistributed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `prizesDistributedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `PrizeDisbursement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `contestId` INTEGER NOT NULL,
    `fantasyTeamId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `tournamentId` INTEGER NULL,
    `amount` DOUBLE NOT NULL,
    `netAmount` DOUBLE NOT NULL,
    `rank` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REVERSED') NOT NULL DEFAULT 'PENDING',
    `transactionId` VARCHAR(191) NULL,
    `accountId` VARCHAR(191) NULL,
    `paymentDetails` JSON NULL,
    `processingFee` DOUBLE NOT NULL DEFAULT 0,
    `notes` VARCHAR(191) NULL,

    INDEX `PrizeDisbursement_tournamentId_idx`(`tournamentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BankAccount` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `accountHolderName` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `ifsc` VARCHAR(191) NOT NULL,
    `accountType` VARCHAR(191) NOT NULL DEFAULT 'savings',
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `razorpayFundAccountId` VARCHAR(191) NULL,
    `razorpayContactId` VARCHAR(191) NULL,

    UNIQUE INDEX `BankAccount_userId_key`(`userId`),
    INDEX `BankAccount_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `description` VARCHAR(191) NULL,
    `razorpayOrderId` VARCHAR(191) NULL,
    `razorpayPaymentId` VARCHAR(191) NULL,
    `razorpaySignature` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `fantasyContestId` INTEGER NULL,

    UNIQUE INDEX `Payment_razorpayOrderId_key`(`razorpayOrderId`),
    UNIQUE INDEX `Payment_razorpayPaymentId_key`(`razorpayPaymentId`),
    INDEX `Payment_userId_idx`(`userId`),
    INDEX `Payment_status_idx`(`status`),
    INDEX `Payment_razorpayOrderId_idx`(`razorpayOrderId`),
    INDEX `Payment_razorpayPaymentId_idx`(`razorpayPaymentId`),
    INDEX `Payment_fantasyContestId_idx`(`fantasyContestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FantasyPayment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paymentId` INTEGER NOT NULL,
    `fantasyTeamId` INTEGER NULL,
    `tournamentId` INTEGER NOT NULL,
    `entryFee` DECIMAL(10, 2) NOT NULL,
    `isProcessed` BOOLEAN NOT NULL DEFAULT false,
    `adminSharePaid` BOOLEAN NOT NULL DEFAULT false,
    `prizePoolAdded` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FantasyPayment_paymentId_key`(`paymentId`),
    INDEX `FantasyPayment_fantasyTeamId_idx`(`fantasyTeamId`),
    INDEX `FantasyPayment_tournamentId_idx`(`tournamentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentSplit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paymentId` INTEGER NOT NULL,
    `tournamentAdminId` INTEGER NOT NULL,
    `masterAdminId` INTEGER NOT NULL,
    `tournamentAdminShare` DECIMAL(10, 2) NOT NULL,
    `masterAdminShare` DECIMAL(10, 2) NOT NULL,
    `prizePoolShare` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PaymentSplit_paymentId_idx`(`paymentId`),
    INDEX `PaymentSplit_tournamentAdminId_idx`(`tournamentAdminId`),
    INDEX `PaymentSplit_masterAdminId_idx`(`masterAdminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PrizeDistributionRule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `tournamentId` INTEGER NULL,
    `contestPrizeRuleId` INTEGER NULL,
    `rank` INTEGER NOT NULL,
    `percentage` DOUBLE NOT NULL,
    `minPlayers` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContestPrizeRule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `tournamentId` INTEGER NOT NULL,
    `contestId` INTEGER NOT NULL,

    UNIQUE INDEX `ContestPrizeRule_contestId_key`(`contestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TournamentOrganizer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `tournamentId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'ORGANIZER',

    UNIQUE INDEX `TournamentOrganizer_tournamentId_userId_key`(`tournamentId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PrizeDisbursement` ADD CONSTRAINT `PrizeDisbursement_contestId_fkey` FOREIGN KEY (`contestId`) REFERENCES `FantasyContest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PrizeDisbursement` ADD CONSTRAINT `PrizeDisbursement_fantasyTeamId_fkey` FOREIGN KEY (`fantasyTeamId`) REFERENCES `FantasyTeam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PrizeDisbursement` ADD CONSTRAINT `PrizeDisbursement_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PrizeDisbursement` ADD CONSTRAINT `PrizeDisbursement_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `Tournament`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BankAccount` ADD CONSTRAINT `BankAccount_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_fantasyContestId_fkey` FOREIGN KEY (`fantasyContestId`) REFERENCES `FantasyContest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FantasyPayment` ADD CONSTRAINT `FantasyPayment_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FantasyPayment` ADD CONSTRAINT `FantasyPayment_fantasyTeamId_fkey` FOREIGN KEY (`fantasyTeamId`) REFERENCES `FantasyTeam`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FantasyPayment` ADD CONSTRAINT `FantasyPayment_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `Tournament`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentSplit` ADD CONSTRAINT `PaymentSplit_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentSplit` ADD CONSTRAINT `PaymentSplit_tournamentAdminId_fkey` FOREIGN KEY (`tournamentAdminId`) REFERENCES `TournamentAdmin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentSplit` ADD CONSTRAINT `PaymentSplit_masterAdminId_fkey` FOREIGN KEY (`masterAdminId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PrizeDistributionRule` ADD CONSTRAINT `PrizeDistributionRule_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `Tournament`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PrizeDistributionRule` ADD CONSTRAINT `PrizeDistributionRule_contestPrizeRuleId_fkey` FOREIGN KEY (`contestPrizeRuleId`) REFERENCES `ContestPrizeRule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContestPrizeRule` ADD CONSTRAINT `ContestPrizeRule_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `Tournament`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContestPrizeRule` ADD CONSTRAINT `ContestPrizeRule_contestId_fkey` FOREIGN KEY (`contestId`) REFERENCES `FantasyContest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TournamentOrganizer` ADD CONSTRAINT `TournamentOrganizer_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `Tournament`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TournamentOrganizer` ADD CONSTRAINT `TournamentOrganizer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
