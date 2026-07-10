import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({
    where: { id: "66fcdac8-a84e-4b8b-99e1-0dfdd54e58c1" },
    select: { departmentId: true, name: true }
  });
  console.log("User:", user);
}
main().finally(() => prisma.$disconnect());
