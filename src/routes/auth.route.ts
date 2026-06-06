import { Router } from "express";
import { resgister, login } from "../controllers/auth.controller.js";
import { resigterSchema, loginSchema } from "../schemas/auth.schema.js";
import { validate } from "../middlewares/validate.js";

const router = Router();

router.post('/register', validate(resigterSchema), resgister);
router.post('/login', validate(loginSchema), login);

export default router;