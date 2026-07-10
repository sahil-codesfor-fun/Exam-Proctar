import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function restructureModules() {
  console.log("🚀 Starting database restructure...");

  // 1. Fetch all articles
  const articles = await prisma.hubArticle.findMany({
    include: {
      module: {
        select: { courseId: true }
      }
    }
  });

  console.log(`Found ${articles.length} articles to process.`);

  let createdModulesCount = 0;
  let movedArticlesCount = 0;
  let matchedQuestionsCount = 0;

  for (const article of articles) {
    if (!article.module || !article.module.courseId) continue;
    
    const courseId = article.module.courseId;
    const moduleName = article.topicName;

    // Check if a module with this exact name already exists in the course
    let newModule = await prisma.hubModule.findFirst({
      where: {
        courseId: courseId,
        title: moduleName
      }
    });

    if (!newModule) {
      newModule = await prisma.hubModule.create({
        data: {
          courseId: courseId,
          title: moduleName,
          order: 100 // push to end
        }
      });
      createdModulesCount++;
    }

    // Move article to the new module
    if (article.moduleId !== newModule.id) {
      await prisma.hubArticle.update({
        where: { id: article.id },
        data: { moduleId: newModule.id }
      });
      movedArticlesCount++;
    }

    // Try to find matching questions in the SAME course that haven't been matched yet.
    const courseModules = await prisma.hubModule.findMany({
      where: { courseId: courseId },
      select: { id: true }
    });
    const courseModuleIds = courseModules.map(m => m.id);

    // Look for questions in these modules whose topic (tags) contains a keyword from the article
    const articleKeywords = moduleName.split(' ').filter(w => w.length > 3).map(w => w.toLowerCase());
    
    if (articleKeywords.length > 0) {
      const allQuestions = await prisma.question.findMany({
        where: {
          hubModuleId: { in: courseModuleIds },
          topic: { not: null }
        }
      });

      for (const q of allQuestions) {
        // Simple tag matching
        const qTags = q.topic.toLowerCase();
        const matches = articleKeywords.some(keyword => qTags.includes(keyword));

        // Let's only move if the old module was a generic one like 'Practice Questions', 'Lab Questions', 'All Questions' or 'DSA'
        const genericNames = ['practice questions', 'lab questions', 'all questions', 'trainer questions', 'dsa'];
        const currentModule = await prisma.hubModule.findUnique({ where: { id: q.hubModuleId } });
        const isGeneric = currentModule && genericNames.includes(currentModule.title.toLowerCase());

        if (matches && q.hubModuleId !== newModule.id && isGeneric) {
          await prisma.question.update({
            where: { id: q.id },
            data: { hubModuleId: newModule.id }
          });
          matchedQuestionsCount++;
        }
      }
    }
  }

  // Cleanup: Delete modules that are now empty (0 questions, 0 articles)
  const emptyModules = await prisma.hubModule.findMany({
    where: {
      questions: { none: {} },
      articles: { none: {} }
    }
  });

  for (const empty of emptyModules) {
    await prisma.hubModule.delete({ where: { id: empty.id } });
  }

  console.log("✅ Restructure complete!");
  console.log(`- Created ${createdModulesCount} new modules`);
  console.log(`- Moved ${movedArticlesCount} articles`);
  console.log(`- Auto-matched ${matchedQuestionsCount} questions`);
  console.log(`- Deleted ${emptyModules.length} empty legacy modules`);
}

restructureModules()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
