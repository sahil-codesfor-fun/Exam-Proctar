import prisma from '../config/prisma.js';

class AuditService {
  /**
   * Logs an activity into the database.
   * @param {Object} params
   * @param {string} params.userId - The ID of the user performing the action
   * @param {string} params.action - E.g., 'CREATED_DEPARTMENT', 'UPDATED_DEPARTMENT'
   * @param {string} params.entity - E.g., 'Department', 'User'
   * @param {string} [params.entityId] - The ID of the affected entity
   * @param {string} [params.details] - Additional details
   * @param {Object} [params.previousValues] - JSON of old values
   * @param {Object} [params.newValues] - JSON of new values
   * @param {string} [params.ipAddress] - IP of the requester
   * @param {string} [params.userAgent] - Browser/Client info
   * @param {string} [params.status] - 'success' or 'failure'
   */
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
      // We explicitly swallow this error so a failed audit log 
      // doesn't crash the main business transaction, though in strict
      // environments you might want it to.
    }
  }
}

export default AuditService;
