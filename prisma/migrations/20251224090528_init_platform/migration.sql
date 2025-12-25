/*
  Warnings:

  - You are about to drop the `admission_applications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `alumni` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `announcements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `assignment_submissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `attendance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `canteen_menu` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `canteen_orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `certificates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `class_subjects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `classes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `club_activities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `club_members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `clubs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `disciplinary_actions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `exams` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `expenses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fee_invoices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fee_payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fee_structures` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `grades` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `grievance_responses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `grievances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `health_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `homework` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `homework_completions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hostel_allocations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hostel_rooms` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hostels` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inventory_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inventory_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inventory_transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leave_applications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `library_books` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `library_transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `parent_student` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `parents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pt_meeting_bookings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pt_meeting_slots` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pt_meetings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `report_card_subjects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `report_cards` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `salaries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scholarship_applications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scholarship_recipients` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scholarships` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sport_matches` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sport_players` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sport_teams` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `staff_attendance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_leave_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_remarks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `students` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subject_teachers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subjects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teachers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `timetable` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `timetable_substitutions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transport_routes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transport_students` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vaccinations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `visitors` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PlatformUserRole" AS ENUM ('OWNER', 'ADMIN', 'SUPPORT', 'SALES', 'FINANCE', 'DEVELOPER');

-- CreateEnum
CREATE TYPE "SchoolStatus" AS ENUM ('ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'PAST_DUE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- DropForeignKey
ALTER TABLE "alumni" DROP CONSTRAINT "alumni_student_id_fkey";

-- DropForeignKey
ALTER TABLE "assignment_submissions" DROP CONSTRAINT "assignment_submissions_assignment_id_fkey";

-- DropForeignKey
ALTER TABLE "assignment_submissions" DROP CONSTRAINT "assignment_submissions_student_id_fkey";

-- DropForeignKey
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_class_id_fkey";

-- DropForeignKey
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_created_by_fkey";

-- DropForeignKey
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_class_id_fkey";

-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_student_id_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "canteen_orders" DROP CONSTRAINT "canteen_orders_menu_item_id_fkey";

-- DropForeignKey
ALTER TABLE "canteen_orders" DROP CONSTRAINT "canteen_orders_student_id_fkey";

-- DropForeignKey
ALTER TABLE "certificates" DROP CONSTRAINT "certificates_student_id_fkey";

-- DropForeignKey
ALTER TABLE "class_subjects" DROP CONSTRAINT "class_subjects_class_id_fkey";

-- DropForeignKey
ALTER TABLE "class_subjects" DROP CONSTRAINT "class_subjects_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "classes" DROP CONSTRAINT "classes_class_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "club_activities" DROP CONSTRAINT "club_activities_club_id_fkey";

-- DropForeignKey
ALTER TABLE "club_members" DROP CONSTRAINT "club_members_club_id_fkey";

-- DropForeignKey
ALTER TABLE "club_members" DROP CONSTRAINT "club_members_student_id_fkey";

-- DropForeignKey
ALTER TABLE "disciplinary_actions" DROP CONSTRAINT "disciplinary_actions_student_id_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_student_id_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "exams" DROP CONSTRAINT "exams_class_id_fkey";

-- DropForeignKey
ALTER TABLE "fee_invoices" DROP CONSTRAINT "fee_invoices_fee_structure_id_fkey";

-- DropForeignKey
ALTER TABLE "fee_invoices" DROP CONSTRAINT "fee_invoices_student_id_fkey";

-- DropForeignKey
ALTER TABLE "fee_payments" DROP CONSTRAINT "fee_payments_invoice_id_fkey";

-- DropForeignKey
ALTER TABLE "fee_structures" DROP CONSTRAINT "fee_structures_class_id_fkey";

-- DropForeignKey
ALTER TABLE "grades" DROP CONSTRAINT "grades_exam_id_fkey";

-- DropForeignKey
ALTER TABLE "grades" DROP CONSTRAINT "grades_student_id_fkey";

-- DropForeignKey
ALTER TABLE "grades" DROP CONSTRAINT "grades_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "grievance_responses" DROP CONSTRAINT "grievance_responses_grievance_id_fkey";

-- DropForeignKey
ALTER TABLE "health_records" DROP CONSTRAINT "health_records_student_id_fkey";

-- DropForeignKey
ALTER TABLE "homework" DROP CONSTRAINT "homework_class_id_fkey";

-- DropForeignKey
ALTER TABLE "homework" DROP CONSTRAINT "homework_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "homework" DROP CONSTRAINT "homework_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "homework_completions" DROP CONSTRAINT "homework_completions_homework_id_fkey";

-- DropForeignKey
ALTER TABLE "homework_completions" DROP CONSTRAINT "homework_completions_student_id_fkey";

-- DropForeignKey
ALTER TABLE "hostel_allocations" DROP CONSTRAINT "hostel_allocations_room_id_fkey";

-- DropForeignKey
ALTER TABLE "hostel_allocations" DROP CONSTRAINT "hostel_allocations_student_id_fkey";

-- DropForeignKey
ALTER TABLE "hostel_rooms" DROP CONSTRAINT "hostel_rooms_hostel_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_items" DROP CONSTRAINT "inventory_items_category_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_transactions" DROP CONSTRAINT "inventory_transactions_item_id_fkey";

-- DropForeignKey
ALTER TABLE "leave_applications" DROP CONSTRAINT "leave_applications_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "library_transactions" DROP CONSTRAINT "library_transactions_book_id_fkey";

-- DropForeignKey
ALTER TABLE "library_transactions" DROP CONSTRAINT "library_transactions_student_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_user_id_fkey";

-- DropForeignKey
ALTER TABLE "parent_student" DROP CONSTRAINT "parent_student_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "parent_student" DROP CONSTRAINT "parent_student_student_id_fkey";

-- DropForeignKey
ALTER TABLE "parents" DROP CONSTRAINT "parents_user_id_fkey";

-- DropForeignKey
ALTER TABLE "pt_meeting_bookings" DROP CONSTRAINT "pt_meeting_bookings_meeting_id_fkey";

-- DropForeignKey
ALTER TABLE "pt_meeting_bookings" DROP CONSTRAINT "pt_meeting_bookings_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "pt_meeting_bookings" DROP CONSTRAINT "pt_meeting_bookings_slot_id_fkey";

-- DropForeignKey
ALTER TABLE "pt_meeting_bookings" DROP CONSTRAINT "pt_meeting_bookings_student_id_fkey";

-- DropForeignKey
ALTER TABLE "pt_meeting_slots" DROP CONSTRAINT "pt_meeting_slots_meeting_id_fkey";

-- DropForeignKey
ALTER TABLE "pt_meeting_slots" DROP CONSTRAINT "pt_meeting_slots_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "report_card_subjects" DROP CONSTRAINT "report_card_subjects_report_card_id_fkey";

-- DropForeignKey
ALTER TABLE "report_card_subjects" DROP CONSTRAINT "report_card_subjects_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "report_cards" DROP CONSTRAINT "report_cards_exam_id_fkey";

-- DropForeignKey
ALTER TABLE "report_cards" DROP CONSTRAINT "report_cards_student_id_fkey";

-- DropForeignKey
ALTER TABLE "scholarship_applications" DROP CONSTRAINT "scholarship_applications_scholarship_id_fkey";

-- DropForeignKey
ALTER TABLE "scholarship_applications" DROP CONSTRAINT "scholarship_applications_student_id_fkey";

-- DropForeignKey
ALTER TABLE "scholarship_recipients" DROP CONSTRAINT "scholarship_recipients_scholarship_id_fkey";

-- DropForeignKey
ALTER TABLE "scholarship_recipients" DROP CONSTRAINT "scholarship_recipients_student_id_fkey";

-- DropForeignKey
ALTER TABLE "sport_matches" DROP CONSTRAINT "sport_matches_away_team_id_fkey";

-- DropForeignKey
ALTER TABLE "sport_matches" DROP CONSTRAINT "sport_matches_home_team_id_fkey";

-- DropForeignKey
ALTER TABLE "sport_matches" DROP CONSTRAINT "sport_matches_sport_id_fkey";

-- DropForeignKey
ALTER TABLE "sport_players" DROP CONSTRAINT "sport_players_student_id_fkey";

-- DropForeignKey
ALTER TABLE "sport_players" DROP CONSTRAINT "sport_players_team_id_fkey";

-- DropForeignKey
ALTER TABLE "sport_teams" DROP CONSTRAINT "sport_teams_sport_id_fkey";

-- DropForeignKey
ALTER TABLE "staff_attendance" DROP CONSTRAINT "staff_attendance_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "student_leave_requests" DROP CONSTRAINT "student_leave_requests_student_id_fkey";

-- DropForeignKey
ALTER TABLE "student_remarks" DROP CONSTRAINT "student_remarks_student_id_fkey";

-- DropForeignKey
ALTER TABLE "student_remarks" DROP CONSTRAINT "student_remarks_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_class_id_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_user_id_fkey";

-- DropForeignKey
ALTER TABLE "subject_teachers" DROP CONSTRAINT "subject_teachers_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "subject_teachers" DROP CONSTRAINT "subject_teachers_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "teachers" DROP CONSTRAINT "teachers_user_id_fkey";

-- DropForeignKey
ALTER TABLE "timetable" DROP CONSTRAINT "timetable_class_id_fkey";

-- DropForeignKey
ALTER TABLE "timetable" DROP CONSTRAINT "timetable_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "timetable" DROP CONSTRAINT "timetable_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "timetable_substitutions" DROP CONSTRAINT "timetable_substitutions_original_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "timetable_substitutions" DROP CONSTRAINT "timetable_substitutions_substitute_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "timetable_substitutions" DROP CONSTRAINT "timetable_substitutions_timetable_id_fkey";

-- DropForeignKey
ALTER TABLE "transport_students" DROP CONSTRAINT "transport_students_route_id_fkey";

-- DropForeignKey
ALTER TABLE "transport_students" DROP CONSTRAINT "transport_students_student_id_fkey";

-- DropForeignKey
ALTER TABLE "vaccinations" DROP CONSTRAINT "vaccinations_student_id_fkey";

-- DropTable
DROP TABLE "admission_applications";

-- DropTable
DROP TABLE "alumni";

-- DropTable
DROP TABLE "announcements";

-- DropTable
DROP TABLE "assignment_submissions";

-- DropTable
DROP TABLE "assignments";

-- DropTable
DROP TABLE "attendance";

-- DropTable
DROP TABLE "audit_logs";

-- DropTable
DROP TABLE "canteen_menu";

-- DropTable
DROP TABLE "canteen_orders";

-- DropTable
DROP TABLE "certificates";

-- DropTable
DROP TABLE "class_subjects";

-- DropTable
DROP TABLE "classes";

-- DropTable
DROP TABLE "club_activities";

-- DropTable
DROP TABLE "club_members";

-- DropTable
DROP TABLE "clubs";

-- DropTable
DROP TABLE "disciplinary_actions";

-- DropTable
DROP TABLE "documents";

-- DropTable
DROP TABLE "events";

-- DropTable
DROP TABLE "exams";

-- DropTable
DROP TABLE "expenses";

-- DropTable
DROP TABLE "fee_invoices";

-- DropTable
DROP TABLE "fee_payments";

-- DropTable
DROP TABLE "fee_structures";

-- DropTable
DROP TABLE "grades";

-- DropTable
DROP TABLE "grievance_responses";

-- DropTable
DROP TABLE "grievances";

-- DropTable
DROP TABLE "health_records";

-- DropTable
DROP TABLE "homework";

-- DropTable
DROP TABLE "homework_completions";

-- DropTable
DROP TABLE "hostel_allocations";

-- DropTable
DROP TABLE "hostel_rooms";

-- DropTable
DROP TABLE "hostels";

-- DropTable
DROP TABLE "inventory_categories";

-- DropTable
DROP TABLE "inventory_items";

-- DropTable
DROP TABLE "inventory_transactions";

-- DropTable
DROP TABLE "leave_applications";

-- DropTable
DROP TABLE "library_books";

-- DropTable
DROP TABLE "library_transactions";

-- DropTable
DROP TABLE "messages";

-- DropTable
DROP TABLE "notifications";

-- DropTable
DROP TABLE "parent_student";

-- DropTable
DROP TABLE "parents";

-- DropTable
DROP TABLE "pt_meeting_bookings";

-- DropTable
DROP TABLE "pt_meeting_slots";

-- DropTable
DROP TABLE "pt_meetings";

-- DropTable
DROP TABLE "report_card_subjects";

-- DropTable
DROP TABLE "report_cards";

-- DropTable
DROP TABLE "salaries";

-- DropTable
DROP TABLE "scholarship_applications";

-- DropTable
DROP TABLE "scholarship_recipients";

-- DropTable
DROP TABLE "scholarships";

-- DropTable
DROP TABLE "settings";

-- DropTable
DROP TABLE "sport_matches";

-- DropTable
DROP TABLE "sport_players";

-- DropTable
DROP TABLE "sport_teams";

-- DropTable
DROP TABLE "sports";

-- DropTable
DROP TABLE "staff_attendance";

-- DropTable
DROP TABLE "student_leave_requests";

-- DropTable
DROP TABLE "student_remarks";

-- DropTable
DROP TABLE "students";

-- DropTable
DROP TABLE "subject_teachers";

-- DropTable
DROP TABLE "subjects";

-- DropTable
DROP TABLE "teachers";

-- DropTable
DROP TABLE "timetable";

-- DropTable
DROP TABLE "timetable_substitutions";

-- DropTable
DROP TABLE "transport_routes";

-- DropTable
DROP TABLE "transport_students";

-- DropTable
DROP TABLE "users";

-- DropTable
DROP TABLE "vaccinations";

-- DropTable
DROP TABLE "visitors";

-- DropEnum
DROP TYPE "AdmissionStatus";

-- DropEnum
DROP TYPE "ApplicationStatus";

-- DropEnum
DROP TYPE "AttendanceStatus";

-- DropEnum
DROP TYPE "BloodGroup";

-- DropEnum
DROP TYPE "Caste";

-- DropEnum
DROP TYPE "CertificateStatus";

-- DropEnum
DROP TYPE "DisbursementStatus";

-- DropEnum
DROP TYPE "DisciplinaryType";

-- DropEnum
DROP TYPE "DocumentType";

-- DropEnum
DROP TYPE "ExamType";

-- DropEnum
DROP TYPE "FeeFrequency";

-- DropEnum
DROP TYPE "FeeInvoiceStatus";

-- DropEnum
DROP TYPE "Gender";

-- DropEnum
DROP TYPE "GrievanceCategory";

-- DropEnum
DROP TYPE "GrievanceStatus";

-- DropEnum
DROP TYPE "HealthRecordType";

-- DropEnum
DROP TYPE "LeaveStatus";

-- DropEnum
DROP TYPE "LeaveType";

-- DropEnum
DROP TYPE "LibraryTransactionStatus";

-- DropEnum
DROP TYPE "MaritalStatus";

-- DropEnum
DROP TYPE "NotificationPriority";

-- DropEnum
DROP TYPE "NotificationType";

-- DropEnum
DROP TYPE "PTMeetingStatus";

-- DropEnum
DROP TYPE "ParentRelationship";

-- DropEnum
DROP TYPE "PaymentMethod";

-- DropEnum
DROP TYPE "PaymentMode";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "Religion";

-- DropEnum
DROP TYPE "RemarkSeverity";

-- DropEnum
DROP TYPE "RemarkType";

-- DropEnum
DROP TYPE "SalaryStatus";

-- DropEnum
DROP TYPE "ScholarshipType";

-- DropEnum
DROP TYPE "Severity";

-- DropEnum
DROP TYPE "StudentCategory";

-- DropEnum
DROP TYPE "StudentStatus";

-- DropEnum
DROP TYPE "TeacherStatus";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "platform_users" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "PlatformUserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "school_name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "custom_domain" TEXT,
    "subscription_plan_id" TEXT,
    "status" "SchoolStatus" NOT NULL DEFAULT 'TRIAL',
    "trial_ends_at" TIMESTAMP(3),
    "admin_name" TEXT NOT NULL,
    "admin_email" TEXT NOT NULL,
    "admin_phone" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "pin_code" TEXT,
    "logo_url" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#3B82F6',
    "secondary_color" TEXT NOT NULL DEFAULT '#10B981',
    "max_students" INTEGER NOT NULL DEFAULT 100,
    "max_teachers" INTEGER NOT NULL DEFAULT 20,
    "max_storage_gb" INTEGER NOT NULL DEFAULT 5,
    "db_host" TEXT NOT NULL DEFAULT 'localhost',
    "db_name" TEXT NOT NULL,
    "db_schema" TEXT NOT NULL DEFAULT 'public',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "plan_name" TEXT NOT NULL,
    "plan_code" TEXT NOT NULL,
    "description" TEXT,
    "price_monthly" DECIMAL(10,2) NOT NULL,
    "price_yearly" DECIMAL(10,2) NOT NULL,
    "max_students" INTEGER NOT NULL,
    "max_teachers" INTEGER NOT NULL,
    "max_storage_gb" INTEGER NOT NULL,
    "features" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "billing_cycle" "BillingCycle" NOT NULL,
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "cancelled_at" TIMESTAMP(3),
    "stripe_subscription_id" TEXT,
    "razorpay_subscription_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "payment_method" TEXT,
    "payment_transaction_id" TEXT,
    "description" TEXT,
    "items" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "ticket_number" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "created_by_user_id" TEXT,
    "created_by_name" TEXT NOT NULL,
    "created_by_email" TEXT NOT NULL,
    "assigned_to_user_id" TEXT,
    "messages" JSONB,
    "attachments" JSONB,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "setting_key" TEXT NOT NULL,
    "setting_value" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "school_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_users_email_key" ON "platform_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "schools_subdomain_key" ON "schools"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_plan_code_key" ON "subscription_plans"("plan_code");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_ticket_number_key" ON "support_tickets"("ticket_number");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_setting_key_key" ON "system_settings"("setting_key");

-- CreateIndex
CREATE INDEX "platform_audit_logs_user_id_idx" ON "platform_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "platform_audit_logs_school_id_idx" ON "platform_audit_logs"("school_id");

-- CreateIndex
CREATE INDEX "platform_audit_logs_action_idx" ON "platform_audit_logs"("action");

-- CreateIndex
CREATE INDEX "platform_audit_logs_created_at_idx" ON "platform_audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_subscription_plan_id_fkey" FOREIGN KEY ("subscription_plan_id") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "platform_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "platform_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
