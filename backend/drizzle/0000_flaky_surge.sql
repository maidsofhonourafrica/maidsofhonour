CREATE TYPE "public"."admin_decision" AS ENUM('approved', 'rejected', 'request_clarification');--> statement-breakpoint
CREATE TYPE "public"."ai_recommendation" AS ENUM('approve', 'reject', 'manual_review');--> statement-breakpoint
CREATE TYPE "public"."certificate_type" AS ENUM('platform_verified', 'course_completion', 'skill_certification');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('draft', 'pending_signatures', 'active', 'expired', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('active', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."conversation_type" AS ENUM('client_search', 'sp_vetting', 'employer_verification', 'general_support');--> statement-breakpoint
CREATE TYPE "public"."course_status" AS ENUM('not_started', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."disbursement_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."disbursement_type" AS ENUM('escrow_release', 'monthly_payment', 'refund', 'other');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('pcc', 'medical_certificate', 'national_id', 'passport', 'educational_certificate', 'reference_letter', 'other');--> statement-breakpoint
CREATE TYPE "public"."escrow_status" AS ENUM('pending', 'held', 'released', 'refunded', 'partially_refunded');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('created', 'held', 'released', 'refunded', 'modified');--> statement-breakpoint
CREATE TYPE "public"."flag_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."grammar_quality" AS ENUM('authentic', 'suspicious', 'ai_generated');--> statement-breakpoint
CREATE TYPE "public"."interview_type" AS ENUM('initial', 'follow_up', 'psychometric');--> statement-breakpoint
CREATE TYPE "public"."issue_status" AS ENUM('open', 'investigating', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."issue_type" AS ENUM('payment_dispute', 'service_quality', 'misconduct', 'safety_concern', 'fraud', 'harassment', 'other');--> statement-breakpoint
CREATE TYPE "public"."language" AS ENUM('en', 'sw');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('sent', 'delivered', 'read', 'failed');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('text', 'template', 'interactive', 'button');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('payment_received', 'escrow_released', 'placement_request', 'vetting_completed', 'message_received', 'rating_received', 'course_assigned', 'certificate_issued', 'contract_ready', 'general');--> statement-breakpoint
CREATE TYPE "public"."placement_status" AS ENUM('ai_search', 'pending_acceptance', 'accepted', 'payment_pending', 'payment_received', 'in_progress', 'completed', 'cancelled', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."placement_type" AS ENUM('one_off', 'live_in');--> statement-breakpoint
CREATE TYPE "public"."preferred_sp_gender" AS ENUM('male', 'female', 'no_preference');--> statement-breakpoint
CREATE TYPE "public"."preferred_work_type" AS ENUM('live_in', 'live_out', 'both');--> statement-breakpoint
CREATE TYPE "public"."proficiency_level" AS ENUM('beginner', 'intermediate', 'expert');--> statement-breakpoint
CREATE TYPE "public"."rater_type" AS ENUM('client', 'service_provider');--> statement-breakpoint
CREATE TYPE "public"."recommendation_strength" AS ENUM('strong', 'moderate', 'weak', 'negative');--> statement-breakpoint
CREATE TYPE "public"."response_detail_level" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."review_decision" AS ENUM('approved', 'rejected', 'needs_more_info');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('registration_fee', 'placement_fee', 'other');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('pending', 'active', 'suspended', 'banned');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('client', 'service_provider', 'admin');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'sent', 'responded', 'expired', 'failed');--> statement-breakpoint
CREATE TYPE "public"."vetting_status" AS ENUM('incomplete', 'documents_pending', 'ai_interview_pending', 'employer_verification_pending', 'manual_review_pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."video_intro_status" AS ENUM('pending', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "admin_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(100),
	"resource_id" uuid,
	"changes" jsonb,
	"reason" text,
	"ip_address" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "certifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_provider_id" uuid NOT NULL,
	"certificate_type" "certificate_type" NOT NULL,
	"course_id" uuid,
	"certificate_number" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"certificate_pdf_url" text NOT NULL,
	"badge_image_url" text,
	"verification_code" varchar(50) NOT NULL,
	"public_verification_url" text,
	"issued_at" timestamp NOT NULL,
	"expires_at" timestamp,
	"revoked" boolean DEFAULT false,
	"revoked_at" timestamp,
	"revoked_reason" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "certifications_certificate_number_unique" UNIQUE("certificate_number"),
	CONSTRAINT "certifications_verification_code_unique" UNIQUE("verification_code")
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"gender" "gender",
	"phone_verified" boolean DEFAULT false,
	"email_verified" boolean DEFAULT false,
	"county" varchar(100) NOT NULL,
	"sub_county" varchar(100),
	"ward" varchar(100),
	"specific_location" text,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"family_size" integer,
	"children_count" integer,
	"children_ages" jsonb,
	"pets" boolean DEFAULT false,
	"pet_details" text,
	"preferred_sp_gender" "preferred_sp_gender",
	"preferred_languages" jsonb,
	"temperament_preference" text,
	"required_schedule" varchar(100),
	"special_requirements" text,
	"total_placements" integer DEFAULT 0,
	"active_placements" integer DEFAULT 0,
	"average_rating" numeric(3, 2),
	"total_ratings" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "clients_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "contract_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"template_html" text NOT NULL,
	"placement_type" varchar(20),
	"active" boolean DEFAULT true,
	"version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"placement_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"service_provider_id" uuid NOT NULL,
	"contract_template_id" uuid NOT NULL,
	"contract_html" text NOT NULL,
	"contract_pdf_url" text,
	"start_date" date NOT NULL,
	"end_date" date,
	"salary" numeric(10, 2),
	"terms" jsonb,
	"client_signed" boolean DEFAULT false,
	"client_signed_at" timestamp,
	"client_signature_data" text,
	"sp_signed" boolean DEFAULT false,
	"sp_signed_at" timestamp,
	"sp_signature_data" text,
	"status" "contract_status" DEFAULT 'draft',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "contracts_placement_id_unique" UNIQUE("placement_id")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"conversation_type" "conversation_type" NOT NULL,
	"thread_id" varchar(255) NOT NULL,
	"messages" jsonb NOT NULL,
	"placement_id" uuid,
	"service_provider_id" uuid,
	"status" "conversation_status" DEFAULT 'active',
	"language" "language" DEFAULT 'en',
	"started_at" timestamp DEFAULT now(),
	"last_message_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	CONSTRAINT "conversations_thread_id_unique" UNIQUE("thread_id")
);
--> statement-breakpoint
CREATE TABLE "course_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "course_status" DEFAULT 'not_started',
	"progress_percent" integer DEFAULT 0,
	"last_watched_position_seconds" integer DEFAULT 0,
	"total_watch_time_seconds" integer DEFAULT 0,
	"completed_at" timestamp,
	"passed" boolean,
	"score" integer,
	"enrolled_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "disbursements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_provider_id" uuid NOT NULL,
	"disbursement_type" "disbursement_type" NOT NULL,
	"placement_id" uuid,
	"escrow_transaction_id" uuid,
	"b2c_request_id" varchar(255) NOT NULL,
	"conversation_id" varchar(255),
	"sasapay_transaction_code" varchar(255),
	"third_party_transaction_code" varchar(255),
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'KES',
	"receiver_number" varchar(15) NOT NULL,
	"channel" varchar(10) DEFAULT '63902',
	"reason" text,
	"status" "disbursement_status" DEFAULT 'pending',
	"result_code" varchar(10),
	"result_desc" text,
	"callback_received_at" timestamp,
	"callback_data" jsonb,
	"initiated_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "disbursements_b2c_request_id_unique" UNIQUE("b2c_request_id")
);
--> statement-breakpoint
CREATE TABLE "escrow_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escrow_transaction_id" uuid NOT NULL,
	"event_type" "event_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"balance_before" numeric(10, 2),
	"balance_after" numeric(10, 2),
	"performed_by" uuid,
	"reason" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "escrow_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"placement_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"service_provider_id" uuid NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"platform_commission" numeric(10, 2) NOT NULL,
	"sp_payout" numeric(10, 2) NOT NULL,
	"payment_transaction_id" uuid,
	"payment_received_at" timestamp,
	"status" "escrow_status" DEFAULT 'pending',
	"held_at" timestamp,
	"release_transaction_id" uuid,
	"released_at" timestamp,
	"released_by" uuid,
	"release_reason" text,
	"refund_transaction_id" uuid,
	"refunded_at" timestamp,
	"refunded_by" uuid,
	"refund_amount" numeric(10, 2),
	"refund_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "escrow_transactions_placement_id_unique" UNIQUE("placement_id")
);
--> statement-breakpoint
CREATE TABLE "former_employer_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_provider_id" uuid NOT NULL,
	"employer_name" varchar(200) NOT NULL,
	"employer_phone" varchar(15) NOT NULL,
	"employer_email" varchar(255),
	"relationship" varchar(100),
	"employment_duration_months" integer,
	"employment_start_date" date,
	"employment_end_date" date,
	"verification_link" varchar(500),
	"whatsapp_message_id" varchar(255),
	"link_sent_at" timestamp,
	"link_expires_at" timestamp,
	"reminder_sent_count" integer DEFAULT 0,
	"last_reminder_sent_at" timestamp,
	"conversation_window_started_at" timestamp,
	"last_employer_message_at" timestamp,
	"conversation_window_active" boolean DEFAULT false,
	"responded" boolean DEFAULT false,
	"responded_at" timestamp,
	"conversation_id" varchar(255),
	"responses" jsonb,
	"full_transcript" text,
	"status" "verification_status" DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "former_employer_verifications_verification_link_unique" UNIQUE("verification_link")
);
--> statement-breakpoint
CREATE TABLE "issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"reporter_type" "user_type" NOT NULL,
	"placement_id" uuid,
	"reported_user_id" uuid,
	"issue_type" "issue_type" NOT NULL,
	"severity" "flag_severity" DEFAULT 'medium',
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"evidence_urls" jsonb,
	"status" "issue_status" DEFAULT 'open',
	"assigned_to" uuid,
	"resolution_notes" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kyc_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_provider_id" uuid NOT NULL,
	"document_type" "document_type" NOT NULL,
	"file_url" text NOT NULL,
	"file_key" text NOT NULL,
	"file_name" varchar(255),
	"file_size" integer,
	"mime_type" varchar(100),
	"verified" boolean DEFAULT false,
	"verified_at" timestamp,
	"verified_by" uuid,
	"verification_notes" text,
	"issued_date" date,
	"expiry_date" date,
	"uploaded_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"placement_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"message_text" text NOT NULL,
	"attachment_urls" jsonb,
	"contains_contact_info" boolean DEFAULT false,
	"contact_warning_shown" boolean DEFAULT false,
	"read" boolean DEFAULT false,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"deleted_by_sender" boolean DEFAULT false,
	"deleted_by_recipient" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"sent_via_email" boolean DEFAULT false,
	"sent_via_sms" boolean DEFAULT false,
	"sent_via_push" boolean DEFAULT false,
	"sent_via_in_app" boolean DEFAULT true,
	"related_placement_id" uuid,
	"related_transaction_id" uuid,
	"action_url" text,
	"data" jsonb,
	"read" boolean DEFAULT false,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "placements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"service_provider_id" uuid,
	"service_category_id" uuid NOT NULL,
	"placement_type" "placement_type" NOT NULL,
	"duration_months" integer,
	"start_date" date,
	"end_date" date,
	"monthly_salary" numeric(10, 2),
	"service_date" date,
	"estimated_hours" numeric(5, 2),
	"total_fee" numeric(10, 2) NOT NULL,
	"platform_commission" numeric(10, 2),
	"sp_payout" numeric(10, 2),
	"status" "placement_status" DEFAULT 'ai_search',
	"contract_id" uuid,
	"contract_signed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"accepted_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"cancelled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"placement_id" uuid NOT NULL,
	"rater_id" uuid NOT NULL,
	"ratee_id" uuid NOT NULL,
	"rater_type" "rater_type" NOT NULL,
	"rating" integer NOT NULL,
	"review_text" text,
	"punctuality_rating" integer,
	"quality_rating" integer,
	"communication_rating" integer,
	"professionalism_rating" integer,
	"flagged" boolean DEFAULT false,
	"flagged_reason" text,
	"visible" boolean DEFAULT true,
	"response_text" text,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_sw" varchar(100),
	"description" text,
	"icon_url" text,
	"active" boolean DEFAULT true,
	"display_order" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "service_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "service_provider_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_provider_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"experience_years" integer,
	"proficiency_level" "proficiency_level",
	"certified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"last_name" varchar(100) NOT NULL,
	"date_of_birth" date NOT NULL,
	"gender" "gender",
	"national_id" varchar(50) NOT NULL,
	"county" varchar(100) NOT NULL,
	"sub_county" varchar(100),
	"ward" varchar(100),
	"specific_location" text,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"bio" text,
	"years_of_experience" integer,
	"languages_spoken" jsonb,
	"education_level" varchar(100),
	"willing_to_relocate" boolean DEFAULT false,
	"preferred_work_type" "preferred_work_type",
	"children_count" integer,
	"marital_status" varchar(50),
	"profile_photo_url" text,
	"video_intro_url" text,
	"video_intro_asset_id" varchar(255),
	"video_intro_status" "video_intro_status",
	"video_intro_uploaded_at" timestamp,
	"video_script" text,
	"vetting_status" "vetting_status" DEFAULT 'incomplete',
	"vetting_completed_at" timestamp,
	"vetting_notes" text,
	"available_for_placement" boolean DEFAULT false,
	"currently_placed" boolean DEFAULT false,
	"total_placements" integer DEFAULT 0,
	"successful_placements" integer DEFAULT 0,
	"average_rating" numeric(3, 2),
	"total_ratings" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"approved_at" timestamp,
	"approved_by" uuid,
	CONSTRAINT "service_providers_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "service_providers_national_id_unique" UNIQUE("national_id")
);
--> statement-breakpoint
CREATE TABLE "training_courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"title_sw" varchar(255),
	"description" text,
	"description_sw" text,
	"thumbnail_url" text,
	"video_url" text,
	"video_asset_id" varchar(255),
	"duration_minutes" integer,
	"category_id" uuid,
	"difficulty" "difficulty",
	"prerequisites" jsonb,
	"required_for_approval" boolean DEFAULT false,
	"published" boolean DEFAULT false,
	"display_order" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"client_id" uuid,
	"transaction_type" "transaction_type" NOT NULL,
	"placement_id" uuid,
	"checkout_request_id" varchar(255) NOT NULL,
	"merchant_request_id" varchar(255),
	"sasapay_transaction_id" varchar(255),
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'KES',
	"phone_number" varchar(15) NOT NULL,
	"network_code" varchar(10) NOT NULL,
	"status" "transaction_status" DEFAULT 'pending',
	"result_code" varchar(10),
	"result_desc" text,
	"callback_received_at" timestamp,
	"callback_data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "transactions_checkout_request_id_unique" UNIQUE("checkout_request_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text,
	"phone_number" varchar(15) NOT NULL,
	"user_type" "user_type" NOT NULL,
	"phone_verified" boolean DEFAULT false,
	"registration_fee_paid" boolean DEFAULT false,
	"registration_fee_amount" numeric(10, 2),
	"registration_fee_transaction_id" uuid,
	"registration_completed_at" timestamp,
	"status" "user_status" DEFAULT 'pending',
	"preferred_language" "language" DEFAULT 'en',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "verification_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"verification_id" uuid NOT NULL,
	"service_provider_id" uuid NOT NULL,
	"employment_confirmed" boolean,
	"employment_period_matches" boolean,
	"role_matches_claim" boolean,
	"salary_matches_claim" boolean,
	"conduct_rating" integer,
	"skill_rating" integer,
	"attitude_rating" integer,
	"overall_rating" integer,
	"would_rehire" boolean,
	"would_recommend" boolean,
	"recommendation_strength" "recommendation_strength",
	"sentiment_score" numeric(3, 2),
	"confidence_score" numeric(3, 2),
	"grammar_quality" "grammar_quality",
	"response_detail_level" "response_detail_level",
	"specific_examples_provided" boolean,
	"inconsistencies" jsonb,
	"red_flags" jsonb,
	"green_flags" jsonb,
	"flagged_for_review" boolean DEFAULT false,
	"flagged_reason" text,
	"flag_severity" "flag_severity",
	"reviewed" boolean DEFAULT false,
	"reviewed_at" timestamp,
	"reviewed_by" uuid,
	"reviewer_notes" text,
	"review_decision" "review_decision",
	"follow_up_call_completed" boolean DEFAULT false,
	"call_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vetting_ai_interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_provider_id" uuid NOT NULL,
	"interview_type" "interview_type",
	"conversation_id" varchar(255),
	"questions_asked" jsonb,
	"responses" jsonb,
	"sentiment_score" numeric(3, 2),
	"red_flags" jsonb,
	"ai_recommendation" "ai_recommendation",
	"ai_confidence" numeric(3, 2),
	"reviewed" boolean DEFAULT false,
	"reviewed_at" timestamp,
	"reviewed_by" uuid,
	"admin_decision" "admin_decision",
	"admin_notes" text,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"duration_seconds" integer
);
--> statement-breakpoint
CREATE TABLE "webhook_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"endpoint" varchar(255) NOT NULL,
	"method" varchar(10) DEFAULT 'POST',
	"headers" jsonb,
	"body" jsonb NOT NULL,
	"checkout_request_id" varchar(255),
	"b2c_request_id" varchar(255),
	"processed" boolean DEFAULT false,
	"processed_at" timestamp,
	"processing_error" text,
	"idempotency_key" varchar(255),
	"duplicate_of" uuid,
	"ip_address" text,
	"user_agent" text,
	"received_at" timestamp DEFAULT now(),
	CONSTRAINT "webhook_logs_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" varchar(255) NOT NULL,
	"wamid" varchar(255),
	"from_number" varchar(15) NOT NULL,
	"to_number" varchar(15) NOT NULL,
	"message_type" "message_type" NOT NULL,
	"message_body" text,
	"template_name" varchar(100),
	"template_language" varchar(10),
	"verification_id" uuid,
	"status" "message_status" DEFAULT 'sent',
	"error_code" varchar(50),
	"error_message" text,
	"sent_at" timestamp DEFAULT now(),
	"delivered_at" timestamp,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "whatsapp_messages_message_id_unique" UNIQUE("message_id")
);
--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_service_provider_id_service_providers_id_fk" FOREIGN KEY ("service_provider_id") REFERENCES "public"."service_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_course_id_training_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."training_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_service_provider_id_service_providers_id_fk" FOREIGN KEY ("service_provider_id") REFERENCES "public"."service_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_contract_template_id_contract_templates_id_fk" FOREIGN KEY ("contract_template_id") REFERENCES "public"."contract_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_placement_id_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."placements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_service_provider_id_service_providers_id_fk" FOREIGN KEY ("service_provider_id") REFERENCES "public"."service_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_training_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."training_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_service_provider_id_service_providers_id_fk" FOREIGN KEY ("service_provider_id") REFERENCES "public"."service_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_placement_id_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."placements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_initiated_by_users_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_ledger" ADD CONSTRAINT "escrow_ledger_escrow_transaction_id_escrow_transactions_id_fk" FOREIGN KEY ("escrow_transaction_id") REFERENCES "public"."escrow_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_ledger" ADD CONSTRAINT "escrow_ledger_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_placement_id_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."placements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_service_provider_id_service_providers_id_fk" FOREIGN KEY ("service_provider_id") REFERENCES "public"."service_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_payment_transaction_id_transactions_id_fk" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_release_transaction_id_disbursements_id_fk" FOREIGN KEY ("release_transaction_id") REFERENCES "public"."disbursements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_released_by_users_id_fk" FOREIGN KEY ("released_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_refund_transaction_id_disbursements_id_fk" FOREIGN KEY ("refund_transaction_id") REFERENCES "public"."disbursements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_refunded_by_users_id_fk" FOREIGN KEY ("refunded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "former_employer_verifications" ADD CONSTRAINT "former_employer_verifications_service_provider_id_service_providers_id_fk" FOREIGN KEY ("service_provider_id") REFERENCES "public"."service_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_placement_id_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."placements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_reported_user_id_users_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_service_provider_id_service_providers_id_fk" FOREIGN KEY ("service_provider_id") REFERENCES "public"."service_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_placement_id_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."placements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_placement_id_placements_id_fk" FOREIGN KEY ("related_placement_id") REFERENCES "public"."placements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_transaction_id_transactions_id_fk" FOREIGN KEY ("related_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_service_provider_id_service_providers_id_fk" FOREIGN KEY ("service_provider_id") REFERENCES "public"."service_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_service_category_id_service_categories_id_fk" FOREIGN KEY ("service_category_id") REFERENCES "public"."service_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_placement_id_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."placements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_rater_id_users_id_fk" FOREIGN KEY ("rater_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_ratee_id_users_id_fk" FOREIGN KEY ("ratee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_provider_skills" ADD CONSTRAINT "service_provider_skills_service_provider_id_service_providers_id_fk" FOREIGN KEY ("service_provider_id") REFERENCES "public"."service_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_provider_skills" ADD CONSTRAINT "service_provider_skills_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_providers" ADD CONSTRAINT "service_providers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_providers" ADD CONSTRAINT "service_providers_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_courses" ADD CONSTRAINT "training_courses_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_placement_id_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."placements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_assessments" ADD CONSTRAINT "verification_assessments_verification_id_former_employer_verifications_id_fk" FOREIGN KEY ("verification_id") REFERENCES "public"."former_employer_verifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_assessments" ADD CONSTRAINT "verification_assessments_service_provider_id_service_providers_id_fk" FOREIGN KEY ("service_provider_id") REFERENCES "public"."service_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_assessments" ADD CONSTRAINT "verification_assessments_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vetting_ai_interviews" ADD CONSTRAINT "vetting_ai_interviews_service_provider_id_service_providers_id_fk" FOREIGN KEY ("service_provider_id") REFERENCES "public"."service_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vetting_ai_interviews" ADD CONSTRAINT "vetting_ai_interviews_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_duplicate_of_webhook_logs_id_fk" FOREIGN KEY ("duplicate_of") REFERENCES "public"."webhook_logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_verification_id_former_employer_verifications_id_fk" FOREIGN KEY ("verification_id") REFERENCES "public"."former_employer_verifications"("id") ON DELETE no action ON UPDATE no action;