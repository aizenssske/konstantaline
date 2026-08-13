import { z } from "zod";

const money = z.coerce.number().finite().min(0).max(100_000_000_000);
const requiredMoney = z.coerce.number().finite().positive().max(100_000_000_000);

export const shopSchema = z.object({
  name: z.string().trim().min(2).max(80),
  address: z.string().trim().max(200).default(""),
});

export const saleSchema = z
  .object({
    shop_id: z.string().min(1),
    sale_date: z.string().date(),
    cash_amount: money,
    card_amount: money,
    description: z.string().trim().max(500).default(""),
  })
  .refine((data) => data.cash_amount + data.card_amount > 0, {
    message: "Naqd yoki plastik savdo summasini kiriting",
  });

export const expenseSchema = z.object({
  shop_id: z.string().min(1),
  expense_date: z.string().date(),
  amount: requiredMoney,
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().min(2).max(500),
});

export const employeeSchema = z.object({
  shop_id: z.string().min(1),
  full_name: z.string().trim().min(3).max(100),
  role: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(30).default(""),
  monthly_salary: requiredMoney,
  hired_at: z.string().date(),
});

export const telegramLinkCodeRequestSchema = z.object({
  telegram_id: z.coerce.number().int().positive(),
  username: z.string().trim().max(64).default(""),
  first_name: z.string().trim().max(100).default(""),
});

export const telegramLinkRedeemSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Kod 6 xonali bo‘lishi kerak"),
});

export const salaryPaymentSchema = z.object({
  employee_id: z.string().min(1),
  shop_id: z.string().min(1),
  payment_date: z.string().date(),
  salary_month: z.string().regex(/^\d{4}-\d{2}$/),
  amount: requiredMoney,
  payment_type: z.enum(["advance", "salary", "bonus", "deduction"]),
  description: z.string().trim().max(500).default(""),
});
