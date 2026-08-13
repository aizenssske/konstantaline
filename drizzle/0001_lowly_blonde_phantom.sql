CREATE TABLE "telegram_link_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"telegram_id" bigint NOT NULL,
	"username" text DEFAULT '' NOT NULL,
	"first_name" text DEFAULT '' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_link_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "telegram_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telegram_id" bigint NOT NULL,
	"username" text DEFAULT '' NOT NULL,
	"first_name" text DEFAULT '' NOT NULL,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_links_telegram_id_unique" UNIQUE("telegram_id")
);
--> statement-breakpoint
CREATE INDEX "telegram_link_codes_telegram_idx" ON "telegram_link_codes" USING btree ("telegram_id");--> statement-breakpoint
CREATE INDEX "telegram_link_codes_expires_idx" ON "telegram_link_codes" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "telegram_links_telegram_id_idx" ON "telegram_links" USING btree ("telegram_id");