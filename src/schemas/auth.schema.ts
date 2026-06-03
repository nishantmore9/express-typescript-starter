import z from "zod";

export const resigterSchema = z.object({
  body: z.object({
   email: z.string('Email is required' ).email('Invalid email format'),
   password: z.string('Password is required').min(6,'Password must be 8 character long'),
  }),
})

export type RegisterInput = z.infer<typeof resigterSchema>['body'];