import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, sessions } from '../db/schema.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { RegisterInput, LoginInput } from '../schemas/auth.schema.js';
import { env } from '../config/env.js';

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

    // Insert new user into the database
    const [newUser] = await db.insert(users).values({
      email,
      passwordHash,
    })
    .returning({
      id : users.id,
      email: users.email,
      createdAt: users.createdAt,
    });
    
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

}