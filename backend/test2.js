import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const students = await prisma.user.findMany({ select: { id: true, name: true, studentId: true, email: true, course: true, section: true } });
  const studentIds = students.map(s => s.id);
  const internalMetrics = await prisma.studentCodingMetrics.findMany({
    where: { userId: { in: studentIds } },
    include: { user: { select: { name: true, studentId: true, email: true, course: true } } }
  });
  console.log('int', internalMetrics.length);
}
main().catch(console.error).finally(()=>prisma.$disconnect());
