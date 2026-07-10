import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const students = await prisma.user.findMany({
    select: { id: true, name: true, studentId: true, email: true, course: true, section: true }
  });
  console.log('students', students.length);
  const studentIds = students.map(s => s.id);
  const externalIntegrations = await prisma.platformIntegration.findMany({
    where: { userId: { in: studentIds }, syncStatus: { not: 'DISCONNECTED' } },
    include: {
      user: { select: { name: true, studentId: true, email: true, course: true } },
      statistics: true
    }
  });
  console.log('ext', externalIntegrations.length);
}
main().catch(console.error).finally(()=>prisma.$disconnect());
