-- DropForeignKey
ALTER TABLE `Option` DROP FOREIGN KEY `Option_questionId_fkey`;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `leetcodeUsername`;

-- AlterTable
ALTER TABLE `Exam` DROP COLUMN `durationMinutes`,
    DROP COLUMN `endTime`,
    DROP COLUMN `proctoringRules`,
    DROP COLUMN `questionsToServe`,
    DROP COLUMN `randomizeQuestions`,
    DROP COLUMN `startTime`,
    ADD COLUMN `batch` VARCHAR(191) NULL,
    ADD COLUMN `credits` INTEGER NULL,
    ADD COLUMN `departmentId` VARCHAR(191) NULL,
    ADD COLUMN `difficulty` VARCHAR(191) NOT NULL DEFAULT 'medium',
    ADD COLUMN `examCode` VARCHAR(191) NOT NULL,
    ADD COLUMN `examType` VARCHAR(191) NOT NULL DEFAULT 'regular',
    ADD COLUMN `instructions` TEXT NULL,
    ADD COLUMN `semester` INTEGER NULL,
    ADD COLUMN `subjectId` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `Question` ADD COLUMN `difficulty` VARCHAR(191) NOT NULL DEFAULT 'medium',
    ADD COLUMN `questionBankId` VARCHAR(191) NULL,
    ADD COLUMN `topic` VARCHAR(191) NULL,
    ADD COLUMN `topics` VARCHAR(191) NULL,
    MODIFY `examId` VARCHAR(191) NULL,
    MODIFY `timeLimitSeconds` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `TestCase` ADD COLUMN `points` INTEGER NOT NULL DEFAULT 0,
    MODIFY `isHidden` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Violation` MODIFY `details` TEXT NULL;

-- DropTable
DROP TABLE `Option`;

-- CreateTable
CREATE TABLE `Course` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `duration` INTEGER NOT NULL,
    `credits` INTEGER NOT NULL,
    `semesters` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Course_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DepartmentCourse` (
    `id` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `academicYear` VARCHAR(191) NULL,
    `batch` VARCHAR(191) NULL,
    `semesterStructure` VARCHAR(191) NULL,
    `totalSections` INTEGER NULL,
    `intakeCapacity` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DepartmentCourse_departmentId_courseId_key`(`departmentId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamSchedule` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `durationMinutes` INTEGER NOT NULL,
    `timeZone` VARCHAR(191) NOT NULL DEFAULT 'UTC',
    `bufferTimeMinutes` INTEGER NOT NULL DEFAULT 0,
    `lateJoinWindowMinutes` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `ExamSchedule_examId_key`(`examId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamSettings` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `randomizeQuestions` BOOLEAN NOT NULL DEFAULT false,
    `randomizeOptions` BOOLEAN NOT NULL DEFAULT false,
    `shuffleSections` BOOLEAN NOT NULL DEFAULT false,
    `questionPoolSize` INTEGER NULL,
    `totalMarks` INTEGER NOT NULL DEFAULT 0,
    `passingMarks` INTEGER NOT NULL DEFAULT 0,
    `negativeMarking` BOOLEAN NOT NULL DEFAULT false,
    `partialMarking` BOOLEAN NOT NULL DEFAULT false,
    `autoSubmit` BOOLEAN NOT NULL DEFAULT true,
    `multipleAttempts` BOOLEAN NOT NULL DEFAULT false,
    `attemptLimit` INTEGER NOT NULL DEFAULT 1,
    `calculator` BOOLEAN NOT NULL DEFAULT false,
    `formulaSheet` BOOLEAN NOT NULL DEFAULT false,
    `openBook` BOOLEAN NOT NULL DEFAULT false,
    `examPassword` VARCHAR(191) NULL,
    `accessToken` VARCHAR(191) NULL,
    `ipRestriction` VARCHAR(191) NULL,
    `deviceRestriction` BOOLEAN NOT NULL DEFAULT false,
    `browserRestriction` BOOLEAN NOT NULL DEFAULT false,
    `locationRestriction` BOOLEAN NOT NULL DEFAULT false,
    `oneDeviceLogin` BOOLEAN NOT NULL DEFAULT true,
    `sessionTimeoutMinutes` INTEGER NOT NULL DEFAULT 120,
    `autoLogout` BOOLEAN NOT NULL DEFAULT true,
    `autoSaveIntervalSeconds` INTEGER NOT NULL DEFAULT 30,
    `encryptionEnabled` BOOLEAN NOT NULL DEFAULT true,
    `browserLock` BOOLEAN NOT NULL DEFAULT true,
    `fullscreenRequired` BOOLEAN NOT NULL DEFAULT true,
    `aiFaceDetection` BOOLEAN NOT NULL DEFAULT true,
    `faceRegistration` BOOLEAN NOT NULL DEFAULT true,
    `identityVerification` BOOLEAN NOT NULL DEFAULT true,
    `tabSwitchingDetection` BOOLEAN NOT NULL DEFAULT true,
    `multipleMonitorDetection` BOOLEAN NOT NULL DEFAULT true,
    `windowBlurDetection` BOOLEAN NOT NULL DEFAULT true,
    `mobileDetection` BOOLEAN NOT NULL DEFAULT true,
    `voiceDetection` BOOLEAN NOT NULL DEFAULT true,
    `multiplePersonDetection` BOOLEAN NOT NULL DEFAULT true,
    `eyeTracking` BOOLEAN NOT NULL DEFAULT false,
    `headPoseTracking` BOOLEAN NOT NULL DEFAULT false,
    `objectDetection` BOOLEAN NOT NULL DEFAULT false,
    `backgroundNoiseDetection` BOOLEAN NOT NULL DEFAULT true,
    `webcamRecording` BOOLEAN NOT NULL DEFAULT false,
    `screenRecording` BOOLEAN NOT NULL DEFAULT false,
    `screenSharingDetection` BOOLEAN NOT NULL DEFAULT true,
    `microphoneMonitoring` BOOLEAN NOT NULL DEFAULT true,
    `clipboardDetection` BOOLEAN NOT NULL DEFAULT true,
    `keyboardShortcutBlocking` BOOLEAN NOT NULL DEFAULT true,
    `violationSeverityLow` INTEGER NOT NULL DEFAULT 3,
    `violationSeverityMedium` INTEGER NOT NULL DEFAULT 3,
    `violationSeverityHigh` INTEGER NOT NULL DEFAULT 1,
    `autoTerminateViolations` INTEGER NOT NULL DEFAULT 5,

    UNIQUE INDEX `ExamSettings_examId_key`(`examId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionBank` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `department` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionOption` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `isCorrect` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProgrammingQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `allowedLanguages` VARCHAR(191) NOT NULL,
    `starterCode` TEXT NULL,
    `timeLimit` INTEGER NOT NULL,
    `memoryLimit` INTEGER NOT NULL,
    `compilationLimit` INTEGER NOT NULL,
    `customInput` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `ProgrammingQuestion_questionId_key`(`questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `assignType` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `semester` INTEGER NULL,
    `batch` VARCHAR(191) NULL,
    `section` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `attemptNum` INTEGER NOT NULL DEFAULT 1,
    `startTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endTime` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'in_progress',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamResult` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `attemptId` VARCHAR(191) NOT NULL,
    `marks` DOUBLE NOT NULL DEFAULT 0,
    `percentage` DOUBLE NOT NULL DEFAULT 0,
    `rank` INTEGER NULL,
    `passFail` VARCHAR(191) NOT NULL DEFAULT 'FAIL',
    `grade` VARCHAR(191) NULL,
    `questionAnalysis` JSON NULL,
    `topicAnalysis` JSON NULL,
    `timeAnalysis` JSON NULL,
    `aiSuggestions` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ExamResult_attemptId_key`(`attemptId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LiveSession` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `aiSuspicionScore` DOUBLE NOT NULL DEFAULT 0,
    `connectivity` VARCHAR(191) NOT NULL DEFAULT 'online',
    `fullscreenStatus` BOOLEAN NOT NULL DEFAULT true,
    `micStatus` BOOLEAN NOT NULL DEFAULT true,
    `cameraStatus` BOOLEAN NOT NULL DEFAULT true,
    `currentQuestion` VARCHAR(191) NULL,
    `remainingTime` INTEGER NULL,
    `lastPing` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `LiveSession_examId_studentId_key`(`examId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamNotification` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `scheduleType` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `scheduledAt` DATETIME(3) NULL,
    `sentAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamAnalytics` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `totalRegistered` INTEGER NOT NULL DEFAULT 0,
    `totalAttendees` INTEGER NOT NULL DEFAULT 0,
    `averageScore` DOUBLE NOT NULL DEFAULT 0,
    `highestScore` DOUBLE NOT NULL DEFAULT 0,
    `lowestScore` DOUBLE NOT NULL DEFAULT 0,
    `passRate` DOUBLE NOT NULL DEFAULT 0,
    `averageCompletionTime` INTEGER NOT NULL DEFAULT 0,
    `cheatingIncidents` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ExamAnalytics_examId_key`(`examId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamReport` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `reportType` VARCHAR(191) NOT NULL,
    `fileUrl` TEXT NULL,
    `generatedBy` VARCHAR(191) NOT NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PracticeSheet` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `publishAt` DATETIME(3) NULL,
    `dueDate` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `creatorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PracticeSheetQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `practiceSheetId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `PracticeSheetQuestion_practiceSheetId_questionId_key`(`practiceSheetId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PracticeAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `practiceSheetId` VARCHAR(191) NOT NULL,
    `assignType` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `semester` INTEGER NULL,
    `batch` VARCHAR(191) NULL,
    `section` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentCodingProgress` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `totalAssigned` INTEGER NOT NULL DEFAULT 0,
    `totalSolved` INTEGER NOT NULL DEFAULT 0,
    `easySolved` INTEGER NOT NULL DEFAULT 0,
    `mediumSolved` INTEGER NOT NULL DEFAULT 0,
    `hardSolved` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `StudentCodingProgress_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentCodingStatistics` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `currentStreak` INTEGER NOT NULL DEFAULT 0,
    `longestStreak` INTEGER NOT NULL DEFAULT 0,
    `acceptanceRate` DOUBLE NOT NULL DEFAULT 0,
    `averageRuntime` DOUBLE NOT NULL DEFAULT 0,
    `averageMemory` DOUBLE NOT NULL DEFAULT 0,
    `totalAttempts` INTEGER NOT NULL DEFAULT 0,
    `wrongAttempts` INTEGER NOT NULL DEFAULT 0,
    `solvedOnFirstAttempt` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `StudentCodingStatistics_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TopicProgress` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `topic` VARCHAR(191) NOT NULL,
    `solvedCount` INTEGER NOT NULL DEFAULT 0,
    `totalAvailable` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `TopicProgress_studentId_topic_key`(`studentId`, `topic`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CodingLeaderboard` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `score` DOUBLE NOT NULL DEFAULT 0,
    `universityRank` INTEGER NOT NULL DEFAULT 0,
    `departmentRank` INTEGER NOT NULL DEFAULT 0,
    `courseRank` INTEGER NOT NULL DEFAULT 0,
    `weeklyRank` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `CodingLeaderboard_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CodingStreak` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `current` INTEGER NOT NULL DEFAULT 0,
    `longest` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `CodingStreak_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailyActivity` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `submitCount` INTEGER NOT NULL DEFAULT 0,
    `solvedCount` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `DailyActivity_studentId_date_key`(`studentId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PracticeSubmission` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `practiceSheetId` VARCHAR(191) NULL,
    `language` VARCHAR(191) NOT NULL,
    `code` TEXT NOT NULL,
    `verdict` VARCHAR(191) NOT NULL,
    `runtime` DOUBLE NOT NULL DEFAULT 0,
    `memory` DOUBLE NOT NULL DEFAULT 0,
    `teacherFeedback` TEXT NULL,
    `isFirstAttempt` BOOLEAN NOT NULL DEFAULT false,
    `attemptNumber` INTEGER NOT NULL DEFAULT 1,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Accepted',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Badge` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `criteria` VARCHAR(191) NULL,

    UNIQUE INDEX `Badge_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentBadge` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `badgeId` VARCHAR(191) NOT NULL,
    `earnedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `StudentBadge_studentId_badgeId_key`(`studentId`, `badgeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DSARoadmap` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoadmapTopic` (
    `id` VARCHAR(191) NOT NULL,
    `roadmapId` VARCHAR(191) NOT NULL,
    `topicName` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `requiredSolved` INTEGER NOT NULL DEFAULT 10,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CodeDraft` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `practiceSheetId` VARCHAR(191) NULL,
    `language` VARCHAR(191) NOT NULL,
    `code` TEXT NOT NULL,
    `lastSavedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CodeDraft_studentId_questionId_language_key`(`studentId`, `questionId`, `language`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionVersion` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `versionNumber` INTEGER NOT NULL,
    `previousContent` JSON NOT NULL,
    `updatedContent` JSON NOT NULL,
    `changeSummary` VARCHAR(191) NULL,
    `editedBy` VARCHAR(191) NOT NULL,
    `editedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PracticeSheetVersion` (
    `id` VARCHAR(191) NOT NULL,
    `practiceSheetId` VARCHAR(191) NOT NULL,
    `versionNumber` INTEGER NOT NULL,
    `previousContent` JSON NOT NULL,
    `updatedContent` JSON NOT NULL,
    `changeSummary` VARCHAR(191) NULL,
    `editedBy` VARCHAR(191) NOT NULL,
    `editedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PracticeSheetCompletion` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `practiceSheetId` VARCHAR(191) NOT NULL,
    `totalTimeSpent` INTEGER NOT NULL,
    `finalScore` DOUBLE NOT NULL DEFAULT 0,
    `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PracticeSheetCompletion_studentId_practiceSheetId_key`(`studentId`, `practiceSheetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlatformIntegration` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `platform` ENUM('LEETCODE', 'HACKERRANK', 'CODECHEF', 'CODEFORCES', 'GITHUB', 'ATCODER') NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `profileUrl` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `displayName` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `globalRank` INTEGER NULL,
    `reputation` INTEGER NULL,
    `connectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastSuccessfulSync` DATETIME(3) NULL,
    `lastFailedSync` DATETIME(3) NULL,
    `syncErrorMessage` TEXT NULL,
    `syncStatus` ENUM('CONNECTED', 'SYNCING', 'ERROR', 'DISCONNECTED') NOT NULL DEFAULT 'CONNECTED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PlatformIntegration_userId_platform_key`(`userId`, `platform`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlatformStatistics` (
    `id` VARCHAR(191) NOT NULL,
    `integrationId` VARCHAR(191) NOT NULL,
    `problemStats` JSON NULL,
    `contestStats` JSON NULL,
    `languageStats` JSON NULL,
    `activityStats` JSON NULL,
    `lastUpdated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PlatformStatistics_integrationId_key`(`integrationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlatformSyncLog` (
    `id` VARCHAR(191) NOT NULL,
    `integrationId` VARCHAR(191) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL,
    `durationMs` INTEGER NULL,
    `recordsUpdated` INTEGER NOT NULL DEFAULT 0,
    `errorMessage` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailyGoal` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `goalType` VARCHAR(191) NOT NULL,
    `targetValue` INTEGER NOT NULL,
    `currentValue` INTEGER NOT NULL DEFAULT 0,
    `deadline` DATETIME(3) NOT NULL,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AISuggestion` (
    `id` VARCHAR(191) NOT NULL,
    `contextType` VARCHAR(191) NOT NULL,
    `contextId` VARCHAR(191) NOT NULL,
    `suggestionText` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CodeAnalysis` (
    `id` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `complexityTime` VARCHAR(191) NULL,
    `complexitySpace` VARCHAR(191) NULL,
    `cleanCodeScore` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LearningRecommendation` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `recommendation` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Exam_examCode_key` ON `Exam`(`examCode`);

-- AddForeignKey
ALTER TABLE `DepartmentCourse` ADD CONSTRAINT `DepartmentCourse_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DepartmentCourse` ADD CONSTRAINT `DepartmentCourse_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Exam` ADD CONSTRAINT `Exam_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Exam` ADD CONSTRAINT `Exam_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamSchedule` ADD CONSTRAINT `ExamSchedule_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamSettings` ADD CONSTRAINT `ExamSettings_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_questionBankId_fkey` FOREIGN KEY (`questionBankId`) REFERENCES `QuestionBank`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionOption` ADD CONSTRAINT `QuestionOption_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProgrammingQuestion` ADD CONSTRAINT `ProgrammingQuestion_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamAssignment` ADD CONSTRAINT `ExamAssignment_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamAssignment` ADD CONSTRAINT `ExamAssignment_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamAssignment` ADD CONSTRAINT `ExamAssignment_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamAttempt` ADD CONSTRAINT `ExamAttempt_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamAttempt` ADD CONSTRAINT `ExamAttempt_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamResult` ADD CONSTRAINT `ExamResult_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamResult` ADD CONSTRAINT `ExamResult_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamResult` ADD CONSTRAINT `ExamResult_attemptId_fkey` FOREIGN KEY (`attemptId`) REFERENCES `ExamAttempt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LiveSession` ADD CONSTRAINT `LiveSession_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LiveSession` ADD CONSTRAINT `LiveSession_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamNotification` ADD CONSTRAINT `ExamNotification_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamNotification` ADD CONSTRAINT `ExamNotification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamAnalytics` ADD CONSTRAINT `ExamAnalytics_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamReport` ADD CONSTRAINT `ExamReport_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PracticeSheet` ADD CONSTRAINT `PracticeSheet_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PracticeSheetQuestion` ADD CONSTRAINT `PracticeSheetQuestion_practiceSheetId_fkey` FOREIGN KEY (`practiceSheetId`) REFERENCES `PracticeSheet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PracticeSheetQuestion` ADD CONSTRAINT `PracticeSheetQuestion_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PracticeAssignment` ADD CONSTRAINT `PracticeAssignment_practiceSheetId_fkey` FOREIGN KEY (`practiceSheetId`) REFERENCES `PracticeSheet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PracticeAssignment` ADD CONSTRAINT `PracticeAssignment_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentCodingProgress` ADD CONSTRAINT `StudentCodingProgress_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentCodingStatistics` ADD CONSTRAINT `StudentCodingStatistics_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TopicProgress` ADD CONSTRAINT `TopicProgress_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyActivity` ADD CONSTRAINT `DailyActivity_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PracticeSubmission` ADD CONSTRAINT `PracticeSubmission_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentBadge` ADD CONSTRAINT `StudentBadge_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentBadge` ADD CONSTRAINT `StudentBadge_badgeId_fkey` FOREIGN KEY (`badgeId`) REFERENCES `Badge`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoadmapTopic` ADD CONSTRAINT `RoadmapTopic_roadmapId_fkey` FOREIGN KEY (`roadmapId`) REFERENCES `DSARoadmap`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CodeDraft` ADD CONSTRAINT `CodeDraft_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CodeDraft` ADD CONSTRAINT `CodeDraft_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionVersion` ADD CONSTRAINT `QuestionVersion_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PracticeSheetVersion` ADD CONSTRAINT `PracticeSheetVersion_practiceSheetId_fkey` FOREIGN KEY (`practiceSheetId`) REFERENCES `PracticeSheet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PracticeSheetCompletion` ADD CONSTRAINT `PracticeSheetCompletion_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PracticeSheetCompletion` ADD CONSTRAINT `PracticeSheetCompletion_practiceSheetId_fkey` FOREIGN KEY (`practiceSheetId`) REFERENCES `PracticeSheet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlatformIntegration` ADD CONSTRAINT `PlatformIntegration_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlatformStatistics` ADD CONSTRAINT `PlatformStatistics_integrationId_fkey` FOREIGN KEY (`integrationId`) REFERENCES `PlatformIntegration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlatformSyncLog` ADD CONSTRAINT `PlatformSyncLog_integrationId_fkey` FOREIGN KEY (`integrationId`) REFERENCES `PlatformIntegration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyGoal` ADD CONSTRAINT `DailyGoal_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

