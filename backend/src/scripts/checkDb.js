import prisma from '../config/prisma.js';

async function checkDatabase() {
  console.log('--- Starting Database Model Verification ---');
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    for (const model of Object.keys(prisma)) {
      if (typeof prisma[model]?.count === 'function') {
        try {
          const count = await prisma[model].count();
          console.log(`✅ Model [${model}]: ${count} records`);
        } catch (err) {
          console.error(`❌ Model [${model}] query error:`, err.message);
        }
      }
    }

    console.log('--- Database Verification Finished ---');
  } catch (err) {
    console.error('❌ Database connection/execution failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
