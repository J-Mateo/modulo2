import { AdminLog } from '../models/adminLog.model.js';

const createAdminLog = async ({ adminId, action, resource }) => {
  return AdminLog.create({
    adminId: String(adminId),
    action,
    resource,
  });
};

export const adminLogService = {
  createAdminLog,
};