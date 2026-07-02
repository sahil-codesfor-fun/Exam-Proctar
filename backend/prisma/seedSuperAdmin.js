import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedSuperAdmin() {
  try {
    const email = 'admin@nexusproctor.com';
    const plainPassword = 'Admin@123';
    
    const existing = await prisma.user.findFirst({
      where: { email }
    });

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    if (existing) {
      console.log('✅ Super Admin already exists:', existing.email, '(role:', existing.role, ')');

      // Enforce the correct role and reset password just in case it was changed/corrupted
      await prisma.user.update({
        where: { id: existing.id },
        data: { 
          role: 'superadmin',
          password: hashedPassword,
          isActive: true
        }
      });
      console.log('🔧 Enforced role to superadmin and reset password to default.');
      return;
    }

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

  } catch (error) {
    console.error('❌ Super Admin seed failed:', error);
  }
}

// If run directly from CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSuperAdmin().then(() => prisma.$disconnect());
}
