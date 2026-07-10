import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const questions = await prisma.question.findMany({take: 2});
  console.log(JSON.stringify(questions, null, 2));
}
main().finally(() => prisma.$disconnect());
