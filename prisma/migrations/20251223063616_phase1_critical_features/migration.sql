/*
  Warnings:

  - The values [MID_TERM,FINAL] on the enum `ExamType` will be removed. If these variants are still used in the database, this will fail.
  - The `blood_group` column on the `students` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[aadhar_number]` on the table `parents` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[aadhar_number]` on the table `teachers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pan_number]` on the table `teachers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE');

-- CreateEnum
CREATE TYPE "Religion" AS ENUM ('HINDU', 'MUSLIM', 'CHRISTIAN', 'SIKH', 'BUDDHIST', 'JAIN', 'PARSI', 'OTHER');

-- CreateEnum
CREATE TYPE "Caste" AS ENUM ('GENERAL', 'OBC', 'SC', 'ST', 'OTHER');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('TRANSFER_CERTIFICATE', 'BIRTH_CERTIFICATE', 'AADHAR_CARD', 'MARKSHEET', 'PHOTO', 'MEDICAL_CERTIFICATE', 'INCOME_CERTIFICATE', 'CASTE_CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'CHEQUE', 'ONLINE', 'CARD', 'UPI', 'BANK_TRANSFER', 'DD');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ANNOUNCEMENT', 'ASSIGNMENT', 'EXAM', 'FEE', 'ATTENDANCE', 'GRADE', 'LEAVE', 'MESSAGE', 'GENERAL', 'ALERT');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- AlterEnum
BEGIN;
CREATE TYPE "ExamType_new" AS ENUM ('INTERNAL', 'EXTERNAL', 'BOARD', 'UNIT_TEST', 'TERMINAL', 'HALF_YEARLY', 'ANNUAL');
ALTER TABLE "exams" ALTER COLUMN "exam_type" TYPE "ExamType_new" USING ("exam_type"::text::"ExamType_new");
ALTER TYPE "ExamType" RENAME TO "ExamType_old";
ALTER TYPE "ExamType_new" RENAME TO "ExamType";
DROP TYPE "ExamType_old";
COMMIT;

-- AlterTable
ALTER TABLE "parents" ADD COLUMN     "aadhar_number" TEXT,
ADD COLUMN     "designation" TEXT,
ADD COLUMN     "employer" TEXT,
ADD COLUMN     "office_address" TEXT,
ADD COLUMN     "office_phone" TEXT,
ADD COLUMN     "pan_number" TEXT,
ADD COLUMN     "qualification" TEXT;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "caste" "Caste",
ADD COLUMN     "emergency_contact" TEXT,
ADD COLUMN     "emergency_phone" TEXT,
ADD COLUMN     "height" DECIMAL(5,2),
ADD COLUMN     "mother_tongue" TEXT,
ADD COLUMN     "nationality" TEXT DEFAULT 'Indian',
ADD COLUMN     "religion" "Religion",
ADD COLUMN     "transfer_cert_no" TEXT,
ADD COLUMN     "weight" DECIMAL(5,2),
DROP COLUMN "blood_group",
ADD COLUMN     "blood_group" "BloodGroup";

-- AlterTable
ALTER TABLE "teachers" ADD COLUMN     "aadhar_number" TEXT,
ADD COLUMN     "bank_account" TEXT,
ADD COLUMN     "bank_name" TEXT,
ADD COLUMN     "emergency_contact" TEXT,
ADD COLUMN     "emergency_phone" TEXT,
ADD COLUMN     "ifsc_code" TEXT,
ADD COLUMN     "marital_status" "MaritalStatus",
ADD COLUMN     "number_of_children" INTEGER DEFAULT 0,
ADD COLUMN     "pan_number" TEXT,
ADD COLUMN     "spouse_name" TEXT;

-- CreateTable
CREATE TABLE "staff_attendance" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "check_in" TIMESTAMP(3),
    "check_out" TIMESTAMP(3),
    "working_hours" DECIMAL(4,2),
    "remarks" TEXT,
    "marked_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_cards" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "academic_year" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "total_marks" DECIMAL(10,2) NOT NULL,
    "obtained_marks" DECIMAL(10,2) NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "grade" TEXT,
    "rank" INTEGER,
    "attendance" DECIMAL(5,2),
    "remarks" TEXT,
    "teacher_remarks" TEXT,
    "principal_remarks" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generated_by" TEXT,

    CONSTRAINT "report_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_card_subjects" (
    "id" TEXT NOT NULL,
    "report_card_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "total_marks" DECIMAL(10,2) NOT NULL,
    "obtained_marks" DECIMAL(10,2) NOT NULL,
    "grade" TEXT,
    "remarks" TEXT,

    CONSTRAINT "report_card_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "student_id" TEXT,
    "teacher_id" TEXT,
    "document_type" "DocumentType" NOT NULL,
    "document_name" TEXT NOT NULL,
    "document_number" TEXT,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiry_date" DATE,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "action_url" TEXT,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staff_attendance_teacher_id_idx" ON "staff_attendance"("teacher_id");

-- CreateIndex
CREATE INDEX "staff_attendance_date_idx" ON "staff_attendance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "staff_attendance_teacher_id_date_key" ON "staff_attendance"("teacher_id", "date");

-- CreateIndex
CREATE INDEX "report_cards_student_id_idx" ON "report_cards"("student_id");

-- CreateIndex
CREATE INDEX "report_cards_exam_id_idx" ON "report_cards"("exam_id");

-- CreateIndex
CREATE INDEX "report_cards_academic_year_idx" ON "report_cards"("academic_year");

-- CreateIndex
CREATE UNIQUE INDEX "report_cards_student_id_exam_id_key" ON "report_cards"("student_id", "exam_id");

-- CreateIndex
CREATE INDEX "report_card_subjects_report_card_id_idx" ON "report_card_subjects"("report_card_id");

-- CreateIndex
CREATE INDEX "report_card_subjects_subject_id_idx" ON "report_card_subjects"("subject_id");

-- CreateIndex
CREATE INDEX "documents_student_id_idx" ON "documents"("student_id");

-- CreateIndex
CREATE INDEX "documents_teacher_id_idx" ON "documents"("teacher_id");

-- CreateIndex
CREATE INDEX "documents_document_type_idx" ON "documents"("document_type");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "parents_aadhar_number_key" ON "parents"("aadhar_number");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_aadhar_number_key" ON "teachers"("aadhar_number");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_pan_number_key" ON "teachers"("pan_number");

-- AddForeignKey
ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_card_subjects" ADD CONSTRAINT "report_card_subjects_report_card_id_fkey" FOREIGN KEY ("report_card_id") REFERENCES "report_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_card_subjects" ADD CONSTRAINT "report_card_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
