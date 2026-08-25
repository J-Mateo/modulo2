import { Router } from 'express';

import { authController } from '../controllers/auth.controller.js';
import { noCache } from '../middlewares/noCache.js';

const router = Router();

router.post('/register', noCache, authController.register);
router.post('/login', noCache, authController.login);
router.post('/logout', noCache, authController.logout);

export default router;