CREATE TYPE "public"."role" AS ENUM('SUPER_ADMIN', 'ADMIN_DESA', 'EDITOR');--> statement-breakpoint
CREATE TYPE "public"."menu_location" AS ENUM('primary', 'footer', 'utility');--> statement-breakpoint
CREATE TYPE "public"."page_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."publish_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."official_group" AS ENUM('kepala_desa', 'sekretariat', 'kepala_urusan', 'kepala_seksi', 'kepala_dusun', 'bpd', 'lainnya');--> statement-breakpoint
CREATE TYPE "public"."tourism_category" AS ENUM('alam', 'budaya', 'buatan', 'religi', 'kuliner', 'lainnya');--> statement-breakpoint
CREATE TYPE "public"."umkm_category" AS ENUM('kuliner', 'kerajinan', 'pertanian', 'perikanan', 'jasa', 'perdagangan', 'lainnya');--> statement-breakpoint
CREATE TYPE "public"."document_category" AS ENUM('apbdes', 'pendapatan', 'belanja', 'realisasi', 'perdes', 'lpj', 'publik', 'lainnya');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('image', 'video', 'document', 'audio', 'other');--> statement-breakpoint
CREATE TYPE "public"."service_request_status" AS ENUM('submitted', 'in_review', 'need_revision', 'approved', 'rejected', 'completed');--> statement-breakpoint
CREATE TYPE "public"."kkt_role" AS ENUM('KOORDINATOR', 'SEKRETARIS', 'BENDAHARA', 'ANGGOTA');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(200) NOT NULL,
	"ip" "inet",
	"success" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"user_agent" text,
	"ip" "inet",
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"email" varchar(200) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'EDITOR' NOT NULL,
	"avatar" text,
	"phone" varchar(40),
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"namespace" varchar(60) NOT NULL,
	"key" varchar(120) NOT NULL,
	"value" jsonb,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feature_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(40) DEFAULT 'default' NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "footer_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(40) DEFAULT 'default' NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "footer_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "theme_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(40) DEFAULT 'default' NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "theme_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "village_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(40) DEFAULT 'default' NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "village_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_id" uuid NOT NULL,
	"parent_id" uuid,
	"label" varchar(160) NOT NULL,
	"url" varchar(400) DEFAULT '/' NOT NULL,
	"icon" varchar(60),
	"target" varchar(10) DEFAULT '_self' NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "menus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"location" "menu_location" DEFAULT 'primary' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "page_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"type" varchar(40) NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"settings" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"status" "page_status" DEFAULT 'draft' NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"show_in_menu" boolean DEFAULT false NOT NULL,
	"seo_title" varchar(200),
	"seo_description" text,
	"og_image" text,
	"published_at" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(260) NOT NULL,
	"slug" varchar(280) NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"attachment" text,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "announcements_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(260) NOT NULL,
	"slug" varchar(280) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"poster" text,
	"location" varchar(260),
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"is_all_day" boolean DEFAULT false NOT NULL,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "news" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(260) NOT NULL,
	"slug" varchar(280) NOT NULL,
	"excerpt" text,
	"content" text DEFAULT '' NOT NULL,
	"featured_image" text,
	"category_id" uuid,
	"author_id" uuid,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"tags" text[],
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "news_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"description" text,
	"color" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "government_officials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(180) NOT NULL,
	"position" varchar(180) NOT NULL,
	"group" "official_group" DEFAULT 'lainnya' NOT NULL,
	"photo" text,
	"nip" varchar(60),
	"bio" text,
	"period" varchar(60),
	"phone" varchar(40),
	"email" varchar(160),
	"reports_to_id" uuid,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "statistic_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(180) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"description" text,
	"chart_type" varchar(20) DEFAULT 'bar' NOT NULL,
	"unit" varchar(40),
	"year" integer,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "statistic_groups_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "village_statistics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"label" varchar(180) NOT NULL,
	"value" numeric DEFAULT '0' NOT NULL,
	"color" varchar(20),
	"icon" varchar(60),
	"meta" jsonb,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tourism" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(220) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" "tourism_category" DEFAULT 'alam' NOT NULL,
	"location" varchar(260),
	"latitude" varchar(40),
	"longitude" varchar(40),
	"cover_image" text,
	"gallery" jsonb DEFAULT '[]'::jsonb,
	"opening_hours" varchar(160),
	"ticket_price" varchar(120),
	"facilities" text[],
	"phone" varchar(40),
	"map_url" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tourism_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "umkm" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(220) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" "umkm_category" DEFAULT 'lainnya' NOT NULL,
	"owner" varchar(180),
	"products" text[],
	"image" text,
	"gallery" jsonb DEFAULT '[]'::jsonb,
	"phone" varchar(40),
	"whatsapp" varchar(40),
	"address" text,
	"map_url" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "umkm_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(260) NOT NULL,
	"description" text,
	"category" "document_category" DEFAULT 'publik' NOT NULL,
	"year" integer,
	"media_id" uuid,
	"file_url" text NOT NULL,
	"file_type" varchar(20),
	"file_size" bigint DEFAULT 0,
	"download_count" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "galleries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(220) NOT NULL,
	"description" text,
	"cover_image" text,
	"is_published" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "galleries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gallery_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"media_id" uuid,
	"image_url" text NOT NULL,
	"caption" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folder_id" uuid,
	"kind" "media_kind" DEFAULT 'image' NOT NULL,
	"filename" varchar(300) NOT NULL,
	"original_name" varchar(300) NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"extension" varchar(20),
	"size" bigint DEFAULT 0 NOT NULL,
	"width" integer,
	"height" integer,
	"storage_driver" varchar(20) DEFAULT 'local' NOT NULL,
	"storage_key" text NOT NULL,
	"url" text NOT NULL,
	"alt" varchar(300),
	"caption" text,
	"uploaded_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"ticket" varchar(24) NOT NULL,
	"applicant_name" varchar(200) NOT NULL,
	"applicant_nik" varchar(32),
	"applicant_phone" varchar(40) NOT NULL,
	"applicant_email" varchar(160),
	"form_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "service_request_status" DEFAULT 'submitted' NOT NULL,
	"note" text,
	"result_file_url" text,
	"handled_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_requests_ticket_unique" UNIQUE("ticket")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(220) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"icon" varchar(60),
	"requirements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"template_url" text,
	"form_schema" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"estimated_days" integer,
	"is_online" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kkt_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(180) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"description" text,
	"image" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kkt_fields_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kkt_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"photo" text,
	"student_id" varchar(40),
	"study_program" varchar(200),
	"faculty" varchar(200),
	"university" varchar(200),
	"role" "kkt_role" DEFAULT 'ANGGOTA' NOT NULL,
	"position" varchar(160),
	"field_id" uuid,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"instagram" varchar(200),
	"linkedin" varchar(200),
	"email" varchar(160),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kkt_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(40) DEFAULT 'default' NOT NULL,
	"program_name" varchar(200) DEFAULT 'Kuliah Kerja Terpadu (KKT)' NOT NULL,
	"university_name" varchar(200) DEFAULT '' NOT NULL,
	"faculty_name" varchar(200) DEFAULT '' NOT NULL,
	"year" varchar(12) DEFAULT '' NOT NULL,
	"period" varchar(120) DEFAULT '' NOT NULL,
	"post_name" varchar(160) DEFAULT '' NOT NULL,
	"location" varchar(200) DEFAULT '' NOT NULL,
	"village_name" varchar(200) DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"university_logo" text,
	"kkt_logo" text,
	"hero_image" text,
	"footer_credit" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kkt_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(60) NOT NULL,
	"entity" varchar(60) NOT NULL,
	"entity_id" varchar(60),
	"summary" text,
	"diff" jsonb,
	"ip" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "page_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" varchar(300) NOT NULL,
	"referrer" text,
	"session_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "news" ADD CONSTRAINT "news_category_id_news_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."news_categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "news" ADD CONSTRAINT "news_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "village_statistics" ADD CONSTRAINT "village_statistics_group_id_statistic_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."statistic_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_gallery_id_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."galleries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media" ADD CONSTRAINT "media_folder_id_media_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."media_folders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_handled_by_id_users_id_fk" FOREIGN KEY ("handled_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kkt_members" ADD CONSTRAINT "kkt_members_field_id_kkt_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."kkt_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "login_attempts_email_idx" ON "login_attempts" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "login_attempts_ip_idx" ON "login_attempts" USING btree ("ip");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "login_attempts_created_idx" ON "login_attempts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refresh_tokens_user_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "menu_items_menu_idx" ON "menu_items" USING btree ("menu_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "menu_items_parent_idx" ON "menu_items" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_sections_page_idx" ON "page_sections" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pages_slug_idx" ON "pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pages_status_idx" ON "pages" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "announcements_slug_idx" ON "announcements" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "announcements_status_idx" ON "announcements" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_slug_idx" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_start_idx" ON "events" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "news_slug_idx" ON "news" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "news_status_idx" ON "news" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "news_category_idx" ON "news" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "news_published_idx" ON "news" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "officials_group_idx" ON "government_officials" USING btree ("group");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "village_statistics_group_idx" ON "village_statistics" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tourism_category_idx" ON "tourism" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tourism_slug_idx" ON "tourism" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "umkm_category_idx" ON "umkm" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "umkm_slug_idx" ON "umkm" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_category_idx" ON "documents" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_year_idx" ON "documents" USING btree ("year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gallery_items_gallery_idx" ON "gallery_items" USING btree ("gallery_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_kind_idx" ON "media" USING btree ("kind");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_folder_idx" ON "media" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_created_idx" ON "media" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_requests_service_idx" ON "service_requests" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_requests_status_idx" ON "service_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_requests_ticket_idx" ON "service_requests" USING btree ("ticket");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_slug_idx" ON "services" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kkt_fields_order_idx" ON "kkt_fields" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kkt_members_role_idx" ON "kkt_members" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kkt_members_field_idx" ON "kkt_members" USING btree ("field_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_logs_user_idx" ON "activity_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_logs_entity_idx" ON "activity_logs" USING btree ("entity");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_logs_created_idx" ON "activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_views_path_idx" ON "page_views" USING btree ("path");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_views_created_idx" ON "page_views" USING btree ("created_at");