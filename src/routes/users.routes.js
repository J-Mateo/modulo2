import { Router } from 'express';

import { usersController } from '../controllers/users.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { noCache } from '../middlewares/noCache.js';

const router = Router();

router.get(
  '/profile',
  noCache,
  authenticate,
  usersController.getProfile
);

export default router;