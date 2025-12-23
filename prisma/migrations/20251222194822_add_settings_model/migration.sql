-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "school_name" TEXT,
    "school_address" TEXT,
    "school_email" TEXT,
    "school_phone" TEXT,
    "school_logo" TEXT,
    "current_academic_year" TEXT,
    "academic_year_start_month" INTEGER DEFAULT 4,
    "min_attendance_percentage" INTEGER DEFAULT 75,
    "late_arrival_time" TEXT DEFAULT '09:30',
    "working_days" TEXT[] DEFAULT ARRAY['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']::TEXT[],
    "late_fee_percentage" INTEGER DEFAULT 5,
    "late_fee_grace_period" INTEGER DEFAULT 7,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sms_enabled" BOOLEAN NOT NULL DEFAULT false,
    "push_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);
