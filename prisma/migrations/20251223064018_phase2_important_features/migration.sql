-- CreateEnum
CREATE TYPE "HealthRecordType" AS ENUM ('CHECKUP', 'ILLNESS', 'INJURY', 'ALLERGY', 'CHRONIC_CONDITION', 'DENTAL', 'VISION', 'HEARING', 'OTHER');

-- CreateEnum
CREATE TYPE "PTMeetingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "ScholarshipType" AS ENUM ('MERIT_BASED', 'NEED_BASED', 'SPORTS', 'CULTURAL', 'MINORITY', 'GOVERNMENT', 'PRIVATE', 'OTHER');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "DisbursementStatus" AS ENUM ('AWARDED', 'PROCESSING', 'DISBURSED', 'CANCELLED', 'ON_HOLD');

-- CreateTable
CREATE TABLE "health_records" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "record_date" DATE NOT NULL,
    "record_type" "HealthRecordType" NOT NULL,
    "description" TEXT NOT NULL,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "prescribed_by" TEXT,
    "prescribed_medicine" TEXT,
    "follow_up_date" DATE,
    "attachments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccinations" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "vaccine_name" TEXT NOT NULL,
    "dose_number" INTEGER NOT NULL,
    "administered_on" DATE NOT NULL,
    "next_due_date" DATE,
    "administered_by" TEXT,
    "batch_number" TEXT,
    "location" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vaccinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pt_meetings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "meeting_date" DATE NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "slot_duration" INTEGER NOT NULL DEFAULT 15,
    "venue" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pt_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pt_meeting_slots" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_booked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pt_meeting_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pt_meeting_bookings" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "slot_id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "purpose" TEXT,
    "status" "PTMeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "feedback" TEXT,
    "teacher_notes" TEXT,
    "booked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pt_meeting_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarships" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "scholarship_type" "ScholarshipType" NOT NULL,
    "criteria" TEXT NOT NULL,
    "eligibility" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "max_recipients" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scholarships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarship_applications" (
    "id" TEXT NOT NULL,
    "scholarship_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "application_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "documents" TEXT,
    "family_income" DECIMAL(12,2),
    "reason" TEXT,
    "remarks" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "review_comments" TEXT,

    CONSTRAINT "scholarship_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarship_recipients" (
    "id" TEXT NOT NULL,
    "scholarship_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "academic_year" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "awarded_date" DATE NOT NULL,
    "disbursed_date" DATE,
    "status" "DisbursementStatus" NOT NULL DEFAULT 'AWARDED',
    "disbursement_mode" TEXT,
    "transaction_id" TEXT,
    "remarks" TEXT,

    CONSTRAINT "scholarship_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "health_records_student_id_idx" ON "health_records"("student_id");

-- CreateIndex
CREATE INDEX "health_records_record_date_idx" ON "health_records"("record_date");

-- CreateIndex
CREATE INDEX "health_records_record_type_idx" ON "health_records"("record_type");

-- CreateIndex
CREATE INDEX "vaccinations_student_id_idx" ON "vaccinations"("student_id");

-- CreateIndex
CREATE INDEX "vaccinations_vaccine_name_idx" ON "vaccinations"("vaccine_name");

-- CreateIndex
CREATE INDEX "pt_meetings_meeting_date_idx" ON "pt_meetings"("meeting_date");

-- CreateIndex
CREATE INDEX "pt_meetings_is_active_idx" ON "pt_meetings"("is_active");

-- CreateIndex
CREATE INDEX "pt_meeting_slots_meeting_id_idx" ON "pt_meeting_slots"("meeting_id");

-- CreateIndex
CREATE INDEX "pt_meeting_slots_teacher_id_idx" ON "pt_meeting_slots"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "pt_meeting_bookings_slot_id_key" ON "pt_meeting_bookings"("slot_id");

-- CreateIndex
CREATE INDEX "pt_meeting_bookings_meeting_id_idx" ON "pt_meeting_bookings"("meeting_id");

-- CreateIndex
CREATE INDEX "pt_meeting_bookings_parent_id_idx" ON "pt_meeting_bookings"("parent_id");

-- CreateIndex
CREATE INDEX "pt_meeting_bookings_student_id_idx" ON "pt_meeting_bookings"("student_id");

-- CreateIndex
CREATE INDEX "pt_meeting_bookings_status_idx" ON "pt_meeting_bookings"("status");

-- CreateIndex
CREATE INDEX "scholarships_is_active_idx" ON "scholarships"("is_active");

-- CreateIndex
CREATE INDEX "scholarships_scholarship_type_idx" ON "scholarships"("scholarship_type");

-- CreateIndex
CREATE INDEX "scholarship_applications_scholarship_id_idx" ON "scholarship_applications"("scholarship_id");

-- CreateIndex
CREATE INDEX "scholarship_applications_student_id_idx" ON "scholarship_applications"("student_id");

-- CreateIndex
CREATE INDEX "scholarship_applications_status_idx" ON "scholarship_applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "scholarship_applications_scholarship_id_student_id_key" ON "scholarship_applications"("scholarship_id", "student_id");

-- CreateIndex
CREATE INDEX "scholarship_recipients_scholarship_id_idx" ON "scholarship_recipients"("scholarship_id");

-- CreateIndex
CREATE INDEX "scholarship_recipients_student_id_idx" ON "scholarship_recipients"("student_id");

-- CreateIndex
CREATE INDEX "scholarship_recipients_status_idx" ON "scholarship_recipients"("status");

-- CreateIndex
CREATE UNIQUE INDEX "scholarship_recipients_scholarship_id_student_id_academic_y_key" ON "scholarship_recipients"("scholarship_id", "student_id", "academic_year");

-- AddForeignKey
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pt_meeting_slots" ADD CONSTRAINT "pt_meeting_slots_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "pt_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pt_meeting_slots" ADD CONSTRAINT "pt_meeting_slots_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pt_meeting_bookings" ADD CONSTRAINT "pt_meeting_bookings_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "pt_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pt_meeting_bookings" ADD CONSTRAINT "pt_meeting_bookings_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "pt_meeting_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pt_meeting_bookings" ADD CONSTRAINT "pt_meeting_bookings_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pt_meeting_bookings" ADD CONSTRAINT "pt_meeting_bookings_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarship_applications" ADD CONSTRAINT "scholarship_applications_scholarship_id_fkey" FOREIGN KEY ("scholarship_id") REFERENCES "scholarships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarship_applications" ADD CONSTRAINT "scholarship_applications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarship_recipients" ADD CONSTRAINT "scholarship_recipients_scholarship_id_fkey" FOREIGN KEY ("scholarship_id") REFERENCES "scholarships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarship_recipients" ADD CONSTRAINT "scholarship_recipients_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
