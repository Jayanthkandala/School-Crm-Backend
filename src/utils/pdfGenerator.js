const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate Fee Receipt PDF
 */
const generateFeeReceiptPDF = async (receiptData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const filename = `receipt_${receiptData.receiptNumber}_${Date.now()}.pdf`;
            const filepath = path.join(__dirname, '../../uploads/receipts', filename);

            // Ensure directory exists
            const dir = path.dirname(filepath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // Header
            doc.fontSize(20).text('FEE RECEIPT', { align: 'center' });
            doc.moveDown();

            // School Info
            doc.fontSize(12).text(receiptData.schoolName, { align: 'center' });
            doc.fontSize(10).text(receiptData.schoolAddress || '', { align: 'center' });
            doc.moveDown(2);

            // Receipt Details
            doc.fontSize(12).text(`Receipt No: ${receiptData.receiptNumber}`, { align: 'right' });
            doc.text(`Date: ${new Date(receiptData.paymentDate).toLocaleDateString('en-IN')}`, { align: 'right' });
            doc.moveDown();

            // Student Details
            doc.fontSize(14).text('Student Details', { underline: true });
            doc.fontSize(10);
            doc.text(`Name: ${receiptData.studentName}`);
            doc.text(`Admission No: ${receiptData.admissionNumber}`);
            doc.text(`Class: ${receiptData.className}`);
            doc.moveDown();

            // Payment Details
            doc.fontSize(14).text('Payment Details', { underline: true });
            doc.fontSize(10);
            doc.text(`Amount Paid: ₹${receiptData.amount.toFixed(2)}`);
            doc.text(`Payment Method: ${receiptData.paymentMethod}`);
            doc.text(`Transaction ID: ${receiptData.transactionId || 'N/A'}`);
            doc.moveDown(2);

            // Footer
            doc.fontSize(10).text('This is a computer-generated receipt and does not require a signature.', {
                align: 'center',
                italics: true
            });

            doc.end();

            stream.on('finish', () => {
                resolve({ filepath, filename });
            });

            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate Certificate PDF
 */
const generateCertificatePDF = async (certificateData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
            const filename = `certificate_${certificateData.certificateNumber}_${Date.now()}.pdf`;
            const filepath = path.join(__dirname, '../../uploads/certificates', filename);

            // Ensure directory exists
            const dir = path.dirname(filepath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // Border
            doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();
            doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50).stroke();

            // Header
            doc.fontSize(30).font('Helvetica-Bold')
                .text('CERTIFICATE OF ACHIEVEMENT', { align: 'center' });
            doc.moveDown(2);

            // Body
            doc.fontSize(16).font('Helvetica')
                .text('This is to certify that', { align: 'center' });
            doc.moveDown();

            doc.fontSize(24).font('Helvetica-Bold')
                .text(certificateData.studentName, { align: 'center' });
            doc.moveDown();

            doc.fontSize(14).font('Helvetica')
                .text(`of Class ${certificateData.className}`, { align: 'center' });
            doc.moveDown(2);

            doc.fontSize(16)
                .text(certificateData.description || 'has successfully completed the academic year', {
                    align: 'center'
                });
            doc.moveDown(3);

            // Footer
            const bottomY = doc.page.height - 150;
            doc.fontSize(12);
            doc.text(`Date: ${new Date(certificateData.issueDate).toLocaleDateString('en-IN')}`, 100, bottomY);
            doc.text('Principal Signature', doc.page.width - 250, bottomY, { width: 150, align: 'center' });

            doc.fontSize(10).text(`Certificate No: ${certificateData.certificateNumber}`, {
                align: 'center'
            }, bottomY + 40);

            doc.end();

            stream.on('finish', () => {
                resolve({ filepath, filename });
            });

            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate Report PDF (Generic)
 */
const generateReportPDF = async (reportData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const filename = `report_${reportData.reportType}_${Date.now()}.pdf`;
            const filepath = path.join(__dirname, '../../uploads/reports', filename);

            // Ensure directory exists
            const dir = path.dirname(filepath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // Header
            doc.fontSize(18).text(reportData.title || 'Report', { align: 'center' });
            doc.moveDown();

            doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
            doc.moveDown(2);

            // Content
            if (reportData.sections) {
                reportData.sections.forEach(section => {
                    doc.fontSize(14).text(section.title, { underline: true });
                    doc.fontSize(10);
                    doc.moveDown(0.5);

                    if (section.content) {
                        doc.text(section.content);
                    }

                    if (section.table) {
                        // Simple table rendering
                        section.table.forEach((row, index) => {
                            const rowText = row.join(' | ');
                            doc.text(rowText, { continued: false });
                            if (index === 0) {
                                doc.moveDown(0.3);
                                doc.text('─'.repeat(80));
                            }
                        });
                    }

                    doc.moveDown(2);
                });
            }

            doc.end();

            stream.on('finish', () => {
                resolve({ filepath, filename });
            });

            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate Hall Ticket PDF
 */
const generateHallTicketPDF = async (ticketData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const filename = `hall_ticket_${ticketData.student.admissionNumber}_${Date.now()}.pdf`;
            const filepath = path.join(__dirname, '../../uploads/reports', filename);

            const dir = path.dirname(filepath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // Header
            doc.rect(0, 0, doc.page.width, 100).fill('#2c3e50');
            doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold')
                .text(ticketData.schoolName || 'SCHOOL CRM', 0, 30, { align: 'center' });
            doc.fontSize(16).text('EXAMINATION HALL TICKET', 0, 60, { align: 'center' });

            doc.fillColor('#000000').moveDown(4);

            // Student & Exam Details Grid
            const startY = 120;
            doc.fontSize(12).font('Helvetica-Bold');

            // Left Column
            doc.text('Student Name:', 50, startY);
            doc.font('Helvetica').text(ticketData.student.name, 150, startY);

            doc.font('Helvetica-Bold').text('Admission No:', 50, startY + 20);
            doc.font('Helvetica').text(ticketData.student.admissionNumber, 150, startY + 20);

            doc.font('Helvetica-Bold').text('Class:', 50, startY + 40);
            doc.font('Helvetica').text(ticketData.student.class, 150, startY + 40);

            // Right Column
            doc.font('Helvetica-Bold').text('Exam:', 350, startY);
            doc.font('Helvetica').text(ticketData.exam.name, 450, startY);

            doc.font('Helvetica-Bold').text('Academic Year:', 350, startY + 20);
            doc.font('Helvetica').text(ticketData.exam.academicYear, 450, startY + 20);

            doc.font('Helvetica-Bold').text('Roll Number:', 350, startY + 40);
            doc.font('Helvetica').text(ticketData.student.rollNumber || 'N/A', 450, startY + 40);

            // Photo Placeholder
            doc.rect(480, 30, 80, 80).stroke();
            doc.fontSize(10).text('Student Photo', 490, 65, { width: 60, align: 'center' });

            doc.moveDown(4);

            // Timetable Table
            doc.fontSize(14).font('Helvetica-Bold').text('Examination Schedule', 50, 220);
            doc.moveDown(0.5);

            // Table Header
            const tableTop = 245;
            doc.fontSize(10).font('Helvetica-Bold');
            doc.rect(50, tableTop - 5, 500, 20).fill('#ecf0f1');
            doc.fillColor('#000000');
            doc.text('Date', 60, tableTop);
            doc.text('Time', 160, tableTop);
            doc.text('Subject', 280, tableTop);
            doc.text('Room', 450, tableTop);

            // Table Rows
            let rowY = tableTop + 25;
            doc.font('Helvetica');

            if (ticketData.schedule && ticketData.schedule.length > 0) {
                ticketData.schedule.forEach((item) => {
                    doc.text(new Date(item.date).toLocaleDateString(), 60, rowY);
                    doc.text(`${item.startTime} - ${item.endTime}`, 160, rowY);
                    doc.text(item.subject, 280, rowY);
                    doc.text(item.room || 'Hall A', 450, rowY);

                    doc.moveTo(50, rowY + 15).lineTo(550, rowY + 15).strokeColor('#dfe6e9').stroke();
                    rowY += 25;
                });
            } else {
                doc.text('Schedule to be announced', 60, rowY);
            }

            // Instructions
            doc.moveDown(4);
            const instY = rowY + 50;
            doc.fontSize(12).font('Helvetica-Bold').text('Instructions:', 50, instY);
            doc.fontSize(10).font('Helvetica');
            const instructions = [
                '1. Candidate must fill in the particulars on the answer sheet.',
                '2. Calculators and mobile phones are strictly prohibited.',
                '3. Be seated 15 minutes before the exam starts.',
                '4. This hall ticket must be produced on demand.'
            ];

            let iY = instY + 20;
            instructions.forEach(inst => {
                doc.text(inst, 50, iY);
                iY += 15;
            });

            doc.end();

            stream.on('finish', () => resolve({ filepath, filename }));
            stream.on('error', reject);

        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate Report Card PDF
 */
const generateReportCardPDF = async (reportData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const filename = `report_card_${reportData.student.admissionNumber}_${Date.now()}.pdf`;
            const filepath = path.join(__dirname, '../../uploads/reports', filename);

            const dir = path.dirname(filepath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // Header
            doc.fontSize(20).font('Helvetica-Bold').text('PROGRESS REPORT', { align: 'center' });
            doc.fontSize(12).font('Helvetica').text(reportData.exam.academicYear, { align: 'center' });
            doc.moveDown();
            doc.rect(50, 70, 495, 2).fill('#333333');
            doc.moveDown(2);

            // Student Info
            doc.fillColor('#000000');
            doc.fontSize(12).font('Helvetica-Bold').text(`Name: ${reportData.student.name}`);
            doc.text(`Class: ${reportData.student.class}`);
            doc.text(`Admission No: ${reportData.student.admissionNumber}`);
            doc.text(`Exam: ${reportData.exam.name} (${reportData.exam.type})`);
            doc.moveDown(2);

            // Grades Table
            const tableTop = 200;
            doc.rect(50, tableTop, 495, 20).fill('#e0e0e0');
            doc.fillColor('#000000');
            doc.font('Helvetica-Bold').fontSize(10);
            doc.text('Subject', 60, tableTop + 5);
            doc.text('Max Marks', 250, tableTop + 5);
            doc.text('Obtained', 330, tableTop + 5);
            doc.text('Grade', 410, tableTop + 5);
            doc.text('Remarks', 460, tableTop + 5);

            let currentY = tableTop + 30;
            doc.font('Helvetica');

            reportData.grades.forEach((grade) => {
                doc.text(grade.subject, 60, currentY);
                doc.text(grade.maxMarks.toString(), 250, currentY);
                doc.text(grade.obtainedMarks.toString(), 330, currentY);

                // Color code grade
                if (grade.grade === 'F') doc.fillColor('red');
                else doc.fillColor('black');
                doc.text(grade.grade, 410, currentY);
                doc.fillColor('black');

                doc.text(grade.remarks || '-', 460, currentY);
                doc.rect(50, currentY + 15, 495, 1).fill('#ecf0f1'); // Separator
                doc.fillColor('black'); // Reset
                currentY += 25;
            });

            // Summary
            currentY += 20;
            doc.rect(50, currentY, 495, 80).stroke();
            doc.fontSize(12).font('Helvetica-Bold').text('Summary', 60, currentY + 10);

            doc.fontSize(10).font('Helvetica');
            doc.text(`Total Marks: ${reportData.summary.obtainedMarks} / ${reportData.summary.totalMarks}`, 60, currentY + 30);
            doc.text(`Percentage: ${reportData.summary.percentage}%`, 60, currentY + 50);

            const resultColor = reportData.summary.result === 'PASS' ? 'green' : 'red';
            doc.fillColor(resultColor).font('Helvetica-Bold')
                .text(`Result: ${reportData.summary.result}`, 300, currentY + 30);

            doc.fillColor('black').font('Helvetica')
                .text(`Attendance: ${reportData.attendance.percentage}%`, 300, currentY + 50);

            // Footer
            const bottomY = 700;
            doc.text('Class Teacher', 60, bottomY);
            doc.text('Principal', 450, bottomY);

            doc.end();
            stream.on('finish', () => resolve({ filepath, filename }));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    generateFeeReceiptPDF,
    generateCertificatePDF,
    generateReportPDF,
    generateHallTicketPDF,
    generateReportCardPDF
};
