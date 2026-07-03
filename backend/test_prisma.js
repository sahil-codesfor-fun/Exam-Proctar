import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    // 1. Try to create two departments
    console.log("Creating Dept 1...");
    const d1 = await prisma.department.create({
      data: { name: 'Dept1', code: 'D1' }
    });
    console.log("Dept 1 created.");

    console.log("Creating Dept 2...");
    const d2 = await prisma.department.create({
      data: { name: 'Dept2', code: 'D2' }
    });
    console.log("Dept 2 created.");

    // 2. Try to create two faculties with empty employeeId
    console.log("Creating Fac 1...");
    const f1 = await prisma.user.create({
      data: { name: 'Fac1', email: 'fac1@test.com', password: '123', role: 'faculty', facultyId: '' }
    });
    console.log("Fac 1 created.");

    console.log("Creating Fac 2...");
    const f2 = await prisma.user.create({
      data: { name: 'Fac2', email: 'fac2@test.com', password: '123', role: 'faculty', facultyId: '' }
    });
    console.log("Fac 2 created.");

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
