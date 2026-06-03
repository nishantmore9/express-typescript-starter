import { Request, Response } from "express";
import { AuthService } from "../services/auth.service.js";

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
