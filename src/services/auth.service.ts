import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { RegisterInput } from '../schemas/auth.schema.js';

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

}