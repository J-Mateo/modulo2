import {
  Router,
} from 'express';

import {
  authController,
} from '../controllers/auth.controller.js';

import {
  noCache,
} from '../middlewares/noCache.js';

import {
  forgotPasswordLimiter,
  loginLimiter,
  registerLimiter,
  resetPasswordLimiter,
} from '../middlewares/authRateLimit.js';

const router =
  Router();

router.post(
  '/register',
  noCache,
  registerLimiter,
  authController.register
);

router.post(
  '/login',
  noCache,
  loginLimiter,
  authController.login
);

router.post(
  '/logout',
  noCache,
  authController.logout
);

router.post(
  '/forgot-password',
  noCache,
  forgotPasswordLimiter,
  authController.forgotPassword
);

router.post(
  '/reset-password',
  noCache,
  resetPasswordLimiter,
  authController.resetPassword
);

export default router;