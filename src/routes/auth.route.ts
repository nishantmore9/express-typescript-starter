import { Router } from "express";
import { resgister, login, logout, getProfile, refreshHandler } from "../controllers/auth.controller.js";
import { resigterSchema, loginSchema } from "../schemas/auth.schema.js";
import { validate } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

router.post('/register', validate(resigterSchema), resgister);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refreshHandler);
router.post('/logout', requireAuth, logout);
router.get('/profile', requireAuth, getProfile);

export default router;