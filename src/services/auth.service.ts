import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, sessions } from '../db/schema.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { RegisterInput, LoginInput } from '../schemas/auth.schema.js';
import { env } from '../config/env.js';
import { EmailService } from './email.service.js';

export class AuthService {
  static async register(input: RegisterInput) {
    const { email, password } = input;
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if(existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate a randome verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Insert new user into the database
    const [newUser] = await db.insert(users).values({
      email,
      passwordHash,
      verificationToken,
    })
    .returning({
      id : users.id,
      email: users.email,
      createdAt: users.createdAt,
    });

    if(!newUser) {
      throw new Error('Failed to create user record');
    }
    // Send verification mail with token
    EmailService.sendVerificationEmail(newUser?.email, verificationToken).catch(console.error);
    
    return newUser;
  }

  static async login(input: LoginInput, userAgent?: string, ipAddress?: string) {
    const { email, password } = input;
    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if(!user) {
      throw new Error('Invalid credentials');
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if(!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    // Generate token version for session management
    const tokenVersion = crypto.randomBytes(40).toString('hex');
    // Create Session 
    const [session] = await db.insert(sessions).values({
      userId: user.id,
      tokenVersion,
      userAgent,
      ipAddress,
    })
    .returning({
      id: sessions.id,
    });

    // Generate JWT tokens
    const accessToken = jwt.sign(
      {
        userId : user.id,
        sessionId : session?.id
      },
      env.JWT_ACCESS_SECRET,
      { 
        expiresIn : '15m'
      }
    )

    const refreshToken = jwt.sign(
      {
        userId : user.id,
        sessionId : session?.id,
        version : tokenVersion
      },
      env.JWT_REFRESH_SECRET,
      {
        expiresIn : '7d'
      }
    )

    return {
      user : {
        id : user.id,
        email : user.email
      },
      accessToken,
      refreshToken
    }
  }

  static async refreshToken(oldRefreshToken: string) {
    try {
      // verify the old token
      const decoded = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET) as {
        userId: string;
        sessionId: string;
        version: string;
      }

      // Find the session in the database
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, decoded.sessionId))
        .limit(1);

      // Security Check: Token rotation & reuse detection 
      if(!session || !session.isValid || session.tokenVersion !== decoded.version) {
        // If a reused token is detected, invalidate ALL sessions for this user (Theft detection)
        if(session) {
          await db.update(sessions).set({isValid : false}).where(eq(sessions.userId,decoded.userId));
        }
        throw new Error('Session is invalid ot token was reused');
      }

      // Generate a new token version string
      const nextTokenVersion = crypto.randomBytes(40).toString('hex');

      // Update the session in the database
      await db
        .update(sessions)
        .set({tokenVersion: nextTokenVersion})
        .where(eq(sessions.id, session.id));

      // Mint new tokens
      const accessToken = jwt.sign(
        { userId: session.userId, sessionId: session.id},
        env.JWT_ACCESS_SECRET,
        { expiresIn: '15m'}
      );

      const newRefreshToken = jwt.sign(
        { userId: session.userId, sessionId: session.id, version: nextTokenVersion},
        env.JWT_REFRESH_SECRET,
        { expiresIn: '7d'}
      );

      return {
        accessToken,
        newRefreshToken
      }
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static async logout(sessionId: string) {
    // Invalidate the session in the database
    await db
      .update(sessions)
      .set({ isValid: false })
      .where(eq(sessions.id, sessionId));
  }

}