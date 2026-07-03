import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const defaultCourses = [
    { name: 'B.Tech Computer Science and Engineering', code: 'BTECH-CSE', duration: 4, credits: 160, semesters: 8 },
    { name: 'B.Tech Information Technology', code: 'BTECH-IT', duration: 4, credits: 160, semesters: 8 },
    { name: 'Master of Business Administration', code: 'MBA', duration: 2, credits: 80, semesters: 4 },
    { name: 'Bachelor of Pharmacy', code: 'BPHARM', duration: 4, credits: 160, semesters: 8 },
    { name: 'Bachelor of Science (Data Science)', code: 'BSC-DS', duration: 3, credits: 120, semesters: 6 }
  ];

  for (const c of defaultCourses) {
    await prisma.course.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }

  console.log('Seeded default courses successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
