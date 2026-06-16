import { Request, Response } from "express";
import { AuthService } from "../services/auth.service.js";
import { loginSchema } from "../schemas/auth.schema.js";
import { AuthRequest } from "../middlewares/requireAuth.js";
import strict from "node:assert/strict";
import { start } from "node:repl";

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
};

export const refreshHandler = async (req: Request, res: Response) : Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if(!refreshToken) {
      res.status(401)
          .json({
            status : 'error',
            message: 'No refresh token provided'
          })
      return;
    }

    const { accessToken, newRefreshToken } = await AuthService.refreshToken(refreshToken);
    
    // set the NEW refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly : true,
      // secure : proccess.env.NODE_ENV === 'production',
      sameSite : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.status(200).json({
      status : 'success',
      data : { accessToken}
    });
  } catch (error) {
    res.clearCookie('refreshToken');
    res.status(401)
        .json({
          status : 'error',
          message: 'Session expired, please log in agian'
        });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sessionId = req.user?.sessionId;
    if(sessionId) {
      await AuthService.logout(sessionId);
    }

    res.clearCookie('refreshToken');
    res.status(200)
        .json({
          status : 'success',
          message : 'Logged out successfully'
        })
  } catch (error) {
    res.status(500)
        .json({ 
          status: 'error', 
          message: 'Internal server error' 
        });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  // This is a protected route. If we reach here, req.user is guaranteed to exist!
  res.status(200).json({
    status: 'success',
    data: {
      userId: req.user?.userId,
      message: 'You have accessed a protected route!'
    }
  });
};
