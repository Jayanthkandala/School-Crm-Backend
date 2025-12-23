-- CreateEnum
CREATE TYPE "DisciplinaryType" AS ENUM ('WARNING', 'DETENTION', 'SUSPENSION', 'EXPULSION', 'COMMUNITY_SERVICE', 'PARENT_MEETING', 'COUNSELING');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('MINOR', 'MODERATE', 'MAJOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "GrievanceCategory" AS ENUM ('ACADEMIC', 'ADMINISTRATIVE', 'INFRASTRUCTURE', 'TEACHER_CONDUCT', 'STUDENT_CONDUCT', 'FEE_RELATED', 'TRANSPORT', 'LIBRARY', 'CANTEEN', 'HOSTEL', 'OTHER');

-- CreateEnum
CREATE TYPE "GrievanceStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED');

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "building" TEXT,
ADD COLUMN     "current_strength" INTEGER DEFAULT 0,
ADD COLUMN     "floor" INTEGER,
ADD COLUMN     "room_number" TEXT;

-- CreateTable
CREATE TABLE "homework" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assigned_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "attachments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homework_completions" (
    "id" TEXT NOT NULL,
    "homework_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "completed_date" DATE,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "acknowledged_by" TEXT,
    "acknowledged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "homework_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplinary_actions" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "action_type" "DisciplinaryType" NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "action_date" DATE NOT NULL,
    "severity" "Severity" NOT NULL,
    "action_taken" TEXT NOT NULL,
    "issued_by" TEXT NOT NULL,
    "parent_notified" BOOLEAN NOT NULL DEFAULT false,
    "notified_at" TIMESTAMP(3),
    "resolved_date" DATE,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disciplinary_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grievances" (
    "id" TEXT NOT NULL,
    "submitted_by" TEXT NOT NULL,
    "submitter_type" "UserRole" NOT NULL,
    "category" "GrievanceCategory" NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "GrievanceStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_to" TEXT,
    "assigned_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "resolution" TEXT,

    CONSTRAINT "grievances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grievance_responses" (
    "id" TEXT NOT NULL,
    "grievance_id" TEXT NOT NULL,
    "responded_by" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "responded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grievance_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_substitutions" (
    "id" TEXT NOT NULL,
    "timetable_id" TEXT NOT NULL,
    "original_teacher_id" TEXT NOT NULL,
    "substitute_teacher_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timetable_substitutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sports" (
    "id" TEXT NOT NULL,
    "sport_name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "coach" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sport_teams" (
    "id" TEXT NOT NULL,
    "sport_id" TEXT NOT NULL,
    "team_name" TEXT NOT NULL,
    "captain" TEXT,
    "coach" TEXT,
    "academic_year" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sport_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sport_players" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "position" TEXT,
    "jersey_number" INTEGER,
    "joined_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sport_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sport_matches" (
    "id" TEXT NOT NULL,
    "sport_id" TEXT NOT NULL,
    "home_team_id" TEXT NOT NULL,
    "away_team_id" TEXT NOT NULL,
    "match_date" DATE NOT NULL,
    "venue" TEXT NOT NULL,
    "home_score" INTEGER,
    "away_score" INTEGER,
    "result" TEXT,
    "remarks" TEXT,

    CONSTRAINT "sport_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clubs" (
    "id" TEXT NOT NULL,
    "club_name" TEXT NOT NULL,
    "description" TEXT,
    "incharge" TEXT,
    "meeting_day" TEXT,
    "meeting_time" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_members" (
    "id" TEXT NOT NULL,
    "club_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "role" TEXT DEFAULT 'Member',
    "joined_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "club_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_activities" (
    "id" TEXT NOT NULL,
    "club_id" TEXT NOT NULL,
    "activity_name" TEXT NOT NULL,
    "description" TEXT,
    "activity_date" DATE NOT NULL,
    "venue" TEXT,
    "participants" INTEGER,
    "remarks" TEXT,

    CONSTRAINT "club_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostels" (
    "id" TEXT NOT NULL,
    "hostel_name" TEXT NOT NULL,
    "hostel_type" TEXT NOT NULL,
    "warden" TEXT,
    "capacity" INTEGER NOT NULL,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hostels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_rooms" (
    "id" TEXT NOT NULL,
    "hostel_id" TEXT NOT NULL,
    "room_number" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "room_type" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "current_occupancy" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "hostel_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_allocations" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "allocation_date" DATE NOT NULL,
    "vacate_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "remarks" TEXT,

    CONSTRAINT "hostel_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_categories" (
    "id" TEXT NOT NULL,
    "category_name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "item_code" TEXT,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "min_quantity" INTEGER,
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "performed_by" TEXT NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canteen_menu" (
    "id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canteen_menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canteen_orders" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Pending',

    CONSTRAINT "canteen_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitors" (
    "id" TEXT NOT NULL,
    "visitor_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "person_to_meet" TEXT NOT NULL,
    "visit_date" DATE NOT NULL,
    "check_in" TIMESTAMP(3),
    "check_out" TIMESTAMP(3),
    "id_proof" TEXT,
    "remarks" TEXT,

    CONSTRAINT "visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumni" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "graduation_year" INTEGER NOT NULL,
    "current_occupation" TEXT,
    "company" TEXT,
    "designation" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alumni_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "homework_class_id_idx" ON "homework"("class_id");

-- CreateIndex
CREATE INDEX "homework_subject_id_idx" ON "homework"("subject_id");

-- CreateIndex
CREATE INDEX "homework_teacher_id_idx" ON "homework"("teacher_id");

-- CreateIndex
CREATE INDEX "homework_due_date_idx" ON "homework"("due_date");

-- CreateIndex
CREATE INDEX "homework_completions_homework_id_idx" ON "homework_completions"("homework_id");

-- CreateIndex
CREATE INDEX "homework_completions_student_id_idx" ON "homework_completions"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "homework_completions_homework_id_student_id_key" ON "homework_completions"("homework_id", "student_id");

-- CreateIndex
CREATE INDEX "disciplinary_actions_student_id_idx" ON "disciplinary_actions"("student_id");

-- CreateIndex
CREATE INDEX "disciplinary_actions_action_date_idx" ON "disciplinary_actions"("action_date");

-- CreateIndex
CREATE INDEX "disciplinary_actions_severity_idx" ON "disciplinary_actions"("severity");

-- CreateIndex
CREATE INDEX "grievances_submitted_by_idx" ON "grievances"("submitted_by");

-- CreateIndex
CREATE INDEX "grievances_status_idx" ON "grievances"("status");

-- CreateIndex
CREATE INDEX "grievances_category_idx" ON "grievances"("category");

-- CreateIndex
CREATE INDEX "grievance_responses_grievance_id_idx" ON "grievance_responses"("grievance_id");

-- CreateIndex
CREATE INDEX "timetable_substitutions_timetable_id_idx" ON "timetable_substitutions"("timetable_id");

-- CreateIndex
CREATE INDEX "timetable_substitutions_date_idx" ON "timetable_substitutions"("date");

-- CreateIndex
CREATE INDEX "sports_is_active_idx" ON "sports"("is_active");

-- CreateIndex
CREATE INDEX "sport_teams_sport_id_idx" ON "sport_teams"("sport_id");

-- CreateIndex
CREATE INDEX "sport_teams_academic_year_idx" ON "sport_teams"("academic_year");

-- CreateIndex
CREATE INDEX "sport_players_team_id_idx" ON "sport_players"("team_id");

-- CreateIndex
CREATE INDEX "sport_players_student_id_idx" ON "sport_players"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "sport_players_team_id_student_id_key" ON "sport_players"("team_id", "student_id");

-- CreateIndex
CREATE INDEX "sport_matches_sport_id_idx" ON "sport_matches"("sport_id");

-- CreateIndex
CREATE INDEX "sport_matches_match_date_idx" ON "sport_matches"("match_date");

-- CreateIndex
CREATE INDEX "clubs_is_active_idx" ON "clubs"("is_active");

-- CreateIndex
CREATE INDEX "club_members_club_id_idx" ON "club_members"("club_id");

-- CreateIndex
CREATE INDEX "club_members_student_id_idx" ON "club_members"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "club_members_club_id_student_id_key" ON "club_members"("club_id", "student_id");

-- CreateIndex
CREATE INDEX "club_activities_club_id_idx" ON "club_activities"("club_id");

-- CreateIndex
CREATE INDEX "club_activities_activity_date_idx" ON "club_activities"("activity_date");

-- CreateIndex
CREATE INDEX "hostels_is_active_idx" ON "hostels"("is_active");

-- CreateIndex
CREATE INDEX "hostel_rooms_hostel_id_idx" ON "hostel_rooms"("hostel_id");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_rooms_hostel_id_room_number_key" ON "hostel_rooms"("hostel_id", "room_number");

-- CreateIndex
CREATE INDEX "hostel_allocations_room_id_idx" ON "hostel_allocations"("room_id");

-- CreateIndex
CREATE INDEX "hostel_allocations_student_id_idx" ON "hostel_allocations"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_item_code_key" ON "inventory_items"("item_code");

-- CreateIndex
CREATE INDEX "inventory_items_category_id_idx" ON "inventory_items"("category_id");

-- CreateIndex
CREATE INDEX "inventory_transactions_item_id_idx" ON "inventory_transactions"("item_id");

-- CreateIndex
CREATE INDEX "inventory_transactions_transaction_date_idx" ON "inventory_transactions"("transaction_date");

-- CreateIndex
CREATE INDEX "canteen_menu_is_available_idx" ON "canteen_menu"("is_available");

-- CreateIndex
CREATE INDEX "canteen_orders_student_id_idx" ON "canteen_orders"("student_id");

-- CreateIndex
CREATE INDEX "canteen_orders_order_date_idx" ON "canteen_orders"("order_date");

-- CreateIndex
CREATE INDEX "visitors_visit_date_idx" ON "visitors"("visit_date");

-- CreateIndex
CREATE UNIQUE INDEX "alumni_student_id_key" ON "alumni"("student_id");

-- CreateIndex
CREATE INDEX "alumni_graduation_year_idx" ON "alumni"("graduation_year");

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_completions" ADD CONSTRAINT "homework_completions_homework_id_fkey" FOREIGN KEY ("homework_id") REFERENCES "homework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_completions" ADD CONSTRAINT "homework_completions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplinary_actions" ADD CONSTRAINT "disciplinary_actions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grievance_responses" ADD CONSTRAINT "grievance_responses_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "grievances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_substitutions" ADD CONSTRAINT "timetable_substitutions_timetable_id_fkey" FOREIGN KEY ("timetable_id") REFERENCES "timetable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_substitutions" ADD CONSTRAINT "timetable_substitutions_original_teacher_id_fkey" FOREIGN KEY ("original_teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_substitutions" ADD CONSTRAINT "timetable_substitutions_substitute_teacher_id_fkey" FOREIGN KEY ("substitute_teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport_teams" ADD CONSTRAINT "sport_teams_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport_players" ADD CONSTRAINT "sport_players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "sport_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport_players" ADD CONSTRAINT "sport_players_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport_matches" ADD CONSTRAINT "sport_matches_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport_matches" ADD CONSTRAINT "sport_matches_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "sport_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport_matches" ADD CONSTRAINT "sport_matches_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "sport_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_activities" ADD CONSTRAINT "club_activities_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_rooms" ADD CONSTRAINT "hostel_rooms_hostel_id_fkey" FOREIGN KEY ("hostel_id") REFERENCES "hostels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_allocations" ADD CONSTRAINT "hostel_allocations_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "hostel_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_allocations" ADD CONSTRAINT "hostel_allocations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "inventory_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canteen_orders" ADD CONSTRAINT "canteen_orders_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canteen_orders" ADD CONSTRAINT "canteen_orders_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "canteen_menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni" ADD CONSTRAINT "alumni_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
