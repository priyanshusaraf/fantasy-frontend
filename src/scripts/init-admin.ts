import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting admin initialization script");

  // Get admin credentials from environment variables
  const masterAdminUsername = process.env.MASTER_ADMIN_USERNAME;
  const masterAdminEmail = process.env.MASTER_ADMIN_EMAIL;
  const masterAdminPassword = process.env.MASTER_ADMIN_PASSWORD;

  if (!masterAdminUsername || !masterAdminEmail || !masterAdminPassword) {
    console.error("Missing master admin credentials in environment variables");
    process.exit(1);
  }

  console.log(`Setting up master admin with email: ${masterAdminEmail}`);

  try {
    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: masterAdminEmail },
      include: {
        masterAdmin: true,
        tournamentAdmin: true,
      },
    });

    if (existingUser) {
      console.log("Admin user already exists, updating role and password");
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(masterAdminPassword, 10);
      
      // Update the user
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          username: masterAdminUsername,
          password: hashedPassword,
          role: "MASTER_ADMIN",
        },
      });

      // Ensure user has master admin record
      if (!existingUser.masterAdmin) {
        await prisma.masterAdmin.create({
          data: {
            userId: existingUser.id,
          },
        });
        console.log("Created MasterAdmin record");
      }

      // Ensure user has tournament admin record
      if (!existingUser.tournamentAdmin) {
        await prisma.tournamentAdmin.create({
          data: {
            userId: existingUser.id,
          },
        });
        console.log("Created TournamentAdmin record");
      }
    } else {
      console.log("Admin user does not exist, creating new user");
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(masterAdminPassword, 10);
      
      // Create the user
      const newUser = await prisma.user.create({
        data: {
          username: masterAdminUsername,
          email: masterAdminEmail,
          password: hashedPassword,
          name: masterAdminUsername,
          role: "MASTER_ADMIN",
          status: "ACTIVE",
          emailVerified: new Date(),
        },
      });

      // Create master admin record
      await prisma.masterAdmin.create({
        data: {
          userId: newUser.id,
        },
      });

      // Create tournament admin record
      await prisma.tournamentAdmin.create({
        data: {
          userId: newUser.id,
        },
      });

      console.log(`Created new admin user with ID: ${newUser.id}`);
    }

    console.log("Admin initialization completed successfully");
  } catch (error) {
    console.error("Error initializing admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 