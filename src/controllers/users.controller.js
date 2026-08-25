import { usersService } from '../services/users.service.js';
import { sendSuccess } from '../utils/responses.js';

const getProfile = async (req, res, next) => {
  try {
    const user = await usersService.getProfile(req.user.userId);

    return sendSuccess(res, {
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

export const usersController = {
  getProfile,
};