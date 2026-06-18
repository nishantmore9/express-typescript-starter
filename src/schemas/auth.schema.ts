import z from "zod";

export const resigterSchema = z.object({
  body: z.object({
   email: z.string('Email is required' ).email('Invalid email format'),
   password: z.string('Password is required').min(6,'Password must be 6 character long'),
  }),
})

export const loginSchema = z.object({
  body: z.object({
    email: z.string('Email is required' ).email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  })
})

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
  })
})

export const resetPasswordSchema = z.object({
  params: z.object({
    token : z.string().min(1, 'Token is required'),
  }),
  body: z.object({
    newPassword: z.string().min(6, 'Password must be 6 character long'),
  }),
})

export type RegisterInput = z.infer<typeof resigterSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type resetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];