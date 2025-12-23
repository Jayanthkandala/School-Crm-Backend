
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  fullName: 'fullName',
  email: 'email',
  phone: 'phone',
  gender: 'gender',
  dateOfBirth: 'dateOfBirth',
  passwordHash: 'passwordHash',
  role: 'role',
  isActive: 'isActive',
  profilePhoto: 'profilePhoto',
  lastLoginAt: 'lastLoginAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TeacherScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  employeeId: 'employeeId',
  qualification: 'qualification',
  specialization: 'specialization',
  experience: 'experience',
  joiningDate: 'joiningDate',
  salary: 'salary',
  casualLeave: 'casualLeave',
  sickLeave: 'sickLeave',
  earnedLeave: 'earnedLeave',
  aadharNumber: 'aadharNumber',
  panNumber: 'panNumber',
  maritalStatus: 'maritalStatus',
  spouseName: 'spouseName',
  numberOfChildren: 'numberOfChildren',
  emergencyContact: 'emergencyContact',
  emergencyPhone: 'emergencyPhone',
  bankName: 'bankName',
  bankAccount: 'bankAccount',
  ifscCode: 'ifscCode',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StudentScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  admissionNumber: 'admissionNumber',
  rollNumber: 'rollNumber',
  classId: 'classId',
  section: 'section',
  dateOfBirth: 'dateOfBirth',
  gender: 'gender',
  bloodGroup: 'bloodGroup',
  aadhaarNumber: 'aadhaarNumber',
  category: 'category',
  address: 'address',
  city: 'city',
  state: 'state',
  pinCode: 'pinCode',
  previousSchool: 'previousSchool',
  transferCertNo: 'transferCertNo',
  nationality: 'nationality',
  religion: 'religion',
  caste: 'caste',
  motherTongue: 'motherTongue',
  emergencyContact: 'emergencyContact',
  emergencyPhone: 'emergencyPhone',
  medicalConditions: 'medicalConditions',
  allergies: 'allergies',
  height: 'height',
  weight: 'weight',
  admissionDate: 'admissionDate',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ParentScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  relationship: 'relationship',
  occupation: 'occupation',
  annualIncome: 'annualIncome',
  address: 'address',
  city: 'city',
  state: 'state',
  pinCode: 'pinCode',
  aadharNumber: 'aadharNumber',
  panNumber: 'panNumber',
  qualification: 'qualification',
  employer: 'employer',
  designation: 'designation',
  officeAddress: 'officeAddress',
  officePhone: 'officePhone',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ParentStudentScalarFieldEnum = {
  id: 'id',
  parentId: 'parentId',
  studentId: 'studentId',
  isPrimary: 'isPrimary',
  createdAt: 'createdAt'
};

exports.Prisma.ClassScalarFieldEnum = {
  id: 'id',
  className: 'className',
  section: 'section',
  academicYear: 'academicYear',
  classTeacherId: 'classTeacherId',
  maxStudents: 'maxStudents',
  roomNumber: 'roomNumber',
  floor: 'floor',
  building: 'building',
  currentStrength: 'currentStrength',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SubjectScalarFieldEnum = {
  id: 'id',
  subjectName: 'subjectName',
  subjectCode: 'subjectCode',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ClassSubjectScalarFieldEnum = {
  id: 'id',
  classId: 'classId',
  subjectId: 'subjectId',
  isOptional: 'isOptional',
  createdAt: 'createdAt'
};

exports.Prisma.SubjectTeacherScalarFieldEnum = {
  id: 'id',
  teacherId: 'teacherId',
  subjectId: 'subjectId',
  createdAt: 'createdAt'
};

exports.Prisma.AttendanceScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  classId: 'classId',
  date: 'date',
  status: 'status',
  remarks: 'remarks',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ExamScalarFieldEnum = {
  id: 'id',
  examName: 'examName',
  examType: 'examType',
  classId: 'classId',
  academicYear: 'academicYear',
  startDate: 'startDate',
  endDate: 'endDate',
  totalMarks: 'totalMarks',
  passingMarks: 'passingMarks',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GradeScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  examId: 'examId',
  subjectId: 'subjectId',
  marksObtained: 'marksObtained',
  maxMarks: 'maxMarks',
  grade: 'grade',
  remarks: 'remarks',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AssignmentScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  classId: 'classId',
  subjectId: 'subjectId',
  teacherId: 'teacherId',
  createdBy: 'createdBy',
  dueDate: 'dueDate',
  maxMarks: 'maxMarks',
  attachmentUrl: 'attachmentUrl',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AssignmentSubmissionScalarFieldEnum = {
  id: 'id',
  assignmentId: 'assignmentId',
  studentId: 'studentId',
  submissionText: 'submissionText',
  attachmentUrl: 'attachmentUrl',
  submittedAt: 'submittedAt',
  marksObtained: 'marksObtained',
  feedback: 'feedback',
  gradedAt: 'gradedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FeeStructureScalarFieldEnum = {
  id: 'id',
  classId: 'classId',
  feeType: 'feeType',
  amount: 'amount',
  frequency: 'frequency',
  isMandatory: 'isMandatory',
  academicYear: 'academicYear',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FeeInvoiceScalarFieldEnum = {
  id: 'id',
  invoiceNumber: 'invoiceNumber',
  studentId: 'studentId',
  feeStructureId: 'feeStructureId',
  month: 'month',
  amount: 'amount',
  discount: 'discount',
  lateFee: 'lateFee',
  total: 'total',
  status: 'status',
  dueDate: 'dueDate',
  paidAt: 'paidAt',
  items: 'items',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FeePaymentScalarFieldEnum = {
  id: 'id',
  invoiceId: 'invoiceId',
  amount: 'amount',
  paymentMethod: 'paymentMethod',
  paymentDate: 'paymentDate',
  transactionId: 'transactionId',
  razorpayOrderId: 'razorpayOrderId',
  razorpayPaymentId: 'razorpayPaymentId',
  status: 'status',
  remarks: 'remarks',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AdmissionApplicationScalarFieldEnum = {
  id: 'id',
  applicationNumber: 'applicationNumber',
  studentName: 'studentName',
  dateOfBirth: 'dateOfBirth',
  gender: 'gender',
  classAppliedFor: 'classAppliedFor',
  fatherName: 'fatherName',
  motherName: 'motherName',
  guardianName: 'guardianName',
  phone: 'phone',
  email: 'email',
  address: 'address',
  aadhaarNumber: 'aadhaarNumber',
  category: 'category',
  previousSchool: 'previousSchool',
  documents: 'documents',
  status: 'status',
  rejectionReason: 'rejectionReason',
  interviewDate: 'interviewDate',
  approvedAt: 'approvedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeaveApplicationScalarFieldEnum = {
  id: 'id',
  teacherId: 'teacherId',
  leaveType: 'leaveType',
  fromDate: 'fromDate',
  toDate: 'toDate',
  reason: 'reason',
  status: 'status',
  approvedBy: 'approvedBy',
  approvedAt: 'approvedAt',
  remarks: 'remarks',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ExpenseScalarFieldEnum = {
  id: 'id',
  category: 'category',
  amount: 'amount',
  description: 'description',
  date: 'date',
  paymentMethod: 'paymentMethod',
  billNumber: 'billNumber',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StudentLeaveRequestScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  fromDate: 'fromDate',
  toDate: 'toDate',
  reason: 'reason',
  leaveType: 'leaveType',
  status: 'status',
  remarks: 'remarks',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SalaryScalarFieldEnum = {
  id: 'id',
  teacherId: 'teacherId',
  month: 'month',
  basicSalary: 'basicSalary',
  hra: 'hra',
  da: 'da',
  pf: 'pf',
  tds: 'tds',
  otherDeductions: 'otherDeductions',
  netSalary: 'netSalary',
  status: 'status',
  paidAt: 'paidAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LibraryBookScalarFieldEnum = {
  id: 'id',
  bookTitle: 'bookTitle',
  author: 'author',
  isbn: 'isbn',
  category: 'category',
  publisher: 'publisher',
  quantity: 'quantity',
  available: 'available',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LibraryTransactionScalarFieldEnum = {
  id: 'id',
  bookId: 'bookId',
  studentId: 'studentId',
  issueDate: 'issueDate',
  dueDate: 'dueDate',
  returnDate: 'returnDate',
  fine: 'fine',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TimetableEntryScalarFieldEnum = {
  id: 'id',
  classId: 'classId',
  subjectId: 'subjectId',
  teacherId: 'teacherId',
  dayOfWeek: 'dayOfWeek',
  startTime: 'startTime',
  endTime: 'endTime',
  room: 'room',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CertificateScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  certificateType: 'certificateType',
  certificateNumber: 'certificateNumber',
  issueDate: 'issueDate',
  reason: 'reason',
  status: 'status',
  pdfUrl: 'pdfUrl',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TransportRouteScalarFieldEnum = {
  id: 'id',
  routeName: 'routeName',
  routeNumber: 'routeNumber',
  vehicleNumber: 'vehicleNumber',
  driverName: 'driverName',
  driverPhone: 'driverPhone',
  capacity: 'capacity',
  fee: 'fee',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TransportStudentScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  routeId: 'routeId',
  pickupPoint: 'pickupPoint',
  dropPoint: 'dropPoint',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MessageScalarFieldEnum = {
  id: 'id',
  senderId: 'senderId',
  recipientId: 'recipientId',
  subject: 'subject',
  message: 'message',
  isRead: 'isRead',
  readAt: 'readAt',
  createdAt: 'createdAt'
};

exports.Prisma.AnnouncementScalarFieldEnum = {
  id: 'id',
  title: 'title',
  content: 'content',
  targetAudience: 'targetAudience',
  priority: 'priority',
  publishDate: 'publishDate',
  expiryDate: 'expiryDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EventScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  eventDate: 'eventDate',
  location: 'location',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StudentRemarkScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  teacherId: 'teacherId',
  remarkType: 'remarkType',
  remark: 'remark',
  severity: 'severity',
  createdAt: 'createdAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  action: 'action',
  entityType: 'entityType',
  entityId: 'entityId',
  oldValues: 'oldValues',
  newValues: 'newValues',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  createdAt: 'createdAt'
};

exports.Prisma.SettingsScalarFieldEnum = {
  id: 'id',
  schoolName: 'schoolName',
  schoolAddress: 'schoolAddress',
  schoolEmail: 'schoolEmail',
  schoolPhone: 'schoolPhone',
  schoolLogo: 'schoolLogo',
  currentAcademicYear: 'currentAcademicYear',
  academicYearStartMonth: 'academicYearStartMonth',
  minAttendancePercentage: 'minAttendancePercentage',
  lateArrivalTime: 'lateArrivalTime',
  workingDays: 'workingDays',
  lateFeePercentage: 'lateFeePercentage',
  lateFeeGracePeriod: 'lateFeeGracePeriod',
  emailEnabled: 'emailEnabled',
  smsEnabled: 'smsEnabled',
  pushEnabled: 'pushEnabled',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StaffAttendanceScalarFieldEnum = {
  id: 'id',
  teacherId: 'teacherId',
  date: 'date',
  status: 'status',
  checkIn: 'checkIn',
  checkOut: 'checkOut',
  workingHours: 'workingHours',
  remarks: 'remarks',
  markedBy: 'markedBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReportCardScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  examId: 'examId',
  academicYear: 'academicYear',
  term: 'term',
  totalMarks: 'totalMarks',
  obtainedMarks: 'obtainedMarks',
  percentage: 'percentage',
  grade: 'grade',
  rank: 'rank',
  attendance: 'attendance',
  remarks: 'remarks',
  teacherRemarks: 'teacherRemarks',
  principalRemarks: 'principalRemarks',
  generatedAt: 'generatedAt',
  generatedBy: 'generatedBy'
};

exports.Prisma.ReportCardSubjectScalarFieldEnum = {
  id: 'id',
  reportCardId: 'reportCardId',
  subjectId: 'subjectId',
  totalMarks: 'totalMarks',
  obtainedMarks: 'obtainedMarks',
  grade: 'grade',
  remarks: 'remarks'
};

exports.Prisma.DocumentScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  teacherId: 'teacherId',
  documentType: 'documentType',
  documentName: 'documentName',
  documentNumber: 'documentNumber',
  filePath: 'filePath',
  fileSize: 'fileSize',
  mimeType: 'mimeType',
  uploadedBy: 'uploadedBy',
  uploadedAt: 'uploadedAt',
  expiryDate: 'expiryDate',
  isVerified: 'isVerified',
  verifiedBy: 'verifiedBy',
  verifiedAt: 'verifiedAt',
  remarks: 'remarks'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  message: 'message',
  type: 'type',
  priority: 'priority',
  isRead: 'isRead',
  readAt: 'readAt',
  actionUrl: 'actionUrl',
  metadata: 'metadata',
  createdAt: 'createdAt',
  expiresAt: 'expiresAt'
};

exports.Prisma.HealthRecordScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  recordDate: 'recordDate',
  recordType: 'recordType',
  description: 'description',
  diagnosis: 'diagnosis',
  treatment: 'treatment',
  prescribedBy: 'prescribedBy',
  prescribedMedicine: 'prescribedMedicine',
  followUpDate: 'followUpDate',
  attachments: 'attachments',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VaccinationScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  vaccineName: 'vaccineName',
  doseNumber: 'doseNumber',
  administeredOn: 'administeredOn',
  nextDueDate: 'nextDueDate',
  administeredBy: 'administeredBy',
  batchNumber: 'batchNumber',
  location: 'location',
  remarks: 'remarks',
  createdAt: 'createdAt'
};

exports.Prisma.PTMeetingScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  meetingDate: 'meetingDate',
  startTime: 'startTime',
  endTime: 'endTime',
  slotDuration: 'slotDuration',
  venue: 'venue',
  isActive: 'isActive',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PTMeetingSlotScalarFieldEnum = {
  id: 'id',
  meetingId: 'meetingId',
  teacherId: 'teacherId',
  startTime: 'startTime',
  endTime: 'endTime',
  isBooked: 'isBooked',
  createdAt: 'createdAt'
};

exports.Prisma.PTMeetingBookingScalarFieldEnum = {
  id: 'id',
  meetingId: 'meetingId',
  slotId: 'slotId',
  parentId: 'parentId',
  studentId: 'studentId',
  purpose: 'purpose',
  status: 'status',
  feedback: 'feedback',
  teacherNotes: 'teacherNotes',
  bookedAt: 'bookedAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ScholarshipScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  amount: 'amount',
  scholarshipType: 'scholarshipType',
  criteria: 'criteria',
  eligibility: 'eligibility',
  startDate: 'startDate',
  endDate: 'endDate',
  maxRecipients: 'maxRecipients',
  isActive: 'isActive',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ScholarshipApplicationScalarFieldEnum = {
  id: 'id',
  scholarshipId: 'scholarshipId',
  studentId: 'studentId',
  applicationDate: 'applicationDate',
  status: 'status',
  documents: 'documents',
  familyIncome: 'familyIncome',
  reason: 'reason',
  remarks: 'remarks',
  reviewedBy: 'reviewedBy',
  reviewedAt: 'reviewedAt',
  reviewComments: 'reviewComments'
};

exports.Prisma.ScholarshipRecipientScalarFieldEnum = {
  id: 'id',
  scholarshipId: 'scholarshipId',
  studentId: 'studentId',
  academicYear: 'academicYear',
  amount: 'amount',
  awardedDate: 'awardedDate',
  disbursedDate: 'disbursedDate',
  status: 'status',
  disbursementMode: 'disbursementMode',
  transactionId: 'transactionId',
  remarks: 'remarks'
};

exports.Prisma.HomeworkScalarFieldEnum = {
  id: 'id',
  classId: 'classId',
  subjectId: 'subjectId',
  teacherId: 'teacherId',
  title: 'title',
  description: 'description',
  assignedDate: 'assignedDate',
  dueDate: 'dueDate',
  attachments: 'attachments',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HomeworkCompletionScalarFieldEnum = {
  id: 'id',
  homeworkId: 'homeworkId',
  studentId: 'studentId',
  completedDate: 'completedDate',
  isCompleted: 'isCompleted',
  remarks: 'remarks',
  acknowledgedBy: 'acknowledgedBy',
  acknowledgedAt: 'acknowledgedAt',
  createdAt: 'createdAt'
};

exports.Prisma.DisciplinaryActionScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  actionType: 'actionType',
  reason: 'reason',
  description: 'description',
  actionDate: 'actionDate',
  severity: 'severity',
  actionTaken: 'actionTaken',
  issuedBy: 'issuedBy',
  parentNotified: 'parentNotified',
  notifiedAt: 'notifiedAt',
  resolvedDate: 'resolvedDate',
  remarks: 'remarks',
  createdAt: 'createdAt'
};

exports.Prisma.GrievanceScalarFieldEnum = {
  id: 'id',
  submittedBy: 'submittedBy',
  submitterType: 'submitterType',
  category: 'category',
  subject: 'subject',
  description: 'description',
  priority: 'priority',
  status: 'status',
  submittedAt: 'submittedAt',
  assignedTo: 'assignedTo',
  assignedAt: 'assignedAt',
  resolvedAt: 'resolvedAt',
  resolution: 'resolution'
};

exports.Prisma.GrievanceResponseScalarFieldEnum = {
  id: 'id',
  grievanceId: 'grievanceId',
  respondedBy: 'respondedBy',
  response: 'response',
  isInternal: 'isInternal',
  respondedAt: 'respondedAt'
};

exports.Prisma.TimetableSubstitutionScalarFieldEnum = {
  id: 'id',
  timetableId: 'timetableId',
  originalTeacherId: 'originalTeacherId',
  substituteTeacherId: 'substituteTeacherId',
  date: 'date',
  reason: 'reason',
  createdBy: 'createdBy',
  createdAt: 'createdAt'
};

exports.Prisma.SportScalarFieldEnum = {
  id: 'id',
  sportName: 'sportName',
  category: 'category',
  description: 'description',
  coach: 'coach',
  isActive: 'isActive',
  createdAt: 'createdAt'
};

exports.Prisma.SportTeamScalarFieldEnum = {
  id: 'id',
  sportId: 'sportId',
  teamName: 'teamName',
  captain: 'captain',
  coach: 'coach',
  academicYear: 'academicYear',
  createdAt: 'createdAt'
};

exports.Prisma.SportPlayerScalarFieldEnum = {
  id: 'id',
  teamId: 'teamId',
  studentId: 'studentId',
  position: 'position',
  jerseyNumber: 'jerseyNumber',
  joinedDate: 'joinedDate',
  isActive: 'isActive'
};

exports.Prisma.SportMatchScalarFieldEnum = {
  id: 'id',
  sportId: 'sportId',
  homeTeamId: 'homeTeamId',
  awayTeamId: 'awayTeamId',
  matchDate: 'matchDate',
  venue: 'venue',
  homeScore: 'homeScore',
  awayScore: 'awayScore',
  result: 'result',
  remarks: 'remarks'
};

exports.Prisma.ClubScalarFieldEnum = {
  id: 'id',
  clubName: 'clubName',
  description: 'description',
  incharge: 'incharge',
  meetingDay: 'meetingDay',
  meetingTime: 'meetingTime',
  isActive: 'isActive',
  createdAt: 'createdAt'
};

exports.Prisma.ClubMemberScalarFieldEnum = {
  id: 'id',
  clubId: 'clubId',
  studentId: 'studentId',
  role: 'role',
  joinedDate: 'joinedDate',
  isActive: 'isActive'
};

exports.Prisma.ClubActivityScalarFieldEnum = {
  id: 'id',
  clubId: 'clubId',
  activityName: 'activityName',
  description: 'description',
  activityDate: 'activityDate',
  venue: 'venue',
  participants: 'participants',
  remarks: 'remarks'
};

exports.Prisma.HostelScalarFieldEnum = {
  id: 'id',
  hostelName: 'hostelName',
  hostelType: 'hostelType',
  warden: 'warden',
  capacity: 'capacity',
  address: 'address',
  isActive: 'isActive',
  createdAt: 'createdAt'
};

exports.Prisma.HostelRoomScalarFieldEnum = {
  id: 'id',
  hostelId: 'hostelId',
  roomNumber: 'roomNumber',
  floor: 'floor',
  roomType: 'roomType',
  capacity: 'capacity',
  currentOccupancy: 'currentOccupancy',
  isActive: 'isActive'
};

exports.Prisma.HostelAllocationScalarFieldEnum = {
  id: 'id',
  roomId: 'roomId',
  studentId: 'studentId',
  allocationDate: 'allocationDate',
  vacateDate: 'vacateDate',
  isActive: 'isActive',
  remarks: 'remarks'
};

exports.Prisma.InventoryCategoryScalarFieldEnum = {
  id: 'id',
  categoryName: 'categoryName',
  description: 'description',
  createdAt: 'createdAt'
};

exports.Prisma.InventoryItemScalarFieldEnum = {
  id: 'id',
  categoryId: 'categoryId',
  itemName: 'itemName',
  itemCode: 'itemCode',
  description: 'description',
  unit: 'unit',
  quantity: 'quantity',
  minQuantity: 'minQuantity',
  location: 'location',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InventoryTransactionScalarFieldEnum = {
  id: 'id',
  itemId: 'itemId',
  transactionType: 'transactionType',
  quantity: 'quantity',
  reason: 'reason',
  performedBy: 'performedBy',
  transactionDate: 'transactionDate'
};

exports.Prisma.CanteenMenuScalarFieldEnum = {
  id: 'id',
  itemName: 'itemName',
  category: 'category',
  price: 'price',
  isAvailable: 'isAvailable',
  description: 'description',
  createdAt: 'createdAt'
};

exports.Prisma.CanteenOrderScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  menuItemId: 'menuItemId',
  quantity: 'quantity',
  totalAmount: 'totalAmount',
  orderDate: 'orderDate',
  status: 'status'
};

exports.Prisma.VisitorScalarFieldEnum = {
  id: 'id',
  visitorName: 'visitorName',
  phone: 'phone',
  purpose: 'purpose',
  personToMeet: 'personToMeet',
  visitDate: 'visitDate',
  checkIn: 'checkIn',
  checkOut: 'checkOut',
  idProof: 'idProof',
  remarks: 'remarks'
};

exports.Prisma.AlumniScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  graduationYear: 'graduationYear',
  currentOccupation: 'currentOccupation',
  company: 'company',
  designation: 'designation',
  email: 'email',
  phone: 'phone',
  address: 'address',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.Gender = exports.$Enums.Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER'
};

exports.UserRole = exports.$Enums.UserRole = {
  SCHOOL_ADMIN: 'SCHOOL_ADMIN',
  PRINCIPAL: 'PRINCIPAL',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
  ACCOUNTANT: 'ACCOUNTANT',
  LIBRARIAN: 'LIBRARIAN',
  RECEPTIONIST: 'RECEPTIONIST'
};

exports.MaritalStatus = exports.$Enums.MaritalStatus = {
  SINGLE: 'SINGLE',
  MARRIED: 'MARRIED',
  DIVORCED: 'DIVORCED',
  WIDOWED: 'WIDOWED'
};

exports.TeacherStatus = exports.$Enums.TeacherStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ON_LEAVE: 'ON_LEAVE',
  RESIGNED: 'RESIGNED',
  TERMINATED: 'TERMINATED'
};

exports.BloodGroup = exports.$Enums.BloodGroup = {
  A_POSITIVE: 'A_POSITIVE',
  A_NEGATIVE: 'A_NEGATIVE',
  B_POSITIVE: 'B_POSITIVE',
  B_NEGATIVE: 'B_NEGATIVE',
  O_POSITIVE: 'O_POSITIVE',
  O_NEGATIVE: 'O_NEGATIVE',
  AB_POSITIVE: 'AB_POSITIVE',
  AB_NEGATIVE: 'AB_NEGATIVE'
};

exports.StudentCategory = exports.$Enums.StudentCategory = {
  GENERAL: 'GENERAL',
  OBC: 'OBC',
  SC: 'SC',
  ST: 'ST',
  EWS: 'EWS'
};

exports.Religion = exports.$Enums.Religion = {
  HINDU: 'HINDU',
  MUSLIM: 'MUSLIM',
  CHRISTIAN: 'CHRISTIAN',
  SIKH: 'SIKH',
  BUDDHIST: 'BUDDHIST',
  JAIN: 'JAIN',
  PARSI: 'PARSI',
  OTHER: 'OTHER'
};

exports.Caste = exports.$Enums.Caste = {
  GENERAL: 'GENERAL',
  OBC: 'OBC',
  SC: 'SC',
  ST: 'ST',
  OTHER: 'OTHER'
};

exports.StudentStatus = exports.$Enums.StudentStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  GRADUATED: 'GRADUATED',
  TRANSFERRED: 'TRANSFERRED'
};

exports.ParentRelationship = exports.$Enums.ParentRelationship = {
  FATHER: 'FATHER',
  MOTHER: 'MOTHER',
  GUARDIAN: 'GUARDIAN'
};

exports.AttendanceStatus = exports.$Enums.AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  HALF_DAY: 'HALF_DAY',
  LEAVE: 'LEAVE'
};

exports.ExamType = exports.$Enums.ExamType = {
  INTERNAL: 'INTERNAL',
  EXTERNAL: 'EXTERNAL',
  BOARD: 'BOARD',
  UNIT_TEST: 'UNIT_TEST',
  TERMINAL: 'TERMINAL',
  HALF_YEARLY: 'HALF_YEARLY',
  ANNUAL: 'ANNUAL'
};

exports.FeeFrequency = exports.$Enums.FeeFrequency = {
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  HALF_YEARLY: 'HALF_YEARLY',
  YEARLY: 'YEARLY',
  ONE_TIME: 'ONE_TIME'
};

exports.FeeInvoiceStatus = exports.$Enums.FeeInvoiceStatus = {
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED'
};

exports.PaymentMethod = exports.$Enums.PaymentMethod = {
  CASH: 'CASH',
  CHEQUE: 'CHEQUE',
  ONLINE: 'ONLINE',
  UPI: 'UPI',
  CARD: 'CARD'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

exports.AdmissionStatus = exports.$Enums.AdmissionStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  INTERVIEW_SCHEDULED: 'INTERVIEW_SCHEDULED'
};

exports.LeaveType = exports.$Enums.LeaveType = {
  CASUAL_LEAVE: 'CASUAL_LEAVE',
  SICK_LEAVE: 'SICK_LEAVE',
  EARNED_LEAVE: 'EARNED_LEAVE',
  MATERNITY_LEAVE: 'MATERNITY_LEAVE',
  PATERNITY_LEAVE: 'PATERNITY_LEAVE'
};

exports.LeaveStatus = exports.$Enums.LeaveStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

exports.SalaryStatus = exports.$Enums.SalaryStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  ON_HOLD: 'ON_HOLD'
};

exports.LibraryTransactionStatus = exports.$Enums.LibraryTransactionStatus = {
  ISSUED: 'ISSUED',
  RETURNED: 'RETURNED',
  OVERDUE: 'OVERDUE',
  LOST: 'LOST'
};

exports.CertificateStatus = exports.$Enums.CertificateStatus = {
  REQUESTED: 'REQUESTED',
  APPROVED: 'APPROVED',
  GENERATED: 'GENERATED',
  REJECTED: 'REJECTED'
};

exports.RemarkType = exports.$Enums.RemarkType = {
  ACADEMIC: 'ACADEMIC',
  BEHAVIORAL: 'BEHAVIORAL',
  GENERAL: 'GENERAL'
};

exports.RemarkSeverity = exports.$Enums.RemarkSeverity = {
  POSITIVE: 'POSITIVE',
  NEUTRAL: 'NEUTRAL',
  CONCERN: 'CONCERN'
};

exports.DocumentType = exports.$Enums.DocumentType = {
  TRANSFER_CERTIFICATE: 'TRANSFER_CERTIFICATE',
  BIRTH_CERTIFICATE: 'BIRTH_CERTIFICATE',
  AADHAR_CARD: 'AADHAR_CARD',
  MARKSHEET: 'MARKSHEET',
  PHOTO: 'PHOTO',
  MEDICAL_CERTIFICATE: 'MEDICAL_CERTIFICATE',
  INCOME_CERTIFICATE: 'INCOME_CERTIFICATE',
  CASTE_CERTIFICATE: 'CASTE_CERTIFICATE',
  OTHER: 'OTHER'
};

exports.NotificationType = exports.$Enums.NotificationType = {
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  ASSIGNMENT: 'ASSIGNMENT',
  EXAM: 'EXAM',
  FEE: 'FEE',
  ATTENDANCE: 'ATTENDANCE',
  GRADE: 'GRADE',
  LEAVE: 'LEAVE',
  MESSAGE: 'MESSAGE',
  GENERAL: 'GENERAL',
  ALERT: 'ALERT'
};

exports.NotificationPriority = exports.$Enums.NotificationPriority = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

exports.HealthRecordType = exports.$Enums.HealthRecordType = {
  CHECKUP: 'CHECKUP',
  ILLNESS: 'ILLNESS',
  INJURY: 'INJURY',
  ALLERGY: 'ALLERGY',
  CHRONIC_CONDITION: 'CHRONIC_CONDITION',
  DENTAL: 'DENTAL',
  VISION: 'VISION',
  HEARING: 'HEARING',
  OTHER: 'OTHER'
};

exports.PTMeetingStatus = exports.$Enums.PTMeetingStatus = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
  RESCHEDULED: 'RESCHEDULED'
};

exports.ScholarshipType = exports.$Enums.ScholarshipType = {
  MERIT_BASED: 'MERIT_BASED',
  NEED_BASED: 'NEED_BASED',
  SPORTS: 'SPORTS',
  CULTURAL: 'CULTURAL',
  MINORITY: 'MINORITY',
  GOVERNMENT: 'GOVERNMENT',
  PRIVATE: 'PRIVATE',
  OTHER: 'OTHER'
};

exports.ApplicationStatus = exports.$Enums.ApplicationStatus = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN'
};

exports.DisbursementStatus = exports.$Enums.DisbursementStatus = {
  AWARDED: 'AWARDED',
  PROCESSING: 'PROCESSING',
  DISBURSED: 'DISBURSED',
  CANCELLED: 'CANCELLED',
  ON_HOLD: 'ON_HOLD'
};

exports.DisciplinaryType = exports.$Enums.DisciplinaryType = {
  WARNING: 'WARNING',
  DETENTION: 'DETENTION',
  SUSPENSION: 'SUSPENSION',
  EXPULSION: 'EXPULSION',
  COMMUNITY_SERVICE: 'COMMUNITY_SERVICE',
  PARENT_MEETING: 'PARENT_MEETING',
  COUNSELING: 'COUNSELING'
};

exports.Severity = exports.$Enums.Severity = {
  MINOR: 'MINOR',
  MODERATE: 'MODERATE',
  MAJOR: 'MAJOR',
  CRITICAL: 'CRITICAL'
};

exports.GrievanceCategory = exports.$Enums.GrievanceCategory = {
  ACADEMIC: 'ACADEMIC',
  ADMINISTRATIVE: 'ADMINISTRATIVE',
  INFRASTRUCTURE: 'INFRASTRUCTURE',
  TEACHER_CONDUCT: 'TEACHER_CONDUCT',
  STUDENT_CONDUCT: 'STUDENT_CONDUCT',
  FEE_RELATED: 'FEE_RELATED',
  TRANSPORT: 'TRANSPORT',
  LIBRARY: 'LIBRARY',
  CANTEEN: 'CANTEEN',
  HOSTEL: 'HOSTEL',
  OTHER: 'OTHER'
};

exports.GrievanceStatus = exports.$Enums.GrievanceStatus = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  REJECTED: 'REJECTED'
};

exports.Prisma.ModelName = {
  User: 'User',
  Teacher: 'Teacher',
  Student: 'Student',
  Parent: 'Parent',
  ParentStudent: 'ParentStudent',
  Class: 'Class',
  Subject: 'Subject',
  ClassSubject: 'ClassSubject',
  SubjectTeacher: 'SubjectTeacher',
  Attendance: 'Attendance',
  Exam: 'Exam',
  Grade: 'Grade',
  Assignment: 'Assignment',
  AssignmentSubmission: 'AssignmentSubmission',
  FeeStructure: 'FeeStructure',
  FeeInvoice: 'FeeInvoice',
  FeePayment: 'FeePayment',
  AdmissionApplication: 'AdmissionApplication',
  LeaveApplication: 'LeaveApplication',
  Expense: 'Expense',
  StudentLeaveRequest: 'StudentLeaveRequest',
  Salary: 'Salary',
  LibraryBook: 'LibraryBook',
  LibraryTransaction: 'LibraryTransaction',
  TimetableEntry: 'TimetableEntry',
  Certificate: 'Certificate',
  TransportRoute: 'TransportRoute',
  TransportStudent: 'TransportStudent',
  Message: 'Message',
  Announcement: 'Announcement',
  Event: 'Event',
  StudentRemark: 'StudentRemark',
  AuditLog: 'AuditLog',
  Settings: 'Settings',
  StaffAttendance: 'StaffAttendance',
  ReportCard: 'ReportCard',
  ReportCardSubject: 'ReportCardSubject',
  Document: 'Document',
  Notification: 'Notification',
  HealthRecord: 'HealthRecord',
  Vaccination: 'Vaccination',
  PTMeeting: 'PTMeeting',
  PTMeetingSlot: 'PTMeetingSlot',
  PTMeetingBooking: 'PTMeetingBooking',
  Scholarship: 'Scholarship',
  ScholarshipApplication: 'ScholarshipApplication',
  ScholarshipRecipient: 'ScholarshipRecipient',
  Homework: 'Homework',
  HomeworkCompletion: 'HomeworkCompletion',
  DisciplinaryAction: 'DisciplinaryAction',
  Grievance: 'Grievance',
  GrievanceResponse: 'GrievanceResponse',
  TimetableSubstitution: 'TimetableSubstitution',
  Sport: 'Sport',
  SportTeam: 'SportTeam',
  SportPlayer: 'SportPlayer',
  SportMatch: 'SportMatch',
  Club: 'Club',
  ClubMember: 'ClubMember',
  ClubActivity: 'ClubActivity',
  Hostel: 'Hostel',
  HostelRoom: 'HostelRoom',
  HostelAllocation: 'HostelAllocation',
  InventoryCategory: 'InventoryCategory',
  InventoryItem: 'InventoryItem',
  InventoryTransaction: 'InventoryTransaction',
  CanteenMenu: 'CanteenMenu',
  CanteenOrder: 'CanteenOrder',
  Visitor: 'Visitor',
  Alumni: 'Alumni'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
