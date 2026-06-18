import { Router } from "express";
import { resgister, login, logout, getProfile, refreshHandler, verifyEmail, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import { resigterSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../schemas/auth.schema.js";
import { validate } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

router.post('/register', validate(resigterSchema), resgister);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refreshHandler);
router.post('/logout', requireAuth, logout);
router.get('/profile', requireAuth, getProfile);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema), resetPassword);

export default router;