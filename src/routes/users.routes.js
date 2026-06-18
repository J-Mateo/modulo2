import { Router } from 'express';
import { usersController } from '../controllers/users.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();

router.get('/profile', authenticate, usersController.getProfile);

export default router;