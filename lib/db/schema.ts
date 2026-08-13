import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { PaymentType } from "../types";

const money = (name: string) => numeric(name, { precision: 16, scale: 2, mode: "number" });

const timestamps = {
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date().toISOString()),
};

export const shops = pgTable("shops", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull().default(""),
  is_active: boolean("is_active").notNull().default(true),
  ...timestamps,
});

export const sales = pgTable(
  "sales",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shop_id: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "restrict" }),
    sale_date: date("sale_date", { mode: "string" }).notNull().default(sql`current_date`),
    cash_amount: money("cash_amount").notNull().default(0),
    card_amount: money("card_amount").notNull().default(0),
    description: text("description").notNull().default(""),
    ...timestamps,
  },
  (table) => [
    check("sales_cash_amount_check", sql`${table.cash_amount} >= 0`),
    check("sales_card_amount_check", sql`${table.card_amount} >= 0`),
    check("sales_total_positive_check", sql`${table.cash_amount} + ${table.card_amount} > 0`),
    check("sales_cash_amount_max_check", sql`${table.cash_amount} <= 100000000000`),
    check("sales_card_amount_max_check", sql`${table.card_amount} <= 100000000000`),
    index("sales_shop_date_idx").on(table.shop_id, table.sale_date.desc()),
  ],
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shop_id: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "restrict" }),
    expense_date: date("expense_date", { mode: "string" }).notNull().default(sql`current_date`),
    amount: money("amount").notNull(),
    category: text("category").notNull(),
    description: text("description").notNull(),
    ...timestamps,
  },
  (table) => [
    check("expenses_amount_check", sql`${table.amount} > 0`),
    check("expenses_amount_max_check", sql`${table.amount} <= 100000000000`),
    index("expenses_shop_date_idx").on(table.shop_id, table.expense_date.desc()),
  ],
);

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shop_id: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "restrict" }),
    full_name: text("full_name").notNull(),
    role: text("role").notNull(),
    phone: text("phone").notNull().default(""),
    monthly_salary: money("monthly_salary").notNull(),
    hired_at: date("hired_at", { mode: "string" }).notNull().default(sql`current_date`),
    is_active: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    check("employees_monthly_salary_check", sql`${table.monthly_salary} > 0`),
    check("employees_monthly_salary_max_check", sql`${table.monthly_salary} <= 100000000000`),
    index("employees_shop_active_idx").on(table.shop_id, table.is_active),
  ],
);

export const salaryPayments = pgTable(
  "salary_payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employee_id: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "restrict" }),
    shop_id: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "restrict" }),
    payment_date: date("payment_date", { mode: "string" }).notNull().default(sql`current_date`),
    salary_month: text("salary_month").notNull(),
    amount: money("amount").notNull(),
    payment_type: text("payment_type").$type<PaymentType>().notNull(),
    description: text("description").notNull().default(""),
    ...timestamps,
  },
  (table) => [
    check("salary_payments_amount_check", sql`${table.amount} > 0`),
    check("salary_payments_amount_max_check", sql`${table.amount} <= 100000000000`),
    check("salary_payments_salary_month_check", sql`${table.salary_month} ~ '^[0-9]{4}-[0-9]{2}$'`),
    check(
      "salary_payments_payment_type_check",
      sql`${table.payment_type} in ('advance', 'salary', 'bonus', 'deduction')`,
    ),
    index("salary_payments_shop_month_idx").on(table.shop_id, table.salary_month),
    index("salary_payments_employee_idx").on(table.employee_id, table.payment_date.desc()),
  ],
);

export const telegramLinks = pgTable(
  "telegram_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    telegram_id: bigint("telegram_id", { mode: "number" }).notNull().unique(),
    username: text("username").notNull().default(""),
    first_name: text("first_name").notNull().default(""),
    linked_at: timestamp("linked_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [index("telegram_links_telegram_id_idx").on(table.telegram_id)],
);

export const telegramLinkCodes = pgTable(
  "telegram_link_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull().unique(),
    telegram_id: bigint("telegram_id", { mode: "number" }).notNull(),
    username: text("username").notNull().default(""),
    first_name: text("first_name").notNull().default(""),
    expires_at: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
    used_at: timestamp("used_at", { withTimezone: true, mode: "string" }),
    ...timestamps,
  },
  (table) => [
    index("telegram_link_codes_telegram_idx").on(table.telegram_id),
    index("telegram_link_codes_expires_idx").on(table.expires_at),
  ],
);

export const schema = {
  shops,
  sales,
  expenses,
  employees,
  salaryPayments,
  telegramLinks,
  telegramLinkCodes,
};
