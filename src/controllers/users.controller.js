import { usersService } from '../services/users.service.js';

const getProfile = async (req, res, next) => {
  try {
    const user = await usersService.getProfile(req.user.userId);

    return res.json({
      ok: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

export const usersController = {
  getProfile,
};