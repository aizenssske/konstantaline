CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"role" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"monthly_salary" numeric(16, 2) NOT NULL,
	"hired_at" date DEFAULT current_date NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employees_monthly_salary_check" CHECK ("employees"."monthly_salary" > 0),
	CONSTRAINT "employees_monthly_salary_max_check" CHECK ("employees"."monthly_salary" <= 100000000000)
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"expense_date" date DEFAULT current_date NOT NULL,
	"amount" numeric(16, 2) NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_amount_check" CHECK ("expenses"."amount" > 0),
	CONSTRAINT "expenses_amount_max_check" CHECK ("expenses"."amount" <= 100000000000)
);
--> statement-breakpoint
CREATE TABLE "salary_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"payment_date" date DEFAULT current_date NOT NULL,
	"salary_month" text NOT NULL,
	"amount" numeric(16, 2) NOT NULL,
	"payment_type" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "salary_payments_amount_check" CHECK ("salary_payments"."amount" > 0),
	CONSTRAINT "salary_payments_amount_max_check" CHECK ("salary_payments"."amount" <= 100000000000),
	CONSTRAINT "salary_payments_salary_month_check" CHECK ("salary_payments"."salary_month" ~ '^[0-9]{4}-[0-9]{2}$'),
	CONSTRAINT "salary_payments_payment_type_check" CHECK ("salary_payments"."payment_type" in ('advance', 'salary', 'bonus', 'deduction'))
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"sale_date" date DEFAULT current_date NOT NULL,
	"cash_amount" numeric(16, 2) DEFAULT 0 NOT NULL,
	"card_amount" numeric(16, 2) DEFAULT 0 NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sales_cash_amount_check" CHECK ("sales"."cash_amount" >= 0),
	CONSTRAINT "sales_card_amount_check" CHECK ("sales"."card_amount" >= 0),
	CONSTRAINT "sales_total_positive_check" CHECK ("sales"."cash_amount" + "sales"."card_amount" > 0),
	CONSTRAINT "sales_cash_amount_max_check" CHECK ("sales"."cash_amount" <= 100000000000),
	CONSTRAINT "sales_card_amount_max_check" CHECK ("sales"."card_amount" <= 100000000000)
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_payments" ADD CONSTRAINT "salary_payments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_payments" ADD CONSTRAINT "salary_payments_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employees_shop_active_idx" ON "employees" USING btree ("shop_id","is_active");--> statement-breakpoint
CREATE INDEX "expenses_shop_date_idx" ON "expenses" USING btree ("shop_id","expense_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "salary_payments_shop_month_idx" ON "salary_payments" USING btree ("shop_id","salary_month");--> statement-breakpoint
CREATE INDEX "salary_payments_employee_idx" ON "salary_payments" USING btree ("employee_id","payment_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "sales_shop_date_idx" ON "sales" USING btree ("shop_id","sale_date" DESC NULLS LAST);--> statement-breakpoint
CREATE OR REPLACE FUNCTION "public"."set_updated_at"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."updated_at" = now();
  RETURN NEW;
END;
$$;--> statement-breakpoint
DROP TRIGGER IF EXISTS "shops_updated_at" ON "public"."shops";--> statement-breakpoint
CREATE TRIGGER "shops_updated_at" BEFORE UPDATE ON "public"."shops" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();--> statement-breakpoint
DROP TRIGGER IF EXISTS "sales_updated_at" ON "public"."sales";--> statement-breakpoint
CREATE TRIGGER "sales_updated_at" BEFORE UPDATE ON "public"."sales" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();--> statement-breakpoint
DROP TRIGGER IF EXISTS "expenses_updated_at" ON "public"."expenses";--> statement-breakpoint
CREATE TRIGGER "expenses_updated_at" BEFORE UPDATE ON "public"."expenses" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();--> statement-breakpoint
DROP TRIGGER IF EXISTS "employees_updated_at" ON "public"."employees";--> statement-breakpoint
CREATE TRIGGER "employees_updated_at" BEFORE UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();--> statement-breakpoint
DROP TRIGGER IF EXISTS "salary_payments_updated_at" ON "public"."salary_payments";--> statement-breakpoint
CREATE TRIGGER "salary_payments_updated_at" BEFORE UPDATE ON "public"."salary_payments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();--> statement-breakpoint
INSERT INTO "shops" ("name", "address")
SELECT '1-do‘kon', ''
WHERE NOT EXISTS (SELECT 1 FROM "shops");--> statement-breakpoint
INSERT INTO "shops" ("name", "address")
SELECT '2-do‘kon', ''
WHERE (SELECT count(*) FROM "shops") = 1;