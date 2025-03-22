/*
  Warnings:

  - The values [BEGINNER,INTERMEDIATE,ADVANCED,PROFESSIONAL] on the enum `Player_skillLevel` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Player` MODIFY `skillLevel` ENUM('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C', 'D') NULL;
