import { Request, Response } from "express";
import { AuthService } from "../services/auth.service.js";
import { loginSchema } from "../schemas/auth.schema.js";

export const resgister = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await AuthService.register(req.body);
    res.status(201).json({
      status: "success",
      data: { user },
    });
  } catch (error: any) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
  // res.status(500).json({ status: "error", message: "Internal server error" });
};

export const login = async (req : Request, res: Response): Promise<void> => {
  try {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;

    const {user, accessToken, refreshToken} = await AuthService.login(req.body, userAgent, ipAddress);

    res.cookie('refreshToken', refreshToken, {
      httpOnly : true,
      // secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.status(200).json({
      status : "success",
      data : {user, accessToken}
    })
  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      res.status(401).json({ status: 'error', message: error.message });
      return;
    }
  }
}
