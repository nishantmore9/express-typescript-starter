import e, { Request, Response } from "express";
import { AuthService } from "../services/auth.service.js";
import { loginSchema } from "../schemas/auth.schema.js";
import { AuthRequest } from "../middlewares/requireAuth.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

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

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    // Validate token
    if(!token || typeof token !== 'string') {
      res.status(400)
          .json({
            status : 'error',
            message : 'Verification token is missing.'
          });
      return;
    }
    // Find user with same token
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.verificationToken, token))
      .limit(1);

    if(!user) {
      res.status(400)
          .json({ 
            status: 'error', 
            message: 'Invalid or expired verification token' 
          });
      return;
    }
    // update user set verified true
    await db
      .update(users)
      .set({
        isVerified: true,
        verificationToken: null,
      })
      .where(eq(users.id, user.id));

    res.status(200)
        .json({ 
          status: 'success', 
          message: 'Email verified successfully!' 
        });

  } catch (error) {
    res.status(500)
        .json({ 
          status: 'error', 
          message: 'Internal server error' 
        });
  }
}

export const forgotPassword = async (req: Request, res: Response): Promise<void> =>  {
  try {
    const { email } = req.body;
    await AuthService.forgotPassword(email);

    res.status(200)
      .json({
        status: 'success',
        message: 'If an account with that email exists, a reset link has been sent.',
      });
  } catch (error) {
    res.status(500)
      .json({
        status: 'error', 
        message: 'Internal server error' 
      });
  }
}

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token || typeof token !== 'string') {
        res.status(400)
        .json({ 
          status: 'error', 
          message: 'Invalid token' 
        });
        return;
    }

    await AuthService.resetPassword(token, newPassword);

    res.status(200)
        .json({
          status: 'success',
          message: 'Password has been successfully reset. You can now log in.',
        });
  } catch (error: any) {
    if (error.message === 'Invallid or expired password reset token') {
      res.status(400).json({ status: 'error', message: error.message });
      return;
    }
    res.status(500)
        .json({ 
          status: 'error', 
          message: 'Internal server error' 
        });
  }
}