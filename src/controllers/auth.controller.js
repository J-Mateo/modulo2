import { authService } from '../services/auth.service.js';

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);

    return res.status(201).json({
      ok: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);

    return res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const authController = {
  register,
  login,
};