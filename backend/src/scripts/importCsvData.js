

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

const DATA_DIR = path.join(__dirname, '../data');

// ── Course Definitions ─────────────────────────────────────────
const COURSES = [
  {
    title: 'Java',
    questionsFile: 'Java Questions.csv',
    articlesFile: 'Java Articles.csv',
    hasCategory: true,
  },
  {
    title: 'Python',
    questionsFile: 'Python Questions.csv',
    articlesFile: 'Python Articles.csv',
    hasCategory: true,
  },
  {
    title: 'DSA',
    questionsFile: 'DSA Questions.csv',
    articlesFile: 'DSA Articles.csv',
    hasCategory: true,
  },
  {
    title: 'C Programming',
    questionsFile: 'C Programming.csv',
    articlesFile: 'C Programming Articles.csv',
    hasCategory: false,
  },
];

// ── CSV Reader ──────────────────────────────────────────────────
function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠ File not found: ${filePath}`);
      return resolve([]);
    }
    fs.createReadStream(filePath, { encoding: 'utf-8' })
      .pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// ── Sanitize ────────────────────────────────────────────────────
function sanitize(val) {
  if (!val || val === 'undefined' || val === 'null' || val === 'NaN') return null;
  return String(val).trim().substring(0, 65000);
}

function sanitizeLong(val) {
  if (!val || val === 'undefined' || val === 'null' || val === 'NaN') return null;
  return String(val).trim();
}

function parseDifficulty(val) {
  const d = String(val || 'medium').toLowerCase().trim();
  if (['easy', 'medium', 'hard'].includes(d)) return d;
  return 'medium';
}

function parseCompanyTags(val) {
  if (!val || val.trim() === '' || val.trim() === '[]') return null;
  try {
    return JSON.parse(val);
  } catch {
    const tags = val.split(',').map(t => t.trim()).filter(Boolean);
    return tags.length > 0 ? [...new Set(tags)] : null;
  }
}

// ── Import Questions ────────────────────────────────────────────
async function importQuestions(courseTitle, filePath, hasCategory, moduleMap) {
  console.log(`\n  📄 Reading questions from: ${path.basename(filePath)}`);
  const rows = await readCsv(filePath);
  console.log(`     Found ${rows.length} questions`);

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyId = sanitize(row._id || row['_id']);
    const problemName = sanitize(row.problem_name);

    if (!problemName) {
      skipped++;
      continue;
    }

    if (legacyId) {
      const existing = await prisma.question.findUnique({ where: { legacyImportId: legacyId } });
      if (existing) {
        skipped++;
        continue;
      }
    }

    const category = hasCategory ? sanitize(row.category) : null;
    const moduleTitle = category || 'All Questions';
    const moduleId = moduleMap[moduleTitle];

    if (!moduleId) {
      console.warn(`     ⚠ No module found for category "${moduleTitle}", skipping: ${problemName}`);
      skipped++;
      continue;
    }

    try {
      await prisma.question.create({
        data: {
          type: 'Programming',
          title: problemName,
          description: sanitizeLong(row.problem_data_problem_desc) || problemName,
          points: 10,
          difficulty: parseDifficulty(row.complexity),
          topic: sanitize(row.tagsInfo) || courseTitle,
          constraints: sanitizeLong(row.problem_data_constraints),
          solvedSource: 'CSV_IMPORT',
          hubModuleId: moduleId,
          legacyImportId: legacyId,
          inputFormat: sanitizeLong(row.problem_data_input_format),
          outputFormat: sanitizeLong(row.problem_data_output_format),
          sampleInput: sanitizeLong(row.problem_data_input),
          sampleOutput: sanitizeLong(row.problem_data_output),
          explanation: sanitizeLong(row.problem_data_explaination || row.problem_data_editorial),
          category: moduleTitle,
          tagsInfo: sanitize(row.tagsInfo),
          companyTags: parseCompanyTags(row.companies),

          solutionJava: sanitizeLong(row.java_editor_data_java_code),
          solutionPython: sanitizeLong(row.python_editor_data_python_code),
          solutionC: sanitizeLong(row.c_editor_data_c_code),
          solutionCpp: sanitizeLong(row.cpp_editor_data_cpp_code),

          stubJava: sanitizeLong(row.java_stub_editor_data_java_stub_code),
          stubPython: sanitizeLong(row.python_stub_editor_data_python_stub_code),
          stubC: sanitizeLong(row.c_stub_editor_data_c_stub_code),
          stubCpp: sanitizeLong(row.cpp_stub_editor_data_cpp_stub_code),
        },
      });

      const testInputs = (row.testcase_input || '').split(', ').filter(Boolean);
      const testOutputs = (row.testcase_output || '').split(', ').filter(Boolean);
      const hiddenInputs = (row.hidden_testcase_input || '').split(', ').filter(Boolean);
      const hiddenOutputs = (row.hidden_testcase_output || '').split(', ').filter(Boolean);

      if (legacyId) {
        const q = await prisma.question.findUnique({ where: { legacyImportId: legacyId } });
        if (q) {
          for (let i = 0; i < Math.min(testInputs.length, testOutputs.length); i++) {
            await prisma.testCase.create({
              data: {
                questionId: q.id,
                input: testInputs[i],
                expectedOutput: testOutputs[i],
                isHidden: false,
                points: 0,
              },
            });
          }
          for (let i = 0; i < Math.min(hiddenInputs.length, hiddenOutputs.length); i++) {
            await prisma.testCase.create({
              data: {
                questionId: q.id,
                input: hiddenInputs[i],
                expectedOutput: hiddenOutputs[i],
                isHidden: true,
                points: 0,
              },
            });
          }
        }
      }

      imported++;
    } catch (err) {
      console.error(`     ❌ Error importing "${problemName}":`, err.message);
      skipped++;
    }
  }

  console.log(`     ✅ Imported: ${imported} | Skipped: ${skipped}`);
  return imported;
}

// ── Import Articles ─────────────────────────────────────────────
async function importArticles(filePath, moduleId) {
  console.log(`\n  📖 Reading articles from: ${path.basename(filePath)}`);
  const rows = await readCsv(filePath);
  console.log(`     Found ${rows.length} article rows`);

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyId = sanitize(row._id || row['_id']);
    const topicName = sanitize(row.topic_name);

    if (!topicName) {
      skipped++;
      continue;
    }

    if (legacyId) {
      const existing = await prisma.hubArticle.findUnique({ where: { legacyImportId: legacyId } });
      if (existing) {
        skipped++;
        continue;
      }
    }

    try {
      await prisma.hubArticle.create({
        data: {
          moduleId,
          topicName,
          articleContent: sanitizeLong(row.article_data_clean || row.article_data),
          legacyImportId: legacyId,
        },
      });
      imported++;
    } catch (err) {
      console.error(`     ❌ Error importing article "${topicName}":`, err.message);
      skipped++;
    }
  }

  console.log(`     ✅ Imported: ${imported} | Skipped: ${skipped}`);
  return imported;
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Starting CSV Data Import...\n');

  let totalQuestions = 0;
  let totalArticles = 0;

  for (const courseDef of COURSES) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📚 Processing Course: ${courseDef.title}`);
    console.log(`${'═'.repeat(60)}`);

    let course = await prisma.hubCourse.findFirst({ where: { title: courseDef.title } });
    if (!course) {
      course = await prisma.hubCourse.create({
        data: {
          title: courseDef.title,
          description: `${courseDef.title} course imported via CSV.`,
        },
      });
      console.log(`  ✅ Created course: ${course.title} (${course.id})`);
    } else {
      console.log(`  ♻️  Course already exists: ${course.title} (${course.id})`);
    }

    const moduleMap = {};

    if (courseDef.hasCategory) {
      const categories = ['Trainer', 'Practice', 'Lab'];
      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        let mod = await prisma.hubModule.findFirst({
          where: { courseId: course.id, title: `${cat} Questions` },
        });
        if (!mod) {
          mod = await prisma.hubModule.create({
            data: { courseId: course.id, title: `${cat} Questions`, order: i },
          });
          console.log(`  ✅ Created module: ${mod.title}`);
        } else {
          console.log(`  ♻️  Module exists: ${mod.title}`);
        }
        moduleMap[cat] = mod.id;
      }
    } else {
      let mod = await prisma.hubModule.findFirst({
        where: { courseId: course.id, title: 'All Questions' },
      });
      if (!mod) {
        mod = await prisma.hubModule.create({
          data: { courseId: course.id, title: 'All Questions', order: 0 },
        });
        console.log(`  ✅ Created module: ${mod.title}`);
      } else {
        console.log(`  ♻️  Module exists: ${mod.title}`);
      }
      moduleMap['All Questions'] = mod.id;
    }

    let articlesMod = await prisma.hubModule.findFirst({
      where: { courseId: course.id, title: 'Articles' },
    });
    if (!articlesMod) {
      articlesMod = await prisma.hubModule.create({
        data: { courseId: course.id, title: 'Articles', order: 10 },
      });
      console.log(`  ✅ Created module: Articles`);
    } else {
      console.log(`  ♻️  Module exists: Articles`);
    }

    const qFile = path.join(DATA_DIR, courseDef.questionsFile);
    const qCount = await importQuestions(courseDef.title, qFile, courseDef.hasCategory, moduleMap);
    totalQuestions += qCount;

    const aFile = path.join(DATA_DIR, courseDef.articlesFile);
    const aCount = await importArticles(aFile, articlesMod.id);
    totalArticles += aCount;
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🎉 IMPORT COMPLETE!`);
  console.log(`   Total Questions Imported: ${totalQuestions}`);
  console.log(`   Total Articles Imported:  ${totalArticles}`);
  console.log(`${'═'.repeat(60)}\n`);
}

main()
  .catch((err) => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
