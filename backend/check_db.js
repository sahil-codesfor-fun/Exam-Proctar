import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const exams = await prisma.exam.findMany({ select: { id: true, title: true, creatorId: true, departmentId: true, status: true } });
  console.log(exams);
  const users = await prisma.user.findMany({ where: { OR: [{ role: 'teacher' }, { role: 'faculty' }] }, select: { id: true, email: true, role: true } });
  console.log(users);
}
main().finally(() => prisma.$disconnect());
