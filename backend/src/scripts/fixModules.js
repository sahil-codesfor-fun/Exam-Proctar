import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixModules() {
  console.log("🚀 Starting module fix...");

  const courses = await prisma.hubCourse.findMany({
    include: {
      modules: {
        orderBy: { createdAt: 'asc' },
        include: { questions: true }
      }
    }
  });

  for (const course of courses) {
    console.log(`Processing course: ${course.title}`);
    const modules = course.modules;
    if (modules.length === 0) continue;

    // 1. Rename modules to "Module X"
    for (let i = 0; i < modules.length; i++) {
      const newTitle = `Module ${i + 1}`;
      await prisma.hubModule.update({
        where: { id: modules[i].id },
        data: { title: newTitle }
      });
      modules[i].title = newTitle; // Update local reference
    }

    // 2. Gather all questions for this course
    let allQuestions = [];
    for (const m of modules) {
      allQuestions = allQuestions.concat(m.questions);
    }

    console.log(`Found ${allQuestions.length} questions for ${modules.length} modules.`);
    if (allQuestions.length === 0) continue;

    // 3. Evenly distribute questions across all modules
    const questionsPerModule = Math.ceil(allQuestions.length / modules.length);
    let questionIndex = 0;

    for (const m of modules) {
      const questionsForThisModule = allQuestions.slice(questionIndex, questionIndex + questionsPerModule);
      questionIndex += questionsPerModule;

      for (const q of questionsForThisModule) {
        if (q.hubModuleId !== m.id) {
          await prisma.question.update({
            where: { id: q.id },
            data: { hubModuleId: m.id }
          });
        }
      }
    }
  }

  console.log("✅ Fix complete! All modules renamed and questions evenly distributed.");
}

fixModules()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
