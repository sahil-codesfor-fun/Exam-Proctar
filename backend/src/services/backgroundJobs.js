import { EventEmitter } from 'events';
import prisma from '../config/prisma.js';
import { getIO } from '../sockets/proctorSocket.js';
import { redisClient, isRedisConnected } from '../config/redis.js';

class JobQueue extends EventEmitter {}
export const jobQueue = new JobQueue();

// Error handling for the event emitter to prevent crashes
jobQueue.on('error', (err) => {
  console.error('Background Job Queue Error:', err);
});

jobQueue.on('createExam', async ({ examId, reqUser, examData, targetBatch, targetSection, departmentId, subjectId, isRand, serveNum, proctoring, formattedQuestions, examCode }) => {
  try {
    const [exam] = await prisma.$transaction([
      prisma.exam.create({
        data: {
          id: examId,
          title: examData.title,
          examCode,
          description: examData.description,
          course: examData.course,
          targetBatch: targetBatch || null,
          targetSection: targetSection || null,
          departmentId: departmentId,
          subjectId: subjectId || null,
          status: examData.status || 'draft',
          creatorId: reqUser.id,
          schedule: {
            create: {
              startDate: examData.startTime ? new Date(examData.startTime) : new Date(),
              endDate: examData.endTime ? new Date(examData.endTime) : new Date(Date.now() + (examData.durationMinutes || 60) * 60000),
              durationMinutes: examData.durationMinutes || 60,
            }
          },
          settings: {
            create: {
              randomizeQuestions: isRand,
              questionPoolSize: serveNum,
              browserLock: proctoring?.requireFullscreen || false,
              fullscreenRequired: proctoring?.requireFullscreen || false,
              aiFaceDetection: proctoring?.enableWebcam || false,
              clipboardDetection: proctoring?.disableCopyPaste !== false, // Defaults to true
              autoTerminateViolations: proctoring?.maxViolations ? parseInt(proctoring.maxViolations, 10) : 5,
              sessionTimeoutMinutes: proctoring?.restrictionMinutes !== undefined ? parseInt(proctoring.restrictionMinutes, 10) : 30,
              enableTypeDistribution: proctoring?.enableTypeDistribution || false,
              typeDistribution: proctoring?.typeDistribution || null,
            }
          },
          questions: { create: formattedQuestions || [] }
        },
        include: {
          questions: { include: { options: true, testCases: true, matchingPairs: true } },
          creator: { select: { name: true, email: true } },
          settings: true,
          schedule: true
        }
      })
    ], {
      maxWait: 10000,
      timeout: 30000 // Safely gives the cloud DB 30 seconds to parse the giant nested tree
    });

    const responseData = {
      ...exam,
      _id: exam.id,
      faculty: exam.creator,
      proctoring: proctoring || {},
      randomizeQuestions: exam.settings?.randomizeQuestions,
      questionsToServe: exam.settings?.questionPoolSize,
      typeDistribution: exam.settings?.typeDistribution,
      enableTypeDistribution: exam.settings?.enableTypeDistribution,
      startTime: exam.schedule?.startDate,
      endTime: exam.schedule?.endDate,
      durationMinutes: exam.schedule?.durationMinutes
    };

    if (responseData.status === 'published' || responseData.status === 'active') {
      try { const io = getIO(); io.emit('exam_published', responseData); } catch (e) { console.error(e); }
    }

    if (isRedisConnected) {
      const keys = await redisClient.keys('exam*');
      if (keys.length > 0) await redisClient.del(keys);
    }
    
    console.log(`✅ Background Job Completed: Exam ${examId} created successfully.`);
  } catch (err) {
    console.error(`❌ Background Job Failed: Exam ${examId} creation failed.`, err);
  }
});