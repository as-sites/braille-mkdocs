CREATE TABLE "user_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_invites" ADD CONSTRAINT "user_invites_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_invites" ADD CONSTRAINT "user_invites_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "user_invites_user_id_idx" ON "user_invites" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "user_invites_expires_at_idx" ON "user_invites" USING btree ("expires_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "user_invites_active_email_unique" ON "user_invites" USING btree ("email") WHERE "user_invites"."accepted_at" is null and "user_invites"."revoked_at" is null;