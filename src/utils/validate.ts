import { z } from 'zod';

// role field is intentionally excluded — users cannot self-assign roles
export const registerSchema = z.object({
  fullName: z
    .string({ required_error: 'fullName is required' })
    .min(2, 'fullName must be at least 2 characters')
    .max(255),
  birthDate: z
    .string({ required_error: 'birthDate is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'birthDate must be in YYYY-MM-DD format')
    .refine((d) => !isNaN(Date.parse(d)), 'birthDate is not a valid date'),
  email: z
    .string({ required_error: 'email is required' })
    .email('Invalid email format')
    .max(255),
  password: z
    .string({ required_error: 'password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(100),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'email is required' })
    .email('Invalid email format'),
  password: z
    .string({ required_error: 'password is required' })
    .min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
