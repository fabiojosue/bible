CREATE TABLE "verse_save" (
	"user_id" text NOT NULL,
	"verse_key" text NOT NULL,
	"saved" boolean NOT NULL,
	"text" text NOT NULL,
	"translation" text NOT NULL,
	"updated_at" bigint NOT NULL,
	CONSTRAINT "verse_save_user_id_verse_key_pk" PRIMARY KEY("user_id","verse_key")
);
--> statement-breakpoint
ALTER TABLE "verse_save" ADD CONSTRAINT "verse_save_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;