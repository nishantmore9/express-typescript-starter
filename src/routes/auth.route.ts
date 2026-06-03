import { Router } from "express";
import { resgister } from "../controllers/auth.controller.js";
import { resigterSchema } from "../schemas/auth.schema.js";
import { validate } from "../middlewares/validate.js";

const router = Router();

router.post('/register', validate(resigterSchema), resgister);

export default router;