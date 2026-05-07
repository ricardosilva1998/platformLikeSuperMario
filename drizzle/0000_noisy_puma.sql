CREATE TABLE IF NOT EXISTS "scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_name" varchar(16) NOT NULL,
	"level" varchar(16) NOT NULL,
	"time_ms" integer NOT NULL,
	"score" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scores_level_score_idx" ON "scores" USING btree ("level","score");