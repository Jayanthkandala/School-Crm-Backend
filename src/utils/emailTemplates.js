/**
 * Professional email templates for School CRM
 */

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e0e0e0;
    }
    .footer {
      background: #f5f5f5;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-radius: 0 0 10px 10px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .credentials {
      background: #f8f9fa;
      padding: 15px;
      border-left: 4px solid #667eea;
      margin: 20px 0;
    }
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .invoice-table th,
    .invoice-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    .invoice-table th {
      background: #f8f9fa;
      font-weight: 600;
    }
    .total {
      font-size: 18px;
      font-weight: bold;
      color: #667eea;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>
`;

/**
 * Welcome email for new school onboarding
 */
const welcomeEmail = (data) => {
  const { schoolName, subdomain, loginUrl, adminEmail, password, planName, trialEndsAt } = data;

  const content = `
    <div class="header">
      <h1>🎉 Welcome to School CRM!</h1>
    </div>
    <div class="content">
      <h2>Congratulations, ${schoolName}!</h2>
      <p>Your school has been successfully onboarded to our platform. We're excited to have you on board!</p>
      
      <div class="credentials">
        <h3>Your Login Credentials</h3>
        <p><strong>Tenant ID:</strong> ${subdomain}</p>
        <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
        <p><strong>Email:</strong> ${adminEmail}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p style="color: #e74c3c;"><em>Please change your password after first login</em></p>
      </div>

      <h3>Your Subscription</h3>
      <p><strong>Plan:</strong> ${planName}</p>
      <p><strong>Trial Period:</strong> 14 days (ends on ${new Date(trialEndsAt).toLocaleDateString('en-IN')})</p>

      <a href="${loginUrl}" class="button">Login to Dashboard</a>

      <h3>Getting Started</h3>
      <ul>
        <li>Setup your school profile</li>
        <li>Add classes and subjects</li>
        <li>Import or add students and teachers</li>
        <li>Configure fee structure</li>
        <li>Start managing your school!</li>
      </ul>

      <p>If you need any help, our support team is here for you!</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} School CRM. All rights reserved.</p>
      <p>Need help? Contact us at support@schoolcrm.com</p>
    </div>
  `;

  return baseTemplate(content);
};

/**
 * Invoice email
 */
const invoiceEmail = (data) => {
  const { schoolName, invoiceNumber, amount, gst, total, dueDate, billingPeriod, paymentUrl } = data;

  const content = `
    <div class="header">
      <h1>📄 Invoice from School CRM</h1>
    </div>
    <div class="content">
      <h2>Invoice for ${schoolName}</h2>
      <p>Dear Admin,</p>
      <p>Please find your invoice details below:</p>

      <table class="invoice-table">
        <tr>
          <th>Invoice Number</th>
          <td>${invoiceNumber}</td>
        </tr>
        <tr>
          <th>Billing Period</th>
          <td>${billingPeriod}</td>
        </tr>
        <tr>
          <th>Due Date</th>
          <td>${new Date(dueDate).toLocaleDateString('en-IN')}</td>
        </tr>
      </table>

      <h3>Invoice Details</h3>
      <table class="invoice-table">
        <tr>
          <th>Description</th>
          <th>Amount</th>
        </tr>
        <tr>
          <td>Subscription Fee</td>
          <td>₹${amount.toFixed(2)}</td>
        </tr>
        <tr>
          <td>GST (18%)</td>
          <td>₹${gst.toFixed(2)}</td>
        </tr>
        <tr>
          <td class="total">Total Amount</td>
          <td class="total">₹${total.toFixed(2)}</td>
        </tr>
      </table>

      <a href="${paymentUrl}" class="button">Pay Now</a>

      <p>Please make the payment before the due date to avoid service interruption.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} School CRM. All rights reserved.</p>
      <p>Questions? Contact billing@schoolcrm.com</p>
    </div>
  `;

  return baseTemplate(content);
};

/**
 * Payment reminder email
 */
const paymentReminderEmail = (data) => {
  const { schoolName, invoiceNumber, amount, dueDate, daysOverdue, paymentUrl } = data;

  const content = `
    <div class="header">
      <h1>⚠️ Payment Reminder</h1>
    </div>
    <div class="content">
      <h2>Payment Due for ${schoolName}</h2>
      <p>Dear Admin,</p>
      <p>This is a ${daysOverdue > 0 ? 'reminder' : 'friendly reminder'} that your invoice is ${daysOverdue > 0 ? 'overdue' : 'due soon'}.</p>

      <div class="credentials" style="border-left-color: ${daysOverdue > 0 ? '#e74c3c' : '#f39c12'};">
        <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
        <p><strong>Amount Due:</strong> ₹${amount.toFixed(2)}</p>
        <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString('en-IN')}</p>
        ${daysOverdue > 0 ? `<p style="color: #e74c3c;"><strong>Days Overdue:</strong> ${daysOverdue}</p>` : ''}
      </div>

      <a href="${paymentUrl}" class="button">Pay Now</a>

      <p>Please make the payment at your earliest convenience to avoid service interruption.</p>
      
      ${daysOverdue >= 30 ? '<p style="color: #e74c3c;"><strong>Important:</strong> Your account will be suspended if payment is not received within 30 days.</p>' : ''}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} School CRM. All rights reserved.</p>
      <p>Already paid? Please ignore this reminder.</p>
    </div>
  `;

  return baseTemplate(content);
};

/**
 * Trial ending reminder
 */
const trialEndingEmail = (data) => {
  const { schoolName, daysRemaining, planName, upgradeUrl } = data;

  const content = `
    <div class="header">
      <h1>⏰ Trial Ending Soon</h1>
    </div>
    <div class="content">
      <h2>Your Trial is Ending, ${schoolName}!</h2>
      <p>Dear Admin,</p>
      <p>Your ${daysRemaining}-day trial period is ending in <strong>${daysRemaining} days</strong>.</p>

      <p>We hope you've enjoyed using School CRM! To continue enjoying all the features, please upgrade to a paid plan.</p>

      <h3>Your Current Plan: ${planName}</h3>

      <a href="${upgradeUrl}" class="button">Upgrade Now</a>

      <h3>What happens after trial ends?</h3>
      <ul>
        <li>Your account will be suspended</li>
        <li>You won't be able to access your data</li>
        <li>All users will be unable to login</li>
      </ul>

      <p>Don't lose access to your school data. Upgrade today!</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} School CRM. All rights reserved.</p>
      <p>Questions? Contact sales@schoolcrm.com</p>
    </div>
  `;

  return baseTemplate(content);
};

/**
 * Password reset email
 */
const passwordResetEmail = (data) => {
  const { fullName, resetUrl, expiresIn } = data;

  const content = `
    <div class="header">
      <h1>🔐 Password Reset Request</h1>
    </div>
    <div class="content">
      <h2>Hello ${fullName},</h2>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>

      <a href="${resetUrl}" class="button">Reset Password</a>

      <p>This link will expire in ${expiresIn} minutes.</p>

      <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>

      <div class="credentials">
        <p><strong>Security Tip:</strong> Never share your password with anyone. School CRM will never ask for your password via email.</p>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} School CRM. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  `;

  return baseTemplate(content);
};

/**
 * Fee payment receipt email
 */
const feeReceiptEmail = (data) => {
  const { studentName, parentName, amount, receiptNumber, paymentDate, paymentMethod } = data;

  const content = `
    <div class="header">
      <h1>✅ Payment Received</h1>
    </div>
    <div class="content">
      <h2>Payment Receipt</h2>
      <p>Dear ${parentName},</p>
      <p>Thank you for your payment. We have successfully received your fee payment for ${studentName}.</p>

      <table class="invoice-table">
        <tr>
          <th>Receipt Number</th>
          <td>${receiptNumber}</td>
        </tr>
        <tr>
          <th>Student Name</th>
          <td>${studentName}</td>
        </tr>
        <tr>
          <th>Amount Paid</th>
          <td class="total">₹${amount.toFixed(2)}</td>
        </tr>
        <tr>
          <th>Payment Date</th>
          <td>${new Date(paymentDate).toLocaleDateString('en-IN')}</td>
        </tr>
        <tr>
          <th>Payment Method</th>
          <td>${paymentMethod}</td>
        </tr>
      </table>

      <p>Please keep this email for your records.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} School CRM. All rights reserved.</p>
      <p>Download PDF receipt from parent portal</p>
    </div>
  `;

  return baseTemplate(content);
};

/**
 * Admission approval email
 */
const admissionApprovalEmail = (data) => {
  const { studentName, parentEmail, admissionNumber, className, password, loginUrl } = data;

  const content = `
    <div class="header">
      <h1>🎉 Admission Approved!</h1>
    </div>
    <div class="content">
      <h2>Congratulations!</h2>
      <p>Dear Parent,</p>
      <p>We are pleased to inform you that <strong>${studentName}</strong> has been admitted to our school.</p>

      <div class="credentials">
        <h3>Student Details</h3>
        <p><strong>Student Name:</strong> ${studentName}</p>
        <p><strong>Admission Number:</strong> ${admissionNumber}</p>
        <p><strong>Class:</strong> ${className}</p>
      </div>

      <div class="credentials">
        <h3>Parent Portal Access</h3>
        <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
        <p><strong>Email:</strong> ${parentEmail}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p style="color: #e74c3c;"><em>Please change your password after first login</em></p>
      </div>

      <a href="${loginUrl}" class="button">Access Parent Portal</a>

      <h3>Next Steps</h3>
      <ul>
        <li>Login to parent portal</li>
        <li>Complete student profile</li>
        <li>Pay admission fees</li>
        <li>Download fee receipt</li>
      </ul>

      <p>Welcome to our school family!</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} School CRM. All rights reserved.</p>
      <p>Questions? Contact admissions@school.com</p>
    </div>
  `;

  return baseTemplate(content);
};

/**
 * Parent account credentials email
 */
const parentCredentialsEmail = (data) => {
  const { parentName, email, password, studentName, loginUrl } = data;

  const content = `
    <div class="header">
      <h1>👨‍👩‍👧 Parent Portal Access</h1>
    </div>
    <div class="content">
      <h2>Welcome ${parentName}!</h2>
      <p>Your parent account has been created successfully.</p>
      
      <div class="credentials">
        <h3>Your Login Credentials</h3>
        <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p style="color: #e74c3c;"><em>Please change your password after first login</em></p>
      </div>

      <p><strong>Student:</strong> ${studentName}</p>

      <a href="${loginUrl}" class="button">Login to Parent Portal</a>

      <h3>What you can do in Parent Portal</h3>
      <ul>
        <li>View student attendance</li>
        <li>Check exam results and grades</li>
        <li>Pay fees online</li>
        <li>Apply for leave</li>
        <li>Communicate with teachers</li>
      </ul>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} School CRM. All rights reserved.</p>
      <p>Need help? Contact support@school.com</p>
    </div>
  `;

  return baseTemplate(content);
};

/**
 * Fee reminder email for parents
 */
const feeReminderEmail = (data) => {
  const { parentName, studentName, amount, dueDate, invoiceNumber, paymentUrl } = data;

  const content = `
    <div class="header">
      <h1>💰 Fee Payment Reminder</h1>
    </div>
    <div class="content">
      <h2>Dear ${parentName},</h2>
      <p>This is a friendly reminder that the fee payment for <strong>${studentName}</strong> is due.</p>
      
      <div class="credentials">
        <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
        <p><strong>Student Name:</strong> ${studentName}</p>
        <p><strong>Amount Due:</strong> ₹${amount.toFixed(2)}</p>
        <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString('en-IN')}</p>
      </div>

      <a href="${paymentUrl}" class="button">Pay Now</a>

      <p>Please make the payment before the due date to avoid late fees.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} School CRM. All rights reserved.</p>
      <p>Already paid? Please ignore this reminder.</p>
    </div>
  `;

  return baseTemplate(content);
};

/**
 * Admission notification email
 */
const admissionNotificationEmail = (data) => {
  const { parentName, studentName, status, remarks } = data;

  const content = `
    <div class="header">
      <h1>📋 Admission Application Update</h1>
    </div>
    <div class="content">
      <h2>Dear ${parentName},</h2>
      <p>We have an update regarding the admission application for <strong>${studentName}</strong>.</p>
      
      <div class="credentials" style="border-left-color: ${status === 'APPROVED' ? '#27ae60' : status === 'REJECTED' ? '#e74c3c' : '#f39c12'};">
        <p><strong>Application Status:</strong> ${status}</p>
        ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
      </div>

      ${status === 'APPROVED' ? '<p>Congratulations! Please check your email for further instructions.</p>' : ''}
      ${status === 'REJECTED' ? '<p>We appreciate your interest. You may reapply next academic year.</p>' : ''}
      ${status === 'PENDING' ? '<p>Your application is under review. We will notify you once a decision is made.</p>' : ''}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} School CRM. All rights reserved.</p>
      <p>Questions? Contact admissions@school.com</p>
    </div>
  `;

  return baseTemplate(content);
};

// Support Ticket Created Email
const supportTicketCreatedEmail = (data) => {
  const { ticketNumber, subject, category, priority, schoolName } = data;

  const content = `
    <h2 style="color: #2563eb; margin-bottom: 20px;">Support Ticket Created</h2>
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      A new support ticket has been created for <strong>${schoolName}</strong>.
    </p>
    
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 10px 0;"><strong>Ticket Number:</strong> ${ticketNumber}</p>
      <p style="margin: 10px 0;"><strong>Subject:</strong> ${subject}</p>
      <p style="margin: 10px 0;"><strong>Category:</strong> ${category}</p>
      <p style="margin: 10px 0;"><strong>Priority:</strong> ${priority}</p>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
      Our support team will review your ticket and respond shortly.
    </p>
  `;

  return baseTemplate(content);
};

// Support Ticket Assigned Email
const supportTicketAssignedEmail = (data) => {
  const { ticketNumber, subject, assignedTo } = data;

  const content = `
    <h2 style="color: #2563eb; margin-bottom: 20px;">Ticket Assigned to You</h2>
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Hello <strong>${assignedTo}</strong>,
    </p>
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      A support ticket has been assigned to you.
    </p>
    
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 10px 0;"><strong>Ticket Number:</strong> ${ticketNumber}</p>
      <p style="margin: 10px 0;"><strong>Subject:</strong> ${subject}</p>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
      Please review and respond to this ticket at your earliest convenience.
    </p>
  `;

  return baseTemplate(content);
};

// Support Ticket Response Email
const supportTicketResponseEmail = (data) => {
  const { ticketNumber, subject, responderName, message } = data;

  const content = `
    <h2 style="color: #2563eb; margin-bottom: 20px;">New Response on Your Ticket</h2>
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      <strong>${responderName}</strong> has responded to your support ticket.
    </p>
    
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 10px 0;"><strong>Ticket Number:</strong> ${ticketNumber}</p>
      <p style="margin: 10px 0;"><strong>Subject:</strong> ${subject}</p>
      <div style="margin-top: 15px; padding: 15px; background-color: white; border-left: 4px solid #2563eb;">
        ${message}
      </div>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
      Login to view the full conversation and respond.
    </p>
  `;

  return baseTemplate(content);
};

// School Suspension Email
const schoolSuspensionEmail = (data) => {
  const { schoolName, reason, contactEmail } = data;

  const content = `
    <h2 style="color: #dc2626; margin-bottom: 20px;">Account Suspended</h2>
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Dear <strong>${schoolName}</strong>,
    </p>
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Your school account has been temporarily suspended.
    </p>
    
    <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
      <p style="margin: 10px 0;"><strong>Reason:</strong> ${reason}</p>
    </div>

    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Please contact our support team at <strong>${contactEmail}</strong> to resolve this issue.
    </p>

    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
      All user access has been temporarily disabled until this is resolved.
    </p>
  `;

  return baseTemplate(content);
};

// Payment Confirmation Email
const paymentConfirmationEmail = (data) => {
  const { schoolName, invoiceNumber, amount, paymentDate, transactionId } = data;

  const content = `
    <h2 style="color: #10b981; margin-bottom: 20px;">Payment Received</h2>
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Dear <strong>${schoolName}</strong>,
    </p>
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      We have successfully received your payment.
    </p>
    
    <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
      <p style="margin: 10px 0;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
      <p style="margin: 10px 0;"><strong>Amount:</strong> ₹${amount}</p>
      <p style="margin: 10px 0;"><strong>Payment Date:</strong> ${paymentDate}</p>
      <p style="margin: 10px 0;"><strong>Transaction ID:</strong> ${transactionId}</p>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
      Thank you for your payment. Your subscription is now active.
    </p>
  `;

  return baseTemplate(content);
};

// Admission Status Change Email
const admissionStatusChangeEmail = (data) => {
  const { parentName, studentName, status, remarks, nextSteps } = data;

  const content = `
    <h2 style="color: #2563eb; margin-bottom: 20px;">Admission Status Update</h2>
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Dear <strong>${parentName}</strong>,
    </p>
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      The admission status for <strong>${studentName}</strong> has been updated.
    </p>
    
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: ${status === 'APPROVED' ? '#10b981' : '#dc2626'};">${status}</span></p>
      ${remarks ? `<p style="margin: 10px 0;"><strong>Remarks:</strong> ${remarks}</p>` : ''}
      ${nextSteps ? `<p style="margin: 10px 0;"><strong>Next Steps:</strong> ${nextSteps}</p>` : ''}
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
      For any questions, please contact the school administration.
    </p>
  `;

  return baseTemplate(content);
};

module.exports = {
  welcomeEmail,
  invoiceEmail,
  paymentReminderEmail,
  trialEndingEmail,
  passwordResetEmail,
  feeReceiptEmail,
  admissionApprovalEmail,
  parentCredentialsEmail,
  feeReminderEmail,
  admissionNotificationEmail,
  supportTicketCreatedEmail,
  supportTicketAssignedEmail,
  supportTicketResponseEmail,
  schoolSuspensionEmail,
  paymentConfirmationEmail,
  admissionStatusChangeEmail,
};
