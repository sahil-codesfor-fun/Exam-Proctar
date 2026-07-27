import prisma from '../config/prisma.js';

class AuditService {
  static async log({
    userId,
    action,
    entity,
    entityId = null,
    details = null,
    previousValues = null,
    newValues = null,
    ipAddress = null,
    userAgent = null,
    status = 'success'
  }) {
    try {
      await prisma.activityLog.create({
        data: {
          userId,
          action,
          entity,
          entityId,
          details,
          previousValues: previousValues ? previousValues : null,
          newValues: newValues ? newValues : null,
          ipAddress,
          userAgent,
          status,
        }
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }
}

export default AuditService;
