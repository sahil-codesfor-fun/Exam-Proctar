import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const q = await prisma.question.findUnique({
    where: { id: "084f0dd0-40e4-4294-8938-f833d55c3652" },
    select: { hubModuleId: true, title: true }
  });
  console.log(q);
  
  if (q && q.hubModuleId) {
    const mod = await prisma.hubModule.findUnique({
      where: { id: q.hubModuleId },
      select: { courseId: true, title: true }
    });
    console.log(mod);
    
    if (mod) {
      const course = await prisma.hubCourse.findUnique({
        where: { id: mod.courseId },
        select: { title: true, departmentId: true }
      });
      console.log(course);
    }
  }
}
main().finally(() => prisma.$disconnect());
