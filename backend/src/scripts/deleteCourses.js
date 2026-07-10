import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.hubCourse.deleteMany({});
  console.log('Deleted all courses.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
