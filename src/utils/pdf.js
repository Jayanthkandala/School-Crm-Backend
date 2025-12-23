const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate fee receipt PDF
 */
async function generateReceiptPDF(payment, invoice, student) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const fileName = `receipt-${payment.id}.pdf`;
            const filePath = path.join(__dirname, '../../temp', fileName);

            // Ensure temp directory exists
            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header
            doc.fontSize(24).text('FEE RECEIPT', { align: 'center' });
            doc.moveDown(0.5);

            // School details
            doc.fontSize(14).text('School Name', { align: 'center' });
            doc.fontSize(10).text('Address Line 1, City, State - PIN', { align: 'center' });
            doc.text('Phone: +91-XXXXXXXXXX | Email: info@school.com', { align: 'center' });
            doc.moveDown(1);

            // Horizontal line
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);

            // Receipt details
            doc.fontSize(12);
            doc.text(`Receipt No: ${payment.id}`, 50, doc.y);
            doc.text(`Date: ${new Date(payment.paymentDate).toLocaleDateString('en-IN')}`, 350, doc.y - 12);
            doc.moveDown(1);

            // Student details
            doc.fontSize(11);
            doc.text(`Student Name: ${student.user.fullName}`);
            doc.text(`Admission No: ${student.admissionNumber}`);
            doc.text(`Class: ${student.class.className} - ${student.section || ''}`);
            doc.moveDown(1);

            // Payment details table
            doc.fontSize(12).text('Payment Details:', { underline: true });
            doc.moveDown(0.5);

            const tableTop = doc.y;
            const col1 = 50;
            const col2 = 300;

            doc.fontSize(10);
            doc.text('Invoice Number:', col1, tableTop);
            doc.text(invoice.invoiceNumber, col2, tableTop);

            doc.text('Amount Paid:', col1, tableTop + 20);
            doc.text(`₹${Number(payment.amount).toFixed(2)}`, col2, tableTop + 20);

            doc.text('Payment Method:', col1, tableTop + 40);
            doc.text(payment.paymentMethod, col2, tableTop + 40);

            if (payment.transactionId) {
                doc.text('Transaction ID:', col1, tableTop + 60);
                doc.text(payment.transactionId, col2, tableTop + 60);
            }

            doc.moveDown(5);

            // Footer
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);
            doc.fontSize(9).text('This is a computer-generated receipt and does not require a signature.', { align: 'center' });
            doc.text('Thank you for your payment!', { align: 'center' });

            doc.end();

            stream.on('finish', () => {
                resolve(filePath);
            });

            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate report card PDF
 */
async function generateReportCardPDF(student, grades, exam) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const fileName = `reportcard-${student.id}-${exam.id}.pdf`;
            const filePath = path.join(__dirname, '../../temp', fileName);

            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header
            doc.fontSize(24).text('REPORT CARD', { align: 'center' });
            doc.moveDown(0.5);

            // School details
            doc.fontSize(14).text('School Name', { align: 'center' });
            doc.fontSize(10).text('Academic Year: 2024-25', { align: 'center' });
            doc.moveDown(1);

            // Student details
            doc.fontSize(12);
            doc.text(`Student Name: ${student.user.fullName}`);
            doc.text(`Admission No: ${student.admissionNumber}`);
            doc.text(`Class: ${student.class.className}`);
            doc.text(`Exam: ${exam.examName}`);
            doc.moveDown(1);

            // Grades table header
            doc.fontSize(11);
            const tableTop = doc.y;
            const col1 = 50;
            const col2 = 250;
            const col3 = 350;
            const col4 = 450;

            doc.text('Subject', col1, tableTop);
            doc.text('Marks', col2, tableTop);
            doc.text('Grade', col3, tableTop);
            doc.text('Remarks', col4, tableTop);

            // Line under header
            doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

            let y = tableTop + 25;
            let totalMarks = 0;
            let maxMarks = 0;

            // Grades data
            doc.fontSize(10);
            grades.forEach(grade => {
                doc.text(grade.subject.subjectName, col1, y);
                doc.text(`${grade.marksObtained}/${grade.maxMarks}`, col2, y);
                doc.text(grade.grade, col3, y);
                doc.text(grade.remarks || '-', col4, y, { width: 100 });

                totalMarks += Number(grade.marksObtained);
                maxMarks += Number(grade.maxMarks);
                y += 20;
            });

            // Total line
            doc.moveTo(50, y).lineTo(550, y).stroke();
            y += 10;

            // Summary
            doc.fontSize(11);
            doc.text(`Total Marks: ${totalMarks}/${maxMarks}`, col1, y);
            const percentage = ((totalMarks / maxMarks) * 100).toFixed(2);
            doc.text(`Percentage: ${percentage}%`, col2, y);

            let result = 'PASS';
            if (percentage < 33) result = 'FAIL';
            else if (percentage >= 75) result = 'DISTINCTION';
            else if (percentage >= 60) result = 'FIRST CLASS';
            else if (percentage >= 45) result = 'SECOND CLASS';

            doc.text(`Result: ${result}`, col3, y);

            // Footer
            doc.moveDown(3);
            doc.fontSize(9).text('Principal Signature: _______________', 50, doc.y);
            doc.text('Date: _______________', 350, doc.y - 12);

            doc.end();

            stream.on('finish', () => {
                resolve(filePath);
            });

            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate salary slip PDF
 */
async function generateSalarySlipPDF(salary, teacher) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const fileName = `salary-${salary.id}.pdf`;
            const filePath = path.join(__dirname, '../../temp', fileName);

            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header
            doc.fontSize(24).text('SALARY SLIP', { align: 'center' });
            doc.moveDown(0.5);

            // School details
            doc.fontSize(14).text('School Name', { align: 'center' });
            doc.fontSize(10).text('Address Line 1, City, State - PIN', { align: 'center' });
            doc.moveDown(1);

            // Employee details
            doc.fontSize(12);
            doc.text(`Employee Name: ${teacher.user.fullName}`);
            doc.text(`Employee ID: ${teacher.employeeId}`);
            doc.text(`Month: ${salary.month}`);
            doc.moveDown(1);

            // Salary breakdown
            const tableTop = doc.y;
            const col1 = 50;
            const col2 = 300;

            doc.fontSize(11).text('EARNINGS', col1, tableTop, { underline: true });
            doc.text('AMOUNT (₹)', col2, tableTop, { underline: true });
            doc.moveDown(0.5);

            let y = doc.y;
            doc.fontSize(10);
            doc.text('Basic Salary', col1, y);
            doc.text(Number(salary.basicSalary).toFixed(2), col2, y);
            y += 20;

            doc.text('HRA (40%)', col1, y);
            doc.text(Number(salary.hra).toFixed(2), col2, y);
            y += 20;

            doc.text('DA (12%)', col1, y);
            doc.text(Number(salary.da).toFixed(2), col2, y);
            y += 20;

            const grossSalary = Number(salary.basicSalary) + Number(salary.hra) + Number(salary.da);
            doc.fontSize(11);
            doc.text('Gross Salary', col1, y);
            doc.text(grossSalary.toFixed(2), col2, y);
            y += 30;

            // Deductions
            doc.text('DEDUCTIONS', col1, y, { underline: true });
            y += 20;

            doc.fontSize(10);
            doc.text('PF (12%)', col1, y);
            doc.text(Number(salary.pf).toFixed(2), col2, y);
            y += 20;

            doc.text('TDS', col1, y);
            doc.text(Number(salary.tds).toFixed(2), col2, y);
            y += 20;

            if (salary.otherDeductions > 0) {
                doc.text('Other Deductions', col1, y);
                doc.text(Number(salary.otherDeductions).toFixed(2), col2, y);
                y += 20;
            }

            const totalDeductions = Number(salary.pf) + Number(salary.tds) + Number(salary.otherDeductions);
            doc.fontSize(11);
            doc.text('Total Deductions', col1, y);
            doc.text(totalDeductions.toFixed(2), col2, y);
            y += 30;

            // Net salary
            doc.fontSize(14);
            doc.text('NET SALARY', col1, y);
            doc.text(`₹${Number(salary.netSalary).toFixed(2)}`, col2, y);

            // Footer
            doc.moveDown(3);
            doc.fontSize(9).text('This is a computer-generated salary slip.', { align: 'center' });

            doc.end();

            stream.on('finish', () => {
                resolve(filePath);
            });

            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate certificate PDF
 */
async function generateCertificatePDF(certificate, student) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const fileName = `certificate-${certificate.id}.pdf`;
            const filePath = path.join(__dirname, '../../temp', fileName);

            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Border
            doc.rect(30, 30, 535, 750).stroke();
            doc.rect(35, 35, 525, 740).stroke();

            // Header
            doc.fontSize(28).text('CERTIFICATE', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(16).text(certificate.certificateType.toUpperCase(), { align: 'center' });
            doc.moveDown(2);

            // Content
            doc.fontSize(12).text('This is to certify that', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(20).text(student.user.fullName, { align: 'center', underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12).text(`Admission No: ${student.admissionNumber}`, { align: 'center' });
            doc.text(`Class: ${student.class.className}`, { align: 'center' });
            doc.moveDown(1);

            // Certificate specific content
            if (certificate.certificateType === 'BONAFIDE') {
                doc.text('is a bonafide student of this institution.', { align: 'center' });
            } else if (certificate.certificateType === 'TRANSFER') {
                doc.text('has been studying in this institution and is hereby granted', { align: 'center' });
                doc.text('a Transfer Certificate.', { align: 'center' });
            } else if (certificate.certificateType === 'CHARACTER') {
                doc.text('has been a student of good character and conduct.', { align: 'center' });
            }

            doc.moveDown(2);
            doc.fontSize(11).text(`Certificate No: ${certificate.certificateNumber}`, { align: 'center' });
            doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });

            // Signatures
            doc.moveDown(4);
            doc.fontSize(10);
            doc.text('Class Teacher', 100, doc.y);
            doc.text('Principal', 400, doc.y - 12);

            doc.end();

            stream.on('finish', () => {
                resolve(filePath);
            });

            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generateReceiptPDF,
    generateReportCardPDF,
    generateSalarySlipPDF,
    generateCertificatePDF,
};
