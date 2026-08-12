import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Must be at least 8 characters"),
});
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const listSchema = z.object({
  title: z.string().min(1, "Give the list a name").max(80, "Keep it under 80 characters"),
});
export type ListFormValues = z.infer<typeof listSchema>;

export const taskSchema = z.object({
  title: z.string().min(1, "Give the task a title").max(120, "Keep it under 120 characters"),
  description: z.string().max(500, "Keep it under 500 characters").optional().default(""),
});
export type TaskFormValues = z.infer<typeof taskSchema>;

export const memberSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  role: z.enum(["admin", "viewer"]),
});
export type MemberFormValues = z.infer<typeof memberSchema>;
