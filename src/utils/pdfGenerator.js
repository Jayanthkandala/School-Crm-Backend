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

module.exports = {
    generateFeeReceiptPDF,
    generateCertificatePDF,
    generateReportPDF
};
