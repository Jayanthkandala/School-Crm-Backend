const PDFDocument = require('pdfkit');

/**
 * Generate Student ID Card PDF
 * @param {Object} student - Student object with class and user details
 * @param {Object} school - School details
 * @returns {Promise<Buffer>} - PDF Buffer
 */
const generateIDCardPDF = (student, school) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: [242.64, 153.36], // ID Card Size (85.6mm x 54mm) -> points
                margin: 0
            });

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Background Color (Light Blue)
            doc.rect(0, 0, 242.64, 153.36).fill('#f0f9ff');

            // Header (School Name)
            doc.rect(0, 0, 242.64, 30).fill('#2563eb'); // Blue header
            doc.fillColor('#ffffff')
                .fontSize(10)
                .font('Helvetica-Bold')
                .text("SCHOOL CRM DEMO SCHOOL", 0, 10, { align: 'center', width: 242.64 });

            // Borders
            doc.lineWidth(1)
                .strokeColor('#2563eb')
                .rect(5, 5, 232.64, 143.36)
                .stroke();

            // Photo Placeholder (Left)
            doc.rect(15, 45, 60, 70).fill('#e2e8f0');
            doc.fillColor('#64748b')
                .fontSize(8)
                .text('PHOTO', 15, 75, { width: 60, align: 'center' });

            // Details (Right)
            const startX = 85;
            let currentY = 45;
            const lineHeight = 12;

            doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold')
                .text(student.user.fullName.toUpperCase(), startX, currentY);

            currentY += 15;
            doc.fontSize(8).font('Helvetica')
                .text(`Class: ${student.class.className}-${student.class.section}`, startX, currentY);

            currentY += lineHeight;
            doc.text(`Roll No: ${student.rollNumber || 'N/A'}`, startX, currentY);

            currentY += lineHeight;
            doc.text(`Adm No: ${student.admissionNumber}`, startX, currentY);

            currentY += lineHeight;
            doc.text(`DOB: ${student.user.dateOfBirth ? new Date(student.user.dateOfBirth).toLocaleDateString() : 'N/A'}`, startX, currentY);

            currentY += lineHeight;
            doc.text(`Blood Group: ${student.bloodGroup || 'N/A'}`, startX, currentY);

            // Footer (Valid Till)
            const validTill = new Date(new Date().getFullYear() + 1, 3, 31).toLocaleDateString();
            doc.fontSize(7).fillColor('#64748b')
                .text(`Valid Till: ${validTill}`, 15, 135, { align: 'center', width: 212 });

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    generateIDCardPDF
};
