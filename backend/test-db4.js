import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const departmentId = '47f27f26-7205-4ab9-b480-a713c1b78198';
  const studentId = '66fcdac8-a84e-4b8b-99e1-0dfdd54e58c1';
  
  const courses = await prisma.hubCourse.findMany({
      where: { departmentId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            questions: {
              select: {
                id: true,
                title: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
  const submissions = await prisma.practiceSubmission.findMany({
        where: { 
          studentId, 
          verdict: { in: ['accepted', 'Accepted'] } 
        },
        select: { questionId: true },
        distinct: ['questionId']
      });
  let solvedQuestionIds = new Set(submissions.map(s => s.questionId));
  console.log("Solved IDs:", Array.from(solvedQuestionIds));
  
  const coursesWithProgress = courses.map(course => {
      let totalQuestions = 0;
      let solvedQuestions = 0;
      
      course.modules.forEach(mod => {
        if (mod.questions) {
          totalQuestions += mod.questions.length;
          mod.questions.forEach(q => {
            if (solvedQuestionIds.has(q.id)) {
              solvedQuestions++;
            }
          });
        }
      });
      
      const progress = totalQuestions > 0 ? Math.round((solvedQuestions / totalQuestions) * 100) : 0;
      
      return {
        title: course.title,
        progress,
        solvedQuestions,
        totalQuestions
      };
    });
    
    console.log(coursesWithProgress);
}
main().finally(() => prisma.$disconnect());
