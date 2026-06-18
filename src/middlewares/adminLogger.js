import { adminLogService } from '../services/adminLog.service.js';

export const adminLogger = (action, resource) => {
  return (req, res, next) => {
    res.on('finish', async () => {
      try {
        const isAdmin = req.user?.role === 'ADMIN';
        const isSuccess = res.statusCode >= 200 && res.statusCode < 400;

        if (isAdmin && isSuccess) {
          await adminLogService.createAdminLog({
            adminId: req.user.userId,
            action,
            resource,
          });

          console.log(`Admin log created: ${action} ${resource}`);
        }
      } catch (error) {
        console.error('Admin log error:', error.message);
      }
    });

    next();
  };
};