import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function groupModules() {
  console.log("🚀 Starting module grouping...");

  const courses = await prisma.hubCourse.findMany({
    include: {
      modules: {
        orderBy: { createdAt: 'asc' } // Assuming we want chronological/sequential grouping
      }
    }
  });

  let newModuleCount = 0;
  let deletedModuleCount = 0;

  for (const course of courses) {
    console.log(`Processing course: ${course.title}`);
    const modules = course.modules;
    
    // Chunk into groups of 4
    for (let i = 0; i < modules.length; i += 4) {
      const chunk = modules.slice(i, i + 4);
      
      const moduleNumber = Math.floor(i / 4) + 1;
      const newModuleTitle = `Module ${moduleNumber}: ${chunk[0].title}`;
      
      // Create new consolidated module
      const newModule = await prisma.hubModule.create({
        data: {
          courseId: course.id,
          title: newModuleTitle,
          order: moduleNumber
        }
      });
      newModuleCount++;

      // Move all articles and questions from the chunk modules into the new module
      for (const oldMod of chunk) {
        await prisma.hubArticle.updateMany({
          where: { moduleId: oldMod.id },
          data: { moduleId: newModule.id }
        });

        await prisma.question.updateMany({
          where: { hubModuleId: oldMod.id },
          data: { hubModuleId: newModule.id }
        });

        // Delete the old module
        await prisma.hubModule.delete({
          where: { id: oldMod.id }
        });
        deletedModuleCount++;
      }
    }
  }

  console.log("✅ Grouping complete!");
  console.log(`- Created ${newModuleCount} grouped modules`);
  console.log(`- Deleted ${deletedModuleCount} granular modules`);
}

groupModules()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
