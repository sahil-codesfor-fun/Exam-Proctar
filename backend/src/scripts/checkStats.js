import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const modules = await prisma.hubModule.findMany({
    include: { articles: true, _count: { select: { questions: true } } },
    orderBy: { order: 'asc' }
  });
  let zeroQuestions = 0;
  modules.forEach(m => {
    if (m._count.questions === 0) zeroQuestions++;
  });
  console.log(`Total Modules: ${modules.length}, Modules with 0 questions: ${zeroQuestions}`);
  console.log('Sample modules:', modules.slice(0, 5).map(m => ({title: m.title, articlesCount: m.articles.length, questionsCount: m._count.questions})));
}
main().catch(console.error).finally(() => prisma.$disconnect());
