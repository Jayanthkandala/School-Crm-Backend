/**
 * Calculate attendance percentage
 * @param {number} present - Days present
 * @param {number} total - Total days
 * @returns {number} Percentage (0-100)
 */
function calculateAttendancePercentage(present, total) {
    if (total === 0) return 0;
    return Math.round((present / total) * 100 * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate grade point based on marks
 * @param {number} marksObtained 
 * @param {number} maxMarks 
 * @returns {{percentage: number, grade: string, gradePoint: number}}
 */
function calculateGrade(marksObtained, maxMarks) {
    const percentage = (marksObtained / maxMarks) * 100;

    let grade, gradePoint;

    if (percentage >= 90) {
        grade = 'A+';
        gradePoint = 10;
    } else if (percentage >= 80) {
        grade = 'A';
        gradePoint = 9;
    } else if (percentage >= 70) {
        grade = 'B+';
        gradePoint = 8;
    } else if (percentage >= 60) {
        grade = 'B';
        gradePoint = 7;
    } else if (percentage >= 50) {
        grade = 'C+';
        gradePoint = 6;
    } else if (percentage >= 40) {
        grade = 'C';
        gradePoint = 5;
    } else if (percentage >= 33) {
        grade = 'D';
        gradePoint = 4;
    } else {
        grade = 'F';
        gradePoint = 0;
    }

    return {
        percentage: Math.round(percentage * 100) / 100,
        grade,
        gradePoint,
    };
}

/**
 * Calculate late fee based on days overdue
 * @param {number} amount - Original amount
 * @param {Date} dueDate - Due date
 * @param {number} lateFeePerDay - Late fee per day (default: 10)
 * @returns {number}
 */
function calculateLateFee(amount, dueDate, lateFeePerDay = 10) {
    const today = new Date();
    const due = new Date(dueDate);

    if (today <= due) return 0;

    const daysOverdue = Math.floor((today - due) / (1000 * 60 * 60 * 24));
    const lateFee = daysOverdue * lateFeePerDay;

    // Cap late fee at 20% of original amount
    const maxLateFee = amount * 0.20;
    return Math.min(lateFee, maxLateFee);
}

/**
 * Calculate Indian salary components
 * @param {number} basicSalary 
 * @returns {object}
 */
function calculateSalary(basicSalary) {
    // Indian salary structure
    const hra = basicSalary * 0.40; // 40% House Rent Allowance
    const da = basicSalary * 0.12;  // 12% Dearness Allowance
    const grossSalary = basicSalary + hra + da;

    // Deductions
    const pf = basicSalary * 0.12;  // 12% Provident Fund (on basic)
    const tds = grossSalary > 50000 ? grossSalary * 0.10 : 0; // 10% TDS if > 50k

    const totalDeductions = pf + tds;
    const netSalary = grossSalary - totalDeductions;

    return {
        basicSalary: Math.round(basicSalary * 100) / 100,
        hra: Math.round(hra * 100) / 100,
        da: Math.round(da * 100) / 100,
        grossSalary: Math.round(grossSalary * 100) / 100,
        pf: Math.round(pf * 100) / 100,
        tds: Math.round(tds * 100) / 100,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        netSalary: Math.round(netSalary * 100) / 100,
    };
}

/**
 * Calculate CGPA from grade points
 * @param {number[]} gradePoints - Array of grade points
 * @returns {number}
 */
function calculateCGPA(gradePoints) {
    if (gradePoints.length === 0) return 0;

    const sum = gradePoints.reduce((acc, gp) => acc + gp, 0);
    const cgpa = sum / gradePoints.length;

    return Math.round(cgpa * 100) / 100;
}

/**
 * Calculate age from date of birth
 * @param {Date|string} dateOfBirth 
 * @returns {number}
 */
function calculateAge(dateOfBirth) {
    const dob = new Date(dateOfBirth);
    const today = new Date();

    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }

    return age;
}

/**
 * Calculate discount amount
 * @param {number} amount 
 * @param {number} discountPercent 
 * @returns {number}
 */
function calculateDiscount(amount, discountPercent) {
    return Math.round((amount * discountPercent / 100) * 100) / 100;
}

/**
 * Calculate tax (GST)
 * @param {number} amount 
 * @param {number} taxPercent - Default 18% GST
 * @returns {number}
 */
function calculateTax(amount, taxPercent = 18) {
    return Math.round((amount * taxPercent / 100) * 100) / 100;
}

/**
 * Calculate total with tax and discount
 * @param {number} amount 
 * @param {number} discountPercent 
 * @param {number} taxPercent 
 * @returns {object}
 */
function calculateTotal(amount, discountPercent = 0, taxPercent = 0) {
    const discount = calculateDiscount(amount, discountPercent);
    const amountAfterDiscount = amount - discount;
    const tax = calculateTax(amountAfterDiscount, taxPercent);
    const total = amountAfterDiscount + tax;

    return {
        amount,
        discount,
        amountAfterDiscount,
        tax,
        total: Math.round(total * 100) / 100,
    };
}

module.exports = {
    calculateAttendancePercentage,
    calculateGrade,
    calculateLateFee,
    calculateSalary,
    calculateCGPA,
    calculateAge,
    calculateDiscount,
    calculateTax,
    calculateTotal,
};
