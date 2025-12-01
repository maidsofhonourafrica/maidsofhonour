  import { pgTable, text, varchar, boolean, timestamp, integer, decimal, date, jsonb, pgEnum, uuid, check, unique } from "drizzle-orm/pg-core";
  import { sql, relations } from "drizzle-orm";

  // ===== ENUMS =====

  export const userTypeEnum = pgEnum("user_type", ["client", "service_provider", "admin"]);
  export const userStatusEnum = pgEnum("user_status", ["pending", "active", "suspended", "banned"]);
  export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
  export const languageEnum = pgEnum("language", ["en", "sw"]);
  export const preferredWorkTypeEnum = pgEnum("preferred_work_type", ["live_in", "live_out", "both"]);
  export const videoIntroStatusEnum = pgEnum("video_intro_status", ["pending", "processing", "ready", "failed"]);
  export const videoStatusEnum = pgEnum("video_status", ["uploaded", "processing", "ready", "failed"]);
  export const videoTypeEnum = pgEnum("video_type", ["self_introduction", "work_experience", "skills_demo", "other"]);
  export const vettingStatusEnum = pgEnum("vetting_status", [
    "incomplete",
    "documents_pending",
    "ai_interview_pending",
    "employer_verification_pending",
    "manual_review_pending",
    "approved",
    "rejected"
  ]);
  export const proficiencyLevelEnum = pgEnum("proficiency_level", ["beginner", "intermediate", "expert"]);
  export const documentTypeEnum = pgEnum("document_type", [
    "pcc",
    "medical_certificate",
    "national_id",
    "passport",
    "educational_certificate",
    "reference_letter",
    "first_aid_cert",
    "baby_care_cert",
    "other"
  ]);
  export const vettingStepStatusEnum = pgEnum("vetting_step_status", ["not_started", "in_progress", "completed", "skipped", "failed"]);
  export const applicableToEnum = pgEnum("applicable_to", ["service_provider", "client", "both"]);
  export const verificationStatusEnum = pgEnum("verification_status", ["pending", "sent", "responded", "expired", "failed"]);
  export const recommendationStrengthEnum = pgEnum("recommendation_strength", ["strong", "moderate", "weak", "negative"]);
  export const difficultyEnum = pgEnum("difficulty", ["beginner", "intermediate", "advanced"]);
  export const courseStatusEnum = pgEnum("course_status", ["not_started", "in_progress", "completed"]);
  export const materialTypeEnum = pgEnum("material_type", ["video", "text", "assessment"]);
  export const conversationStatusEnum = pgEnum("conversation_status", ["active", "completed", "abandoned"]);
  export const conversationTypeEnum = pgEnum("conversation_type", [
    "client_search",
    "sp_vetting",
    "sp_work_history",
    "employer_verification",
    "general_support"
  ]);
  export const placementTypeEnum = pgEnum("placement_type", ["one_off", "live_in"]);
  export const placementStatusEnum = pgEnum("placement_status", [
    "ai_search",
    "pending_sp_acceptance",
    "accepted",
    "payment_pending",
    "payment_received",
    "final_vetting",
    "in_progress",
    "completed",
    "cancelled",
    "disputed"
  ]);
  export const contractStatusEnum = pgEnum("contract_status", [
    "draft",
    "pending_signatures",
    "pending_admin_approval",
    "active",
    "expired",
    "terminated"
  ]);
  export const registrationFeeStatusEnum = pgEnum("registration_fee_status", ["pending", "paid", "failed"]);
  export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "expired", "cancelled", "paused"]);
  export const subscriptionPaymentStatusEnum = pgEnum("subscription_payment_status", ["pending", "paid", "overdue", "failed"]);
  export const spPayoutStatusEnum = pgEnum("sp_payout_status", ["pending", "requested", "processing", "paid", "failed"]);
  export const paymentNetworkEnum = pgEnum("payment_network", ["mpesa", "airtel", "t_kash", "bank"]);
  export const transactionTypeEnum = pgEnum("transaction_type", ["registration_fee", "placement_fee", "subscription_payment", "other"]);
  export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "processing", "completed", "failed", "cancelled"]);
  export const disbursementTypeEnum = pgEnum("disbursement_type", ["escrow_release", "monthly_payment", "refund", "payout", "other"]);
  export const disbursementStatusEnum = pgEnum("disbursement_status", ["pending", "processing", "completed", "failed"]);
  export const escrowStatusEnum = pgEnum("escrow_status", ["pending", "held", "released", "refunded", "partially_refunded"]);
  export const eventTypeEnum = pgEnum("event_type", ["created", "held", "released", "refunded", "modified"]);
  export const preferredSpGenderEnum = pgEnum("preferred_sp_gender", ["male", "female", "no_preference"]);
  export const messageTypeEnum = pgEnum("message_type", ["text", "template", "interactive", "button"]);
  export const messageStatusEnum = pgEnum("message_status", ["sent", "delivered", "read", "failed"]);
  export const notificationTypeEnum = pgEnum("notification_type", [
    "payment_received",
    "payment_reminder",
    "escrow_released",
    "placement_request",
    "placement_accepted",
    "vetting_completed",
    "message_received",
    "rating_received",
    "course_assigned",
    "certificate_issued",
    "contract_ready",
    "progress_update_request",
    "general"
  ]);
  export const automatedMessageTypeEnum = pgEnum("automated_message_type", [
    "payment_reminder",
    "progress_update_request",
    "renewal_reminder",
    "verification_reminder",
    "other"
  ]);
  export const scheduleTypeEnum = pgEnum("schedule_type", ["monthly", "bi_monthly", "weekly", "daily", "custom"]);
  export const targetUserTypeEnum = pgEnum("target_user_type", ["client", "service_provider", "both"]);
  export const raterTypeEnum = pgEnum("rater_type", ["client", "service_provider"]);
  export const moderationStatusEnum = pgEnum("moderation_status", ["pending", "approved", "rejected", "flagged"]);
  export const complaintTypeEnum = pgEnum("complaint_type", [
    "payment_dispute",
    "service_quality",
    "misconduct",
    "safety_concern",
    "fraud",
    "harassment",
    "other"
  ]);
  export const severityEnum = pgEnum("severity", ["low", "medium", "high", "critical"]);
  export const complaintStatusEnum = pgEnum("complaint_status", ["open", "investigating", "resolved", "closed"]);
  export const certificateTypeEnum = pgEnum("certificate_type", ["platform_verified", "course_completion", "skill_certification"]);
  export const contactTypeEnum = pgEnum("contact_type", ["phone", "email", "both"]);
  export const detectionMethodEnum = pgEnum("detection_method", ["llm", "regex", "both"]);
  export const actionTakenEnum = pgEnum("action_taken", ["flagged", "blocked", "warned", "none"]);
  export const contentTypeEnum = pgEnum("content_type", ["message", "rating", "comment"]);
  export const dataTypeEnum = pgEnum("data_type", ["string", "number", "boolean", "json"]);
  export const appPlatformEnum = pgEnum("app_platform", ["android", "ios", "web"]);
  export const appStatusEnum = pgEnum("app_status", ["active", "deprecated", "sunset"]);
  export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);
  export const payoutRequestStatusEnum = pgEnum("payout_request_status", ["pending", "approved", "rejected", "processed"]);

  // ===== CORE USER TABLES =====

  export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: text("password"), // Nullable for OAuth
    phoneNumber: varchar("phone_number", { length: 15 }).notNull().unique(),
    userType: userTypeEnum("user_type").notNull(),
    phoneVerified: boolean("phone_verified").default(false),
    registrationFeePaid: boolean("registration_fee_paid").default(false),
    registrationFeeAmount: decimal("registration_fee_amount", { precision: 10, scale: 2 }),
    registrationFeeTransactionId: uuid("registration_fee_transaction_id"),
    registrationCompletedAt: timestamp("registration_completed_at"),
    status: userStatusEnum("status").default("pending"),
    preferredLanguage: languageEnum("preferred_language").default("en"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  // ===== SERVICE PROVIDER TABLES =====

  export const serviceProviders = pgTable("service_providers", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id).unique(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    middleName: varchar("middle_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    dateOfBirth: date("date_of_birth").notNull(),
    gender: genderEnum("gender"),
    nationalId: varchar("national_id", { length: 50 }).notNull().unique(),
    county: varchar("county", { length: 100 }).notNull(),
    subCounty: varchar("sub_county", { length: 100 }),
    ward: varchar("ward", { length: 100 }),
    specificLocation: text("specific_location"), // Encrypted
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    bio: text("bio"),
    yearsOfExperience: integer("years_of_experience"),
    languagesSpoken: jsonb("languages_spoken"),
    educationLevel: varchar("education_level", { length: 100 }),
    willingToRelocate: boolean("willing_to_relocate").default(false),
    preferredWorkType: preferredWorkTypeEnum("preferred_work_type"),
    childrenCount: integer("children_count"),
    maritalStatus: varchar("marital_status", { length: 50 }),
    socialMediaLinks: jsonb("social_media_links"),
    externalCertifications: jsonb("external_certifications"),
    basicSkillsTestResults: jsonb("basic_skills_test_results"),
    smsNotificationsConsent: boolean("sms_notifications_consent").default(false),
    profilePhotoUrl: text("profile_photo_url"),
    videoIntroUrl: text("video_intro_url"),
    videoIntroAssetId: varchar("video_intro_asset_id", { length: 255 }),
    videoIntroStatus: videoIntroStatusEnum("video_intro_status"),
    videoIntroUploadedAt: timestamp("video_intro_uploaded_at"),
    videoScript: text("video_script"),
    vettingStatus: vettingStatusEnum("vetting_status").default("incomplete"),
    vettingCompletedAt: timestamp("vetting_completed_at"),
    vettingNotes: text("vetting_notes"),
    profileCompletionPercentage: integer("profile_completion_percentage").default(0),
    availableForPlacement: boolean("available_for_placement").default(false),
    currentlyPlaced: boolean("currently_placed").default(false),
    totalPlacements: integer("total_placements").default(0),
    successfulPlacements: integer("successful_placements").default(0),
    averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
    totalRatings: integer("total_ratings").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    approvedAt: timestamp("approved_at"),
    approvedBy: uuid("approved_by").references(() => users.id),
  });

  export const serviceCategories = pgTable("service_categories", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    nameSw: varchar("name_sw", { length: 100 }),
    description: text("description"),
    iconUrl: text("icon_url"),
    active: boolean("active").default(true),
    displayOrder: integer("display_order"),
    createdAt: timestamp("created_at").defaultNow(),
  });

  export const serviceProviderSkills = pgTable("service_provider_skills", {
    id: uuid("id").defaultRandom().primaryKey(),
    serviceProviderId: uuid("service_provider_id").notNull().references(() => serviceProviders.id),
    categoryId: uuid("category_id").notNull().references(() => serviceCategories.id),
    experienceYears: integer("experience_years"),
    proficiencyLevel: proficiencyLevelEnum("proficiency_level"),
    certified: boolean("certified").default(false),
    createdAt: timestamp("created_at").defaultNow(),
  }, (table) => [
    unique("unique_provider_category").on(table.serviceProviderId, table.categoryId),
  ]);

  export const workHistory = pgTable("work_history", {
    id: uuid("id").defaultRandom().primaryKey(),
    serviceProviderId: uuid("service_provider_id").notNull().references(() => serviceProviders.id),
    formerEmployerId: uuid("former_employer_id").references(() => formerEmployers.id),
    employerName: varchar("employer_name", { length: 200 }).notNull(),
    roleTitle: varchar("role_title", { length: 100 }),
    responsibilities: text("responsibilities"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    durationMonths: integer("duration_months"),
    reasonForLeaving: text("reason_for_leaving"),
    isVerified: boolean("is_verified").default(false),
    isAuthentic: boolean("is_authentic").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  export const formerEmployers = pgTable("former_employers", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    phoneNumber: varchar("phone_number", { length: 15 }),
    email: varchar("email", { length: 255 }),
    location: text("location"),
    areaOfResidence: varchar("area_of_residence", { length: 100 }),
    childrenCountAtTime: integer("children_count_at_time"),
    childrenAgesAtTime: jsonb("children_ages_at_time"),
    additionalInfo: jsonb("additional_info"),
    clientId: uuid("client_id").references(() => clients.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  export const employerVerificationRequests = pgTable("employer_verification_requests", {
    id: uuid("id").defaultRandom().primaryKey(),
    workHistoryId: uuid("work_history_id").notNull().references(() => workHistory.id),
    verificationLink: varchar("verification_link", { length: 500 }).unique(),
    whatsappMessageId: varchar("whatsapp_message_id", { length: 255 }),
    linkSentAt: timestamp("link_sent_at"),
    linkExpiresAt: timestamp("link_expires_at"),
    reminderSentCount: integer("reminder_sent_count").default(0),
    lastReminderSentAt: timestamp("last_reminder_sent_at"),
    conversationWindowStartedAt: timestamp("conversation_window_started_at"),
    lastEmployerMessageAt: timestamp("last_employer_message_at"),
    conversationWindowActive: boolean("conversation_window_active").default(false),
    status: verificationStatusEnum("status").default("pending"),
    conversationId: varchar("conversation_id", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  export const employerVerificationResponses = pgTable("employer_verification_responses", {
    id: uuid("id").defaultRandom().primaryKey(),
    verificationRequestId: uuid("verification_request_id").notNull().references(() => employerVerificationRequests.id),
    responses: jsonb("responses"),
    fullTranscript: text("full_transcript"),
    recommendationText: text("recommendation_text"),
    employmentConfirmed: boolean("employment_confirmed"),
    wouldRehire: boolean("would_rehire"),
    wouldRecommend: boolean("would_recommend"),
    recommendationStrength: recommendationStrengthEnum("recommendation_strength"),
    conductRating: integer("conduct_rating"),
    skillRating: integer("skill_rating"),
    attitudeRating: integer("attitude_rating"),
    overallRating: integer("overall_rating"),
    redFlags: jsonb("red_flags"),
    greenFlags: jsonb("green_flags"),
    inconsistencies: jsonb("inconsistencies"),
    respondedAt: timestamp("responded_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  }, (table) => [
    check("conduct_rating_check", sql`${table.conductRating} >= 1 AND ${table.conductRating} <= 5`),
    check("skill_rating_check", sql`${table.skillRating} >= 1 AND ${table.skillRating} <= 5`),
    check("attitude_rating_check", sql`${table.attitudeRating} >= 1 AND ${table.attitudeRating} <= 5`),
    check("overall_rating_check", sql`${table.overallRating} >= 1 AND ${table.overallRating} <= 5`),
  ]);

  // ===== VETTING SYSTEM =====

  export const vettingSteps = pgTable("vetting_steps", {
    id: uuid("id").defaultRandom().primaryKey(),
    stepName: varchar("step_name", { length: 100 }).notNull(),
    stepDescription: text("step_description"),
    llmInstructions: text("llm_instructions").notNull(),
    llmPromptTemplate: text("llm_prompt_template"),
    applicableTo: applicableToEnum("applicable_to").notNull(),
    stepOrder: integer("step_order").notNull(),
    isRequired: boolean("is_required").default(true),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    createdBy: uuid("created_by").references(() => users.id),
    lastModifiedBy: uuid("last_modified_by").references(() => users.id),
  });

  export const spVettingProgress = pgTable("sp_vetting_progress", {
    id: uuid("id").defaultRandom().primaryKey(),
    serviceProviderId: uuid("service_provider_id").notNull().references(() => serviceProviders.id),
    vettingStepId: uuid("vetting_step_id").notNull().references(() => vettingSteps.id),
    status: vettingStepStatusEnum("status").default("not_started"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    resultData: jsonb("result_data"),
    aiAssessment: text("ai_assessment"),
    flagged: boolean("flagged").default(false),
    flaggedReason: text("flagged_reason"),
    adminReviewed: boolean("admin_reviewed").default(false),
    adminNotes: text("admin_notes"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }, (table) => [
    unique("unique_provider_step").on(table.serviceProviderId, table.vettingStepId),
  ]);

  export const clientVettingProgress = pgTable("client_vetting_progress", {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id").notNull().references(() => clients.id),
    vettingStepId: uuid("vetting_step_id").notNull().references(() => vettingSteps.id),
    status: vettingStepStatusEnum("status").default("not_started"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    idDocumentUrl: text("id_document_url"),
    idVerified: boolean("id_verified").default(false),
    verifiedAt: timestamp("verified_at"),
    verifiedBy: uuid("verified_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }, (table) => [
    unique("unique_client_step").on(table.clientId, table.vettingStepId),
  ]);

  export const kycDocuments = pgTable("kyc_documents", {
    id: uuid("id").defaultRandom().primaryKey(),
    serviceProviderId: uuid("service_provider_id").notNull().references(() => serviceProviders.id),
    documentType: documentTypeEnum("document_type").notNull(),
    fileUrl: text("file_url").notNull(),
    fileKey: text("file_key").notNull(),
    fileName: varchar("file_name", { length: 255 }),
    fileSize: integer("file_size"),
    mimeType: varchar("mime_type", { length: 100 }),
    verified: boolean("verified").default(false),
    verifiedAt: timestamp("verified_at"),
    verifiedBy: uuid("verified_by").references(() => users.id),
    verificationNotes: text("verification_notes"),
    issuedDate: date("issued_date"),
    expiryDate: date("expiry_date"),
    encryptionMetadata: jsonb("encryption_metadata"),
    uploadedAt: timestamp("uploaded_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  });

  export const videoRecordings = pgTable("video_recordings", {
    id: uuid("id").defaultRandom().primaryKey(),
    serviceProviderId: uuid("service_provider_id").notNull().references(() => serviceProviders.id),
    videoType: videoTypeEnum("video_type").notNull(),
    videoUrl: text("video_url").notNull(),
    videoKey: text("video_key").notNull(),
    muxAssetId: varchar("mux_asset_id", { length: 255 }),
    muxPlaybackUrl: text("mux_playback_url"),
    status: videoStatusEnum("status").default("uploaded"),
    durationSeconds: integer("duration_seconds"),
    fileSize: integer("file_size"),
    reviewed: boolean("reviewed").default(false),
    approved: boolean("approved").default(false),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at"),
    adminNotes: text("admin_notes"),
    encryptionMetadata: jsonb("encryption_metadata"),
    uploadedAt: timestamp("uploaded_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  });

  // ===== CLIENT TABLES =====

  export const clients = pgTable("clients", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id).unique(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    gender: genderEnum("gender"),
    phoneVerified: boolean("phone_verified").default(false),
    emailVerified: boolean("email_verified").default(false),
    county: varchar("county", { length: 100 }).notNull(),
    subCounty: varchar("sub_county", { length: 100 }),
    ward: varchar("ward", { length: 100 }),
    specificLocation: text("specific_location"), // Encrypted
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    familySize: integer("family_size"),
    childrenCount: integer("children_count"),
    childrenAges: jsonb("children_ages"),
    pets: boolean("pets").default(false),
    petDetails: text("pet_details"),
    preferencesText: text("preferences_text"),
    preferencesStructured: jsonb("preferences_structured"),
    preferredSpGender: preferredSpGenderEnum("preferred_sp_gender"),
    preferredLanguages: jsonb("preferred_languages"),
    temperamentPreference: text("temperament_preference"),
    requiredSchedule: varchar("required_schedule", { length: 100 }),
    specialRequirements: text("special_requirements"),
    activeEngagement: boolean("active_engagement").default(false),
    activeEngagementEndsAt: timestamp("active_engagement_ends_at"),
    totalPlacements: integer("total_placements").default(0),
    activePlacements: integer("active_placements").default(0),
    averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
    totalRatings: integer("total_ratings").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  // ===== TRAINING & COURSES =====

  export const courseCategories = pgTable("course_categories", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    nameSw: varchar("name_sw", { length: 100 }),
    description: text("description"),
    iconUrl: text("icon_url"),
    displayOrder: integer("display_order"),
    createdAt: timestamp("created_at").defaultNow(),
  });

  export const trainingCourses = pgTable("training_courses", {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    titleSw: varchar("title_sw", { length: 255 }),
    description: text("description"),
    descriptionSw: text("description_sw"),
    thumbnailUrl: text("thumbnail_url"),
    durationMinutes: integer("duration_minutes"),
    categoryId: uuid("category_id").references(() => courseCategories.id),
    difficulty: difficultyEnum("difficulty"),
    prerequisites: jsonb("prerequisites"),
    isMandatory: boolean("is_mandatory").default(false),
    requiredForApproval: boolean("required_for_approval").default(false),
    published: boolean("published").default(false),
    displayOrder: integer("display_order"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  export const courseMaterials = pgTable("course_materials", {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id").notNull().references(() => trainingCourses.id),
    materialType: materialTypeEnum("material_type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    orderIndex: integer("order_index").notNull(),
    videoUrl: text("video_url"),
    videoAssetId: varchar("video_asset_id", { length: 255 }),
    durationSeconds: integer("duration_seconds"),
    textContent: text("text_content"),
    textContentForAi: text("text_content_for_ai"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  export const aiCourseChatbotConversations = pgTable("ai_course_chatbot_conversations", {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id").notNull().references(() => trainingCourses.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    threadId: varchar("thread_id", { length: 255 }).notNull().unique(),
    messages: jsonb("messages").notNull(),
    status: conversationStatusEnum("status").default("active"),
    language: languageEnum("language").default("en"),
    startedAt: timestamp("started_at").defaultNow(),
    lastMessageAt: timestamp("last_message_at").defaultNow(),
    completedAt: timestamp("completed_at"),
  });

  export const courseEnrollments = pgTable("course_enrollments", {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id").notNull().references(() => trainingCourses.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    status: courseStatusEnum("status").default("not_started"),
    progressPercent: integer("progress_percent").default(0),
    currentMaterialId: uuid("current_material_id").references(() => courseMaterials.id),
    lastWatchedPositionSeconds: integer("last_watched_position_seconds").default(0),
    totalWatchTimeSeconds: integer("total_watch_time_seconds").default(0),
    completedAt: timestamp("completed_at"),
    passed: boolean("passed"),
    finalScore: integer("final_score"),
    enrolledAt: timestamp("enrolled_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }, (table) => [
    unique("unique_course_user").on(table.courseId, table.userId),
    check("progress_check", sql`${table.progressPercent} >= 0 AND ${table.progressPercent} <= 100`),
  ]);

  export const courseAssessments = pgTable("course_assessments", {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id").notNull().references(() => trainingCourses.id),
    title: varchar("title", { length: 255 }).notNull(),
    instructions: text("instructions"),
    questions: jsonb("questions").notNull(),
    passingScore: integer("passing_score").default(70),
    gradingCriteria: jsonb("grading_criteria"),
    timeLimitMinutes: integer("time_limit_minutes"),
    maxAttempts: integer("max_attempts").default(3),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  export const assessmentSubmissions = pgTable("assessment_submissions", {
    id: uuid("id").defaultRandom().primaryKey(),
    assessmentId: uuid("assessment_id").notNull().references(() => courseAssessments.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    attemptNumber: integer("attempt_number").default(1),
    answers: jsonb("answers").notNull(),
    llmEvaluation: jsonb("llm_evaluation"),
    llmFeedback: text("llm_feedback"),
    score: integer("score"),
    passed: boolean("passed"),
    submittedAt: timestamp("submitted_at").defaultNow(),
    evaluatedAt: timestamp("evaluated_at"),
  });

  // ===== PLACEMENTS & CONTRACTS =====

  export const placements = pgTable("placements", {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id").notNull().references(() => clients.id),
    serviceProviderId: uuid("service_provider_id").references(() => serviceProviders.id),
    serviceCategoryId: uuid("service_category_id").notNull().references(() => serviceCategories.id),
    placementType: placementTypeEnum("placement_type").notNull(),
    durationMonths: integer("duration_months"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    monthlySalary: decimal("monthly_salary", { precision: 10, scale: 2 }),
    serviceDate: date("service_date"),
    estimatedHours: decimal("estimated_hours", { precision: 5, scale: 2 }),
    expectationsResponsibilities: text("expectations_responsibilities"),
    tasksList: jsonb("tasks_list"),
    kidsCount: integer("kids_count"),
    disabledCareRequired: boolean("disabled_care_required").default(false),
    offDays: jsonb("off_days"),
    termsAndDetails: jsonb("terms_and_details"),
    totalFee: decimal("total_fee", { precision: 10, scale: 2 }).notNull(),
    platformCommission: decimal("platform_commission", { precision: 10, scale: 2 }),
    spPayout: decimal("sp_payout", { precision: 10, scale: 2 }),
    status: placementStatusEnum("status").default("ai_search"),
    contractId: uuid("contract_id").references(() => contracts.id),
    contractSignedAt: timestamp("contract_signed_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    acceptedAt: timestamp("accepted_at"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    cancelledAt: timestamp("cancelled_at"),
  });

  export const contractTemplates = pgTable("contract_templates", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    templateHtml: text("template_html").notNull(),
    placementType: varchar("placement_type", { length: 20 }),
    active: boolean("active").default(true),
    version: integer("version").default(1),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  export const contracts = pgTable("contracts", {
    id: uuid("id").defaultRandom().primaryKey(),
    placementId: uuid("placement_id").notNull().unique(),
    clientId: uuid("client_id").notNull().references(() => clients.id),
    serviceProviderId: uuid("service_provider_id").notNull().references(() => serviceProviders.id),
    contractTemplateId: uuid("contract_template_id").notNull().references(() => contractTemplates.id),
    contractHtml: text("contract_html").notNull(),
    contractPdfUrl: text("contract_pdf_url"),
    hasAiGeneratedSections: boolean("has_ai_generated_sections").default(false),
    aiGeneratedSections: jsonb("ai_generated_sections"),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    salary: decimal("salary", { precision: 10, scale: 2 }),
    terms: jsonb("terms"),
    clientSigned: boolean("client_signed").default(false),
    clientSignedAt: timestamp("client_signed_at"),
    clientSignatureData: text("client_signature_data"),
    spSigned: boolean("sp_signed").default(false),
    spSignedAt: timestamp("sp_signed_at"),
    spSignatureData: text("sp_signature_data"),
    adminApproved: boolean("admin_approved").default(false),
    adminApprovedAt: timestamp("admin_approved_at"),
    approvedBy: uuid("approved_by").references(() => users.id),
    adminNotes: text("admin_notes"),
    status: contractStatusEnum("status").default("draft"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  // ===== PAYMENT SYSTEM =====

  export const registrationFees = pgTable("registration_fees", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id).unique(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    transactionId: uuid("transaction_id").references(() => transactions.id),
    status: registrationFeeStatusEnum("status").default("pending"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow(),
  });

  export const subscriptions = pgTable("subscriptions", {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id").notNull().references(() => clients.id),
    placementId: uuid("placement_id").references(() => placements.id),
    status: subscriptionStatusEnum("status").default("active"),
    periodMonths: integer("period_months").notNull(),
    monthlyAmount: decimal("monthly_amount", { precision: 10, scale: 2 }).notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    nextPaymentDue: date("next_payment_due"),
    autoRenew: boolean("auto_renew").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    cancelledAt: timestamp("cancelled_at"),
  });

  export const subscriptionPayments = pgTable("subscription_payments", {
    id: uuid("id").defaultRandom().primaryKey(),
    subscriptionId: uuid("subscription_id").notNull().references(() => subscriptions.id),
    clientId: uuid("client_id").notNull().references(() => clients.id),
    monthNumber: integer("month_number").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    transactionId: uuid("transaction_id").references(() => transactions.id),
    dueDate: date("due_date").notNull(),
    paidDate: date("paid_date"),
    status: subscriptionPaymentStatusEnum("status").default("pending"),
    reminderSentCount: integer("reminder_sent_count").default(0),
    lastReminderSentAt: timestamp("last_reminder_sent_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  /**
   * Payout Requests
   * When service providers request to withdraw their earnings
   */
  export const payoutRequests = pgTable("payout_requests", {
    id: uuid("id").primaryKey().defaultRandom(),
    serviceProviderId: uuid("service_provider_id").notNull().references(() => serviceProviders.id),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    payoutMethod: text("payout_method").notNull(), // mpesa, bank
    payoutDetails: jsonb("payout_details"), // phone number or bank details
    status: payoutRequestStatusEnum("status").default("pending"),
    requestedAt: timestamp("requested_at").defaultNow(),
    processedBy: uuid("processed_by").references(() => users.id), // admin who processed
    processedAt: timestamp("processed_at"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  /**
   * SP Payouts
   * Actual payments made to service providers
   */
  export const spPayouts = pgTable("sp_payouts", {
    id: uuid("id").defaultRandom().primaryKey(),
    serviceProviderId: uuid("service_provider_id").notNull().references(() => serviceProviders.id),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    platformCutPercentage: decimal("platform_cut_percentage", { precision: 5, scale: 2 }),
    platformCutAmount: decimal("platform_cut_amount", { precision: 10, scale: 2 }),
    netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(),
    paymentNumber: varchar("payment_number", { length: 15 }).notNull(),
    paymentNetwork: paymentNetworkEnum("payment_network").default("mpesa"),
    status: spPayoutStatusEnum("status").default("pending"),
    disbursementId: uuid("disbursement_id").references(() => disbursements.id),
    requestedAt: timestamp("requested_at"),
    processedAt: timestamp("processed_at"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  export const transactions = pgTable("transactions", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id),
    transactionType: transactionTypeEnum("transaction_type").notNull(),
    checkoutRequestId: varchar("checkout_request_id", { length: 255 }).unique().notNull(),
    merchantRequestId: varchar("merchant_request_id", { length: 255 }),
    sasapayTransactionId: varchar("sasapay_transaction_id", { length: 255 }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("KES"),
    phoneNumber: varchar("phone_number", { length: 15 }).notNull(),
    networkCode: varchar("network_code", { length: 10 }).notNull(),
    status: transactionStatusEnum("status").default("pending"),
    resultCode: varchar("result_code", { length: 10 }),
    resultDesc: text("result_desc"),
    callbackReceivedAt: timestamp("callback_received_at"),
    callbackData: jsonb("callback_data"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  export const disbursements = pgTable("disbursements", {
    id: uuid("id").defaultRandom().primaryKey(),
    disbursementType: disbursementTypeEnum("disbursement_type").notNull(),
    placementId: uuid("placement_id").references(() => placements.id),
    b2cRequestId: varchar("b2c_request_id", { length: 255 }).unique().notNull(),
    sasapayTransactionCode: varchar("sasapay_transaction_code", { length: 255 }),
    thirdPartyTransactionCode: varchar("third_party_transaction_code", { length: 255 }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("KES"),
    receiverNumber: varchar("receiver_number", { length: 15 }).notNull(),
    channel: varchar("channel", { length: 10 }).default("63902"),
    reason: text("reason"),
    status: disbursementStatusEnum("status").default("pending"),
    resultCode: varchar("result_code", { length: 10 }),
    resultDesc: text("result_desc"),
    callbackReceivedAt: timestamp("callback_received_at"),
    callbackData: jsonb("callback_data"),
    initiatedBy: uuid("initiated_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  export const escrowTransactions = pgTable("escrow_transactions", {
    id: uuid("id").defaultRandom().primaryKey(),
    placementId: uuid("placement_id").notNull().unique().references(() => placements.id),
    clientId: uuid("client_id").notNull().references(() => clients.id),
    serviceProviderId: uuid("service_provider_id").notNull().references(() => serviceProviders.id),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
    platformCommission: decimal("platform_commission", { precision: 10, scale: 2 }).notNull(),
    spPayout: decimal("sp_payout", { precision: 10, scale: 2 }).notNull(),
    paymentTransactionId: uuid("payment_transaction_id").references(() => transactions.id),
    paymentReceivedAt: timestamp("payment_received_at"),
    status: escrowStatusEnum("status").default("pending"),
    heldAt: timestamp("held_at"),
    releaseDisbursementId: uuid("release_disbursement_id").references(() => disbursements.id),
    releasedAt: timestamp("released_at"),
    releasedBy: uuid("released_by").references(() => users.id),
    releaseReason: text("release_reason"),
    refundDisbursementId: uuid("refund_disbursement_id").references(() => disbursements.id),
    refundedAt: timestamp("refunded_at"),
    refundedBy: uuid("refunded_by").references(() => users.id),
    refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
    refundReason: text("refund_reason"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  export const escrowLedger = pgTable("escrow_ledger", {
    id: uuid("id").defaultRandom().primaryKey(),
    escrowTransactionId: uuid("escrow_transaction_id").notNull().references(() => escrowTransactions.id),
    eventType: eventTypeEnum("event_type").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    balanceBefore: decimal("balance_before", { precision: 10, scale: 2 }),
    balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }),
    performedBy: uuid("performed_by").references(() => users.id),
    reason: text("reason"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
  });

  // ===== COMMUNICATION =====

  export const conversations = pgTable("conversations", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id),
    conversationType: conversationTypeEnum("conversation_type").notNull(),
    threadId: varchar("thread_id", { length: 255 }).unique().notNull(),
    messages: jsonb("messages").notNull(),
    placementId: uuid("placement_id").references(() => placements.id),
    serviceProviderId: uuid("service_provider_id").references(() => serviceProviders.id),
    status: conversationStatusEnum("status").default("active"),
    language: languageEnum("language").default("en"),
    startedAt: timestamp("started_at").defaultNow(),
    lastMessageAt: timestamp("last_message_at").defaultNow(),
    completedAt: timestamp("completed_at"),
  });

  /**
   * Direct Messages (User to User)
   * Real-time chat between clients and service providers
   */
  export const directMessages = pgTable("direct_messages", {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id").notNull().references(() => directConversations.id),
    senderId: uuid("sender_id").notNull().references(() => users.id),
    content: text("content").notNull(),
    attachmentUrl: text("attachment_url"),
    read: boolean("read").default(false),
    createdAt: timestamp("created_at").defaultNow(),
  });

  /**
   * Direct Conversations
   * Tracks 1-on-1 conversations between users
   */
  export const directConversations = pgTable("direct_conversations", {
    id: uuid("id").primaryKey().defaultRandom(),
    user1Id: uuid("user1_id").notNull().references(() => users.id),
    user2Id: uuid("user2_id").notNull().references(() => users.id),
    user1LastRead: timestamp("user1_last_read"),
    user2LastRead: timestamp("user2_last_read"),
    lastMessageAt: timestamp("last_message_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  /**
   * AI Chat Messages  
   * Messages in AI-powered assistance conversations
   */
  export const messages = pgTable("messages", {
    id: uuid("id").defaultRandom().primaryKey(),
    placementId: uuid("placement_id").references(() => placements.id),
    senderId: uuid("sender_id").notNull().references(() => users.id),
    recipientId: uuid("recipient_id").notNull().references(() => users.id),
    messageText: text("message_text").notNull(),
    attachmentUrls: jsonb("attachment_urls"),
    contactSharingRequested: boolean("contact_sharing_requested").default(false),
    contactInfoRevealed: boolean("contact_info_revealed").default(false),
    contactRevealedAt: timestamp("contact_revealed_at"),
    containsContactInfo: boolean("contains_contact_info").default(false),
    contactWarningShown: boolean("contact_warning_shown").default(false),
    read: boolean("read").default(false),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow(),
    deletedBySender: boolean("deleted_by_sender").default(false),
    deletedByRecipient: boolean("deleted_by_recipient").default(false),
  });

  export const notifications = pgTable("notifications", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id),
    type: notificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    sentViaEmail: boolean("sent_via_email").default(false),
    sentViaSms: boolean("sent_via_sms").default(false),
    sentViaPush: boolean("sent_via_push").default(false),
    sentViaInApp: boolean("sent_via_in_app").default(true),
    relatedPlacementId: uuid("related_placement_id").references(() => placements.id),
    relatedTransactionId: uuid("related_transaction_id").references(() => transactions.id),
    actionUrl: text("action_url"),
    data: jsonb("data"),
    read: boolean("read").default(false),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow(),
  });

  export const automatedMessages = pgTable("automated_messages", {
    id: uuid("id").defaultRandom().primaryKey(),
    messageType: automatedMessageTypeEnum("message_type").notNull(),
    templateName: varchar("template_name", { length: 100 }).notNull(),
    subjectTemplate: varchar("subject_template", { length: 255 }),
    bodyTemplate: text("body_template").notNull(),
    scheduleType: scheduleTypeEnum("schedule_type").notNull(),
    scheduleConfig: jsonb("schedule_config"),
    targetUserType: targetUserTypeEnum("target_user_type"),
    active: boolean("active").default(true),
    lastSentAt: timestamp("last_sent_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  export const whatsappMessages = pgTable("whatsapp_messages", {
    id: uuid("id").defaultRandom().primaryKey(),
    messageId: varchar("message_id", { length: 255 }).unique().notNull(),
    wamid: varchar("wamid", { length: 255 }),
    fromNumber: varchar("from_number", { length: 15 }).notNull(),
    toNumber: varchar("to_number", { length: 15 }).notNull(),
    messageType: messageTypeEnum("message_type").notNull(),
    messageBody: text("message_body"),
    templateName: varchar("template_name", { length: 100 }),
    templateLanguage: varchar("template_language", { length: 10 }),
    verificationRequestId: uuid("verification_request_id").references(() => employerVerificationRequests.id),
    status: messageStatusEnum("status").default("sent"),
    errorCode: varchar("error_code", { length: 50 }),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at").defaultNow(),
    deliveredAt: timestamp("delivered_at"),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow(),
  });

  // ===== RATINGS & COMPLAINTS =====

  export const ratings = pgTable("ratings", {
    id: uuid("id").defaultRandom().primaryKey(),
    placementId: uuid("placement_id").notNull().references(() => placements.id),
    raterType: raterTypeEnum("rater_type").notNull(), // who gave this rating (client or service_provider)
    rating: integer("rating").notNull(),
    reviewText: text("review_text").notNull(),
    punctualityRating: integer("punctuality_rating"),
    qualityRating: integer("quality_rating"),
    communicationRating: integer("communication_rating"),
    professionalismRating: integer("professionalism_rating"),
    profanityDetected: boolean("profanity_detected").default(false),
    profanityDetails: jsonb("profanity_details"),
    moderationStatus: moderationStatusEnum("moderation_status").default("pending"),
    flagged: boolean("flagged").default(false),
    flaggedReason: text("flagged_reason"),
    moderatedBy: uuid("moderated_by").references(() => users.id),
    moderatedAt: timestamp("moderated_at"),
    visible: boolean("visible").default(false),
    responseText: text("response_text"),
    respondedAt: timestamp("responded_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }, (table) => [
    unique("unique_placement_rater").on(table.placementId, table.raterType),
    check("rating_check", sql`${table.rating} >= 1 AND ${table.rating} <= 5`),
    check("punctuality_check", sql`${table.punctualityRating} >= 1 AND ${table.punctualityRating} <= 5`),
    check("quality_check", sql`${table.qualityRating} >= 1 AND ${table.qualityRating} <= 5`),
    check("communication_check", sql`${table.communicationRating} >= 1 AND ${table.communicationRating} <= 5`),
    check("professionalism_check", sql`${table.professionalismRating} >= 1 AND ${table.professionalismRating} <= 5`),
  ]);

  export const complaints = pgTable("complaints", {
    id: uuid("id").defaultRandom().primaryKey(),
    reporterId: uuid("reporter_id").notNull().references(() => users.id),
    reporterType: userTypeEnum("reporter_type").notNull(),
    placementId: uuid("placement_id").references(() => placements.id),
    reportedUserId: uuid("reported_user_id").references(() => users.id),
    complaintType: complaintTypeEnum("complaint_type").notNull(),
    severity: severityEnum("severity").default("medium"),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    evidenceUrls: jsonb("evidence_urls"),
    status: complaintStatusEnum("status").default("open"),
    assignedTo: uuid("assigned_to").references(() => users.id),
    resolutionNotes: text("resolution_notes"),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  // ===== CERTIFICATIONS =====

  export const certifications = pgTable("certifications", {
    id: uuid("id").defaultRandom().primaryKey(),
    serviceProviderId: uuid("service_provider_id").notNull().references(() => serviceProviders.id),
    certificateType: certificateTypeEnum("certificate_type").notNull(),
    courseId: uuid("course_id").references(() => trainingCourses.id),
    certificateNumber: varchar("certificate_number", { length: 100 }).unique().notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    certificatePdfUrl: text("certificate_pdf_url").notNull(),
    badgeImageUrl: text("badge_image_url"),
    qrCodeData: text("qr_code_data").notNull(),
    qrCodeImageUrl: text("qr_code_image_url"),
    verificationCode: varchar("verification_code", { length: 50 }).unique().notNull(),
    publicVerificationUrl: text("public_verification_url"),
    issuedAt: timestamp("issued_at").notNull(),
    expiresAt: timestamp("expires_at"),
    revoked: boolean("revoked").default(false),
    revokedAt: timestamp("revoked_at"),
    revokedReason: text("revoked_reason"),
    createdAt: timestamp("created_at").defaultNow(),
  });

  // ===== PLATFORM CONFIGURATION =====

  export const platformConfig = pgTable("platform_config", {
    id: uuid("id").defaultRandom().primaryKey(),
    configKey: varchar("config_key", { length: 100 }).unique().notNull(),
    configValue: text("config_value").notNull(),
    dataType: dataTypeEnum("data_type").notNull(),
    description: text("description"),
    category: varchar("category", { length: 50 }),
    isEditableFromAdmin: boolean("is_editable_from_admin").default(true),
    lastUpdatedBy: uuid("last_updated_by").references(() => users.id),
    updatedAt: timestamp("updated_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  });

  export const appVersions = pgTable("app_versions", {
    id: uuid("id").defaultRandom().primaryKey(),
    versionNumber: varchar("version_number", { length: 20 }).notNull(),
    buildNumber: integer("build_number").notNull(),
    platform: appPlatformEnum("platform").notNull(),
    isLatest: boolean("is_latest").default(false),
    minimumRequiredVersion: varchar("minimum_required_version", { length: 20 }),
    status: appStatusEnum("status").default("active"),
    releaseNotes: text("release_notes"),
    releaseNotesSw: text("release_notes_sw"),
    releasedAt: timestamp("released_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  });

  // ===== TELEMETRY & TRACKING =====

  export const userTelemetry = pgTable("user_telemetry", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id).unique(),
    source: varchar("source", { length: 100 }),
    utmSource: varchar("utm_source", { length: 100 }),
    utmMedium: varchar("utm_medium", { length: 100 }),
    utmCampaign: varchar("utm_campaign", { length: 100 }),
    utmTerm: varchar("utm_term", { length: 100 }),
    utmContent: varchar("utm_content", { length: 100 }),
    referralCode: varchar("referral_code", { length: 50 }),
    referredByUserId: uuid("referred_by_user_id").references(() => users.id),
    deviceType: varchar("device_type", { length: 50 }),
    operatingSystem: varchar("operating_system", { length: 50 }),
    browser: varchar("browser", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow(),
  });

  export const userNotes = pgTable("user_notes", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id),
    noteText: text("note_text").notNull(),
    category: varchar("category", { length: 50 }),
    priority: priorityEnum("priority").default("medium"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  export const contactSharingLog = pgTable("contact_sharing_log", {
    id: uuid("id").defaultRandom().primaryKey(),
    placementId: uuid("placement_id").notNull().references(() => placements.id),
    messageId: uuid("message_id").references(() => messages.id),
    requesterId: uuid("requester_id").notNull().references(() => users.id),
    contactOwnerId: uuid("contact_owner_id").notNull().references(() => users.id),
    contactType: contactTypeEnum("contact_type").notNull(),
    contactData: jsonb("contact_data"),
    sharedAt: timestamp("shared_at").defaultNow(),
  });

  export const profanityDetections = pgTable("profanity_detections", {
    id: uuid("id").defaultRandom().primaryKey(),
    contentType: contentTypeEnum("content_type").notNull(),
    contentId: uuid("content_id").notNull(),
    detectedWords: jsonb("detected_words"),
    detectionMethod: detectionMethodEnum("detection_method").notNull(),
    confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
    actionTaken: actionTakenEnum("action_taken").notNull(),
    detectedAt: timestamp("detected_at").defaultNow(),
  });

  // ===== AUDIT & LOGS =====

  export const webhookLogs = pgTable("webhook_logs", {
    id: uuid("id").defaultRandom().primaryKey(),
    endpoint: varchar("endpoint", { length: 255 }).notNull(),
    method: varchar("method", { length: 10 }).default("POST"),
    headers: jsonb("headers"),
    body: jsonb("body").notNull(),
    checkoutRequestId: varchar("checkout_request_id", { length: 255 }),
    b2cRequestId: varchar("b2c_request_id", { length: 255 }),
    processed: boolean("processed").default(false),
    processedAt: timestamp("processed_at"),
    processingError: text("processing_error"),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    receivedAt: timestamp("received_at").defaultNow(),
  });

  export const adminAuditLogs = pgTable("admin_audit_logs", {
    id: uuid("id").defaultRandom().primaryKey(),
    adminId: uuid("admin_id").notNull().references(() => users.id),
    action: varchar("action", { length: 100 }).notNull(),
    resourceType: varchar("resource_type", { length: 100 }),
    resourceId: uuid("resource_id"),
    changes: jsonb("changes"),
    reason: text("reason"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").defaultNow(),
  });

// ===== RELATIONS =====

export const serviceProvidersRelations = relations(serviceProviders, ({ one, many }) => ({
  user: one(users, {
    fields: [serviceProviders.userId],
    references: [users.id],
  }),
  skills: many(serviceProviderSkills),
  workHistory: many(workHistory),
  vettingProgress: many(spVettingProgress),
  kycDocuments: many(kycDocuments),
  videoRecordings: many(videoRecordings),
  placements: many(placements),
  contracts: many(contracts),
  certifications: many(certifications),
  ratings: many(ratings),
  payoutRequests: many(payoutRequests),
  spPayouts: many(spPayouts),
}));

export const serviceProviderSkillsRelations = relations(serviceProviderSkills, ({ one }) => ({
  serviceProvider: one(serviceProviders, {
    fields: [serviceProviderSkills.serviceProviderId],
    references: [serviceProviders.id],
  }),
  serviceCategory: one(serviceCategories, {
    fields: [serviceProviderSkills.categoryId],
    references: [serviceCategories.id],
  }),
}));

export const workHistoryRelations = relations(workHistory, ({ one }) => ({
  serviceProvider: one(serviceProviders, {
    fields: [workHistory.serviceProviderId],
    references: [serviceProviders.id],
  }),
  formerEmployer: one(formerEmployers, {
    fields: [workHistory.formerEmployerId],
    references: [formerEmployers.id],
  }),
}));

export const formerEmployersRelations = relations(formerEmployers, ({ many }) => ({
  workHistory: many(workHistory),
  verificationRequests: many(employerVerificationRequests),
}));

export const employerVerificationRequestsRelations = relations(employerVerificationRequests, ({ one, many }) => ({
  workHistory: one(workHistory, {
    fields: [employerVerificationRequests.workHistoryId],
    references: [workHistory.id],
  }),
  responses: many(employerVerificationResponses),
}));

export const employerVerificationResponsesRelations = relations(employerVerificationResponses, ({ one }) => ({
  verificationRequest: one(employerVerificationRequests, {
    fields: [employerVerificationResponses.verificationRequestId],
    references: [employerVerificationRequests.id],
  }),
}));

export const spVettingProgressRelations = relations(spVettingProgress, ({ one }) => ({
  serviceProvider: one(serviceProviders, {
    fields: [spVettingProgress.serviceProviderId],
    references: [serviceProviders.id],
  }),
  vettingStep: one(vettingSteps, {
    fields: [spVettingProgress.vettingStepId],
    references: [vettingSteps.id],
  }),
}));

export const clientVettingProgressRelations = relations(clientVettingProgress, ({ one }) => ({
  client: one(clients, {
    fields: [clientVettingProgress.clientId],
    references: [clients.id],
  }),
  vettingStep: one(vettingSteps, {
    fields: [clientVettingProgress.vettingStepId],
    references: [vettingSteps.id],
  }),
}));

export const kycDocumentsRelations = relations(kycDocuments, ({ one }) => ({
  serviceProvider: one(serviceProviders, {
    fields: [kycDocuments.serviceProviderId],
    references: [serviceProviders.id],
  }),
}));

export const videoRecordingsRelations = relations(videoRecordings, ({ one }) => ({
  serviceProvider: one(serviceProviders, {
    fields: [videoRecordings.serviceProviderId],
    references: [serviceProviders.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  vettingProgress: many(clientVettingProgress),
  placements: many(placements),
  contracts: many(contracts),
  ratings: many(ratings),
  directConversations: many(directConversations),
}));

export const trainingCoursesRelations = relations(trainingCourses, ({ one, many }) => ({
  category: one(courseCategories, {
    fields: [trainingCourses.categoryId],
    references: [courseCategories.id],
  }),
  materials: many(courseMaterials),
  enrollments: many(courseEnrollments),
  assessments: many(courseAssessments),
  certifications: many(certifications),
}));

export const courseMaterialsRelations = relations(courseMaterials, ({ one }) => ({
  course: one(trainingCourses, {
    fields: [courseMaterials.courseId],
    references: [trainingCourses.id],
  }),
}));

export const aiCourseChatbotConversationsRelations = relations(aiCourseChatbotConversations, ({ one }) => ({
  user: one(users, {
    fields: [aiCourseChatbotConversations.userId],
    references: [users.id],
  }),
}));

export const courseEnrollmentsRelations = relations(courseEnrollments, ({ one }) => ({
  course: one(trainingCourses, {
    fields: [courseEnrollments.courseId],
    references: [trainingCourses.id],
  }),
  user: one(users, {
    fields: [courseEnrollments.userId],
    references: [users.id],
  }),
}));

export const courseAssessmentsRelations = relations(courseAssessments, ({ one, many }) => ({
  course: one(trainingCourses, {
    fields: [courseAssessments.courseId],
    references: [trainingCourses.id],
  }),
  submissions: many(assessmentSubmissions),
}));

export const assessmentSubmissionsRelations = relations(assessmentSubmissions, ({ one }) => ({
  user: one(users, {
    fields: [assessmentSubmissions.userId],
    references: [users.id],
  }),
  assessment: one(courseAssessments, {
    fields: [assessmentSubmissions.assessmentId],
    references: [courseAssessments.id],
  }),
}));

export const placementsRelations = relations(placements, ({ one, many }) => ({
  client: one(clients, {
    fields: [placements.clientId],
    references: [clients.id],
  }),
  serviceProvider: one(serviceProviders, {
    fields: [placements.serviceProviderId],
    references: [serviceProviders.id],
  }),
  serviceCategory: one(serviceCategories, {
    fields: [placements.serviceCategoryId],
    references: [serviceCategories.id],
  }),
  contract: one(contracts, {
    fields: [placements.id],
    references: [contracts.placementId],
  }),
  escrowTransactions: many(escrowTransactions),
  ratings: many(ratings),
  complaints: many(complaints),
}));

export const contractsRelations = relations(contracts, ({ one }) => ({
  placement: one(placements, {
    fields: [contracts.placementId],
    references: [placements.id],
  }),
  client: one(clients, {
    fields: [contracts.clientId],
    references: [clients.id],
  }),
  serviceProvider: one(serviceProviders, {
    fields: [contracts.serviceProviderId],
    references: [serviceProviders.id],
  }),
  template: one(contractTemplates, {
    fields: [contracts.contractTemplateId],
    references: [contractTemplates.id],
  }),
}));

export const registrationFeesRelations = relations(registrationFees, ({ one }) => ({
  user: one(users, {
    fields: [registrationFees.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  placement: one(placements, {
    fields: [subscriptions.placementId],
    references: [placements.id],
  }),
  payments: many(subscriptionPayments),
}));

export const subscriptionPaymentsRelations = relations(subscriptionPayments, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [subscriptionPayments.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const payoutRequestsRelations = relations(payoutRequests, ({ one }) => ({
  serviceProvider: one(serviceProviders, {
    fields: [payoutRequests.serviceProviderId],
    references: [serviceProviders.id],
  }),
}));

export const spPayoutsRelations = relations(spPayouts, ({ one }) => ({
  serviceProvider: one(serviceProviders, {
    fields: [spPayouts.serviceProviderId],
    references: [serviceProviders.id],
  }),
  disbursement: one(disbursements, {
    fields: [spPayouts.disbursementId],
    references: [disbursements.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const disbursementsRelations = relations(disbursements, ({ one }) => ({
  placement: one(placements, {
    fields: [disbursements.placementId],
    references: [placements.id],
  }),
  initiator: one(users, {
    fields: [disbursements.initiatedBy],
    references: [users.id],
  }),
}));

export const escrowTransactionsRelations = relations(escrowTransactions, ({ one, many }) => ({
  placement: one(placements, {
    fields: [escrowTransactions.placementId],
    references: [placements.id],
  }),
  client: one(clients, {
    fields: [escrowTransactions.clientId],
    references: [clients.id],
  }),
  serviceProvider: one(serviceProviders, {
    fields: [escrowTransactions.serviceProviderId],
    references: [serviceProviders.id],
  }),
  ledgerEntries: many(escrowLedger),
}));

export const escrowLedgerRelations = relations(escrowLedger, ({ one }) => ({
  escrowTransaction: one(escrowTransactions, {
    fields: [escrowLedger.escrowTransactionId],
    references: [escrowTransactions.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(directMessages),
  verificationRequests: many(employerVerificationRequests),
}));

export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [directMessages.conversationId],
    references: [conversations.id],
  }),
}));

export const directConversationsRelations = relations(directConversations, ({ one }) => ({
  user1: one(users, {
    fields: [directConversations.user1Id],
    references: [users.id],
  }),
  user2: one(users, {
    fields: [directConversations.user2Id],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  placement: one(placements, {
    fields: [messages.placementId],
    references: [placements.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const whatsappMessagesRelations = relations(whatsappMessages, ({ one }) => ({
  verificationRequest: one(employerVerificationRequests, {
    fields: [whatsappMessages.verificationRequestId],
    references: [employerVerificationRequests.id],
  }),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  placement: one(placements, {
    fields: [ratings.placementId],
    references: [placements.id],
  }),
}));

export const complaintsRelations = relations(complaints, ({ one }) => ({
  placement: one(placements, {
    fields: [complaints.placementId],
    references: [placements.id],
  }),
  reporter: one(users, {
    fields: [complaints.reporterId],
    references: [users.id],
  }),
  reportedUser: one(users, {
    fields: [complaints.reportedUserId],
    references: [users.id],
  }),
  assignedTo: one(users, {
    fields: [complaints.assignedTo],
    references: [users.id],
  }),
}));

export const certificationsRelations = relations(certifications, ({ one }) => ({
  serviceProvider: one(serviceProviders, {
    fields: [certifications.serviceProviderId],
    references: [serviceProviders.id],
  }),
  course: one(trainingCourses, {
    fields: [certifications.courseId],
    references: [trainingCourses.id],
  }),
}));

export const userNotesRelations = relations(userNotes, ({ one }) => ({
  user: one(users, {
    fields: [userNotes.userId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [userNotes.createdBy],
    references: [users.id],
  }),
}));

export const contactSharingLogRelations = relations(contactSharingLog, ({ one }) => ({
  placement: one(placements, {
    fields: [contactSharingLog.placementId],
    references: [placements.id],
  }),
  message: one(messages, {
    fields: [contactSharingLog.messageId],
    references: [messages.id],
  }),
  requester: one(users, {
    fields: [contactSharingLog.requesterId],
    references: [users.id],
  }),
  contactOwner: one(users, {
    fields: [contactSharingLog.contactOwnerId],
    references: [users.id],
  }),
}));

export const adminAuditLogsRelations = relations(adminAuditLogs, ({ one }) => ({
  admin: one(users, {
    fields: [adminAuditLogs.adminId],
    references: [users.id],
  }),
}));
