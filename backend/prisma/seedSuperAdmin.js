import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function seedSuperAdmin() {
  try {
    // 1. Check if any Super Admin already exists in the database
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'superadmin' }
    });

    if (existingSuperAdmin) {
      console.log(`✅ Super Admin already present in database: ${existingSuperAdmin.email}`);
      return;
    }

    // 2. If no superadmin exists, feed from secure environment variables
    const email = process.env.SUPERADMIN_EMAIL;
    const plainPassword = process.env.SUPERADMIN_PASSWORD;

    if (!email || !plainPassword) {
      console.log('ℹ️ No Super Admin found in database and SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD not specified in .env. Skipping initial seed.');
      return;
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const superAdmin = await prisma.user.create({
      data: {
        name: process.env.SUPERADMIN_NAME || 'Super Administrator',
        email,
        password: hashedPassword,
        role: 'superadmin',
        isActive: true,
        passwordResetRequired: false
      }
    });

    console.log(`🎉 Super Admin record initialized in database for: ${superAdmin.email}`);

  } catch (error) {
    console.error('❌ Super Admin database initialization check failed:', error.message);
  }
}

// If run directly from CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSuperAdmin().then(() => prisma.$disconnect());
}

