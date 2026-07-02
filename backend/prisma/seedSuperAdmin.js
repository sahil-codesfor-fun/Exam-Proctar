import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedSuperAdmin() {
  const email = 'admin@nexusproctor.com';

  const existing = await prisma.user.findFirst({
    where: { email }
  });

  if (existing) {
    console.log('✅ Super Admin already exists:', existing.email, '(role:', existing.role, ')');

    // Ensure the role is correct
    if (existing.role !== 'superadmin') {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'superadmin' }
      });
      console.log('🔧 Updated role to superadmin');
    }
    await prisma.$disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Administrator',
      email,
      password: hashedPassword,
      role: 'superadmin',
      isActive: true,
      passwordResetRequired: false
    }
  });

  console.log('🎉 Super Admin created successfully!');
  console.log('   Email:', superAdmin.email);
  console.log('   Password: Admin@123');
  console.log('   Role:', superAdmin.role);

  await prisma.$disconnect();
}

seedSuperAdmin().catch((e) => {
  console.error('❌ Seed failed:', e);
  prisma.$disconnect();
  process.exit(1);
});
