import bcrypt from 'bcryptjs';
import { 
  User, Employee, Department, LeaveType, LeaveBalance, LeaveRequest, 
  Attendance, Holiday, Notification, AuditLog 
} from '../types/index.js';

export async function getSeedData() {
  const salt = await bcrypt.genSalt(10);
  
  // Real bcrypt hashed passwords for all standard roles
  const adminHash = await bcrypt.hash('AdminPassword123!', salt);
  const hrHash = await bcrypt.hash('HrPassword123!', salt);
  const managerHash = await bcrypt.hash('ManagerPassword123!', salt);
  const employeeHash = await bcrypt.hash('EmployeePassword123!', salt);

  const departments: Department[] = [
    {
      id: 'dept-eng-01',
      name: 'Engineering',
      code: 'ENG',
      description: 'Software development, cloud infrastructure, and product quality assurance.',
      managerId: 'emp-mgr-01',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'dept-hr-02',
      name: 'Human Resources',
      code: 'HR',
      description: 'People operations, talent acquisition, culture, and employee benefits.',
      managerId: 'emp-hr-01',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'dept-fin-03',
      name: 'Finance & Legal',
      code: 'FIN',
      description: 'Financial forecasting, payroll accounting, and legal compliance.',
      managerId: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'dept-mkt-04',
      name: 'Growth & Marketing',
      code: 'MKT',
      description: 'Brand strategy, developer relations, growth marketing, and communications.',
      managerId: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'dept-prd-05',
      name: 'Product & Design',
      code: 'PRD',
      description: 'Product lifecycle roadmap, UI/UX systems design, and customer research.',
      managerId: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const users: User[] = [
    {
      id: 'user-admin-01',
      email: 'admin@hrflow.internal',
      passwordHash: adminHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: '2024-01-10T09:00:00.000Z',
      updatedAt: '2024-01-10T09:00:00.000Z',
    },
    {
      id: 'user-hr-01',
      email: 'hr@hrflow.internal',
      passwordHash: hrHash,
      role: 'HR',
      status: 'ACTIVE',
      createdAt: '2024-01-15T09:00:00.000Z',
      updatedAt: '2024-01-15T09:00:00.000Z',
    },
    {
      id: 'user-mgr-01',
      email: 'manager@hrflow.internal',
      passwordHash: managerHash,
      role: 'MANAGER',
      status: 'ACTIVE',
      createdAt: '2024-02-01T09:00:00.000Z',
      updatedAt: '2024-02-01T09:00:00.000Z',
    },
    {
      id: 'user-emp-01',
      email: 'employee@hrflow.internal',
      passwordHash: employeeHash,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      createdAt: '2024-02-15T09:00:00.000Z',
      updatedAt: '2024-02-15T09:00:00.000Z',
    },
    {
      id: 'user-emp-02',
      email: 'alex.morgan@hrflow.internal',
      passwordHash: employeeHash,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      createdAt: '2024-03-01T09:00:00.000Z',
      updatedAt: '2024-03-01T09:00:00.000Z',
    },
    {
      id: 'user-emp-03',
      email: 'liam.chen@hrflow.internal',
      passwordHash: employeeHash,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      createdAt: '2024-03-10T09:00:00.000Z',
      updatedAt: '2024-03-10T09:00:00.000Z',
    },
    {
      id: 'user-emp-04',
      email: 'sophia.rodriguez@hrflow.internal',
      passwordHash: employeeHash,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      createdAt: '2024-03-15T09:00:00.000Z',
      updatedAt: '2024-03-15T09:00:00.000Z',
    },
  ];

  const employees: Employee[] = [
    {
      id: 'emp-adm-01',
      userId: 'user-admin-01',
      employeeId: 'EMP-0001',
      firstName: 'Alexander',
      lastName: 'Wright',
      phone: '+1 (555) 234-8801',
      departmentId: 'dept-eng-01',
      position: 'VP of Infrastructure & Security',
      managerId: null,
      hireDate: '2023-01-15',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: '2024-01-10T09:00:00.000Z',
      updatedAt: '2024-01-10T09:00:00.000Z',
    },
    {
      id: 'emp-hr-01',
      userId: 'user-hr-01',
      employeeId: 'EMP-0012',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      phone: '+1 (555) 432-1190',
      departmentId: 'dept-hr-02',
      position: 'Chief People Officer & HR Director',
      managerId: 'emp-adm-01',
      hireDate: '2023-04-01',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      createdAt: '2024-01-15T09:00:00.000Z',
      updatedAt: '2024-01-15T09:00:00.000Z',
    },
    {
      id: 'emp-mgr-01',
      userId: 'user-mgr-01',
      employeeId: 'EMP-0045',
      firstName: 'David',
      lastName: 'Chen',
      phone: '+1 (555) 902-3341',
      departmentId: 'dept-eng-01',
      position: 'Engineering Manager (Core Systems)',
      managerId: 'emp-adm-01',
      hireDate: '2023-06-15',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: '2024-02-01T09:00:00.000Z',
      updatedAt: '2024-02-01T09:00:00.000Z',
    },
    {
      id: 'emp-emp-01',
      userId: 'user-emp-01',
      employeeId: 'EMP-0108',
      firstName: 'Emily',
      lastName: 'Watson',
      phone: '+1 (555) 881-2299',
      departmentId: 'dept-eng-01',
      position: 'Senior Full-Stack Architect',
      managerId: 'emp-mgr-01',
      hireDate: '2023-09-01',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      createdAt: '2024-02-15T09:00:00.000Z',
      updatedAt: '2024-02-15T09:00:00.000Z',
    },
    {
      id: 'emp-emp-02',
      userId: 'user-emp-02',
      employeeId: 'EMP-0112',
      firstName: 'Alex',
      lastName: 'Morgan',
      phone: '+1 (555) 762-9011',
      departmentId: 'dept-eng-01',
      position: 'Cloud DevOps Specialist',
      managerId: 'emp-mgr-01',
      hireDate: '2023-11-15',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      createdAt: '2024-03-01T09:00:00.000Z',
      updatedAt: '2024-03-01T09:00:00.000Z',
    },
    {
      id: 'emp-emp-03',
      userId: 'user-emp-03',
      employeeId: 'EMP-0144',
      firstName: 'Liam',
      lastName: 'Chen',
      phone: '+1 (555) 345-9812',
      departmentId: 'dept-fin-03',
      position: 'Senior Financial Analyst',
      managerId: null,
      hireDate: '2024-01-10',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      createdAt: '2024-03-10T09:00:00.000Z',
      updatedAt: '2024-03-10T09:00:00.000Z',
    },
    {
      id: 'emp-emp-04',
      userId: 'user-emp-04',
      employeeId: 'EMP-0189',
      firstName: 'Sophia',
      lastName: 'Rodriguez',
      phone: '+1 (555) 674-1234',
      departmentId: 'dept-mkt-04',
      position: 'Brand & Growth Strategist',
      managerId: null,
      hireDate: '2024-02-01',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      createdAt: '2024-03-15T09:00:00.000Z',
      updatedAt: '2024-03-15T09:00:00.000Z',
    },
  ];

  const leaveTypes: LeaveType[] = [
    {
      id: 'lt-vac-01',
      name: 'Annual Vacation',
      code: 'VAC',
      description: 'Standard paid annual leave allowance for rest and recreation.',
      defaultDays: 20,
      isPaid: true,
      requiresApproval: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'lt-sck-02',
      name: 'Sick & Medical Leave',
      code: 'SCK',
      description: 'Paid medical leave for illness, medical appointments, or recovery.',
      defaultDays: 12,
      isPaid: true,
      requiresApproval: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'lt-per-03',
      name: 'Personal / Emergency Leave',
      code: 'PER',
      description: 'Leave for immediate family matters or unforeseen personal obligations.',
      defaultDays: 5,
      isPaid: true,
      requiresApproval: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'lt-par-04',
      name: 'Parental / Maternity / Paternity',
      code: 'PAR',
      description: 'Paid parental leave supporting childbirth, adoption, or early care.',
      defaultDays: 60,
      isPaid: true,
      requiresApproval: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'lt-ber-05',
      name: 'Bereavement Leave',
      code: 'BER',
      description: 'Compassionate leave for grieving the loss of immediate family members.',
      defaultDays: 5,
      isPaid: true,
      requiresApproval: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const currentYear = new Date().getFullYear();

  // Generate balances for each employee
  const leaveBalances: LeaveBalance[] = [];
  employees.forEach((emp) => {
    leaveTypes.forEach((lt) => {
      // Allocate realistic used/pending days
      let used = 0;
      let pending = 0;
      if (emp.id === 'emp-emp-01' && lt.code === 'VAC') {
        used = 4;
        pending = 3;
      } else if (emp.id === 'emp-emp-01' && lt.code === 'SCK') {
        used = 1;
      } else if (emp.id === 'emp-mgr-01' && lt.code === 'VAC') {
        used = 5;
      }

      leaveBalances.push({
        id: `lb-${emp.id}-${lt.code}-${currentYear}`,
        employeeId: emp.id,
        leaveTypeId: lt.id,
        year: currentYear,
        allocatedDays: lt.defaultDays,
        usedDays: used,
        pendingDays: pending,
        remainingDays: lt.defaultDays - used - pending,
        updatedAt: new Date().toISOString(),
      });
    });
  });

  const holidays: Holiday[] = [
    {
      id: 'hol-01',
      name: "New Year's Day",
      date: `${currentYear}-01-01`,
      type: 'NATIONAL',
      description: 'Federal holiday ringing in the calendar year.',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'hol-02',
      name: 'Martin Luther King Jr. Day',
      date: `${currentYear}-01-19`,
      type: 'NATIONAL',
      description: 'Honoring the civil rights leader and activist.',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'hol-03',
      name: 'Memorial Day',
      date: `${currentYear}-05-25`,
      type: 'NATIONAL',
      description: 'Remembering military personnel who gave their lives in service.',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'hol-04',
      name: 'Juneteenth National Independence Day',
      date: `${currentYear}-06-19`,
      type: 'NATIONAL',
      description: 'Commemorating the emancipation of enslaved African Americans.',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'hol-05',
      name: 'Independence Day',
      date: `${currentYear}-07-04`,
      type: 'NATIONAL',
      description: 'Declaration of Independence holiday celebration.',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'hol-06',
      name: 'Labor Day',
      date: `${currentYear}-09-01`,
      type: 'NATIONAL',
      description: 'Celebrating the American labor movement and workers.',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'hol-07',
      name: 'HRFlow Innovation & Wellness Day',
      date: `${currentYear}-10-16`,
      type: 'COMPANY',
      description: 'Company-wide day dedicated to personal recharge and creative projects.',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'hol-08',
      name: 'Thanksgiving Day',
      date: `${currentYear}-11-26`,
      type: 'NATIONAL',
      description: 'National holiday for family gatherings and gratitude.',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'hol-09',
      name: 'Day After Thanksgiving',
      date: `${currentYear}-11-27`,
      type: 'COMPANY',
      description: 'Extended holiday weekend for rest and family.',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'hol-10',
      name: 'Christmas Eve & Day',
      date: `${currentYear}-12-25`,
      type: 'NATIONAL',
      description: 'Winter holiday celebration.',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const leaveRequests: LeaveRequest[] = [
    {
      id: 'lr-101',
      employeeId: 'emp-emp-01',
      leaveTypeId: 'lt-vac-01',
      startDate: `${currentYear}-09-21`,
      endDate: `${currentYear}-09-23`,
      totalDays: 3,
      workingDays: 3,
      reason: 'Family road trip and personal recharging after Q3 releases.',
      status: 'PENDING',
      reviewerId: null,
      reviewerComment: null,
      reviewedAt: null,
      createdAt: `${currentYear}-09-02T10:30:00.000Z`,
      updatedAt: `${currentYear}-09-02T10:30:00.000Z`,
    },
    {
      id: 'lr-102',
      employeeId: 'emp-emp-01',
      leaveTypeId: 'lt-vac-01',
      startDate: `${currentYear}-07-15`,
      endDate: `${currentYear}-07-18`,
      totalDays: 4,
      workingDays: 4,
      reason: 'Summer vacation camping retreat.',
      status: 'APPROVED',
      reviewerId: 'emp-mgr-01',
      reviewerComment: 'Approved! Have a restful trip Emily. Coverage coordinated with Alex.',
      reviewedAt: `${currentYear}-07-05T14:15:00.000Z`,
      createdAt: `${currentYear}-07-02T09:12:00.000Z`,
      updatedAt: `${currentYear}-07-05T14:15:00.000Z`,
    },
    {
      id: 'lr-103',
      employeeId: 'emp-emp-01',
      leaveTypeId: 'lt-sck-02',
      startDate: `${currentYear}-06-08`,
      endDate: `${currentYear}-06-08`,
      totalDays: 1,
      workingDays: 1,
      reason: 'Dental surgery and prescribed recovery.',
      status: 'APPROVED',
      reviewerId: 'emp-mgr-01',
      reviewerComment: 'Get well soon Emily!',
      reviewedAt: `${currentYear}-06-08T08:45:00.000Z`,
      createdAt: `${currentYear}-06-08T08:10:00.000Z`,
      updatedAt: `${currentYear}-06-08T08:45:00.000Z`,
    },
    {
      id: 'lr-104',
      employeeId: 'emp-emp-02',
      leaveTypeId: 'lt-vac-01',
      startDate: `${currentYear}-09-18`,
      endDate: `${currentYear}-09-19`,
      totalDays: 2,
      workingDays: 2,
      reason: 'Attending Kubernetes Community Summit in Chicago.',
      status: 'PENDING',
      reviewerId: null,
      reviewerComment: null,
      reviewedAt: null,
      createdAt: `${currentYear}-09-04T11:20:00.000Z`,
      updatedAt: `${currentYear}-09-04T11:20:00.000Z`,
    },
    {
      id: 'lr-105',
      employeeId: 'emp-emp-03',
      leaveTypeId: 'lt-per-03',
      startDate: `${currentYear}-08-14`,
      endDate: `${currentYear}-08-14`,
      totalDays: 1,
      workingDays: 1,
      reason: 'Apartment relocation and lease closing.',
      status: 'APPROVED',
      reviewerId: 'emp-hr-01',
      reviewerComment: 'Approved personal day.',
      reviewedAt: `${currentYear}-08-10T16:00:00.000Z`,
      createdAt: `${currentYear}-08-09T14:22:00.000Z`,
      updatedAt: `${currentYear}-08-10T16:00:00.000Z`,
    },
    {
      id: 'lr-106',
      employeeId: 'emp-emp-04',
      leaveTypeId: 'lt-vac-01',
      startDate: `${currentYear}-08-20`,
      endDate: `${currentYear}-08-25`,
      totalDays: 6,
      workingDays: 4,
      reason: 'Extended travel during end of summer campaign.',
      status: 'REJECTED',
      reviewerId: 'emp-hr-01',
      reviewerComment: 'Declined due to major Q3 Brand Launch sprint scheduled for this exact week. Please reschedule.',
      reviewedAt: `${currentYear}-08-05T11:00:00.000Z`,
      createdAt: `${currentYear}-08-01T15:30:00.000Z`,
      updatedAt: `${currentYear}-08-05T11:00:00.000Z`,
    },
  ];

  // Generate 20 days of realistic attendance history
  const attendances: Attendance[] = [];
  const today = new Date();
  
  for (let i = 0; i < 20; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay(); // 0 is Sun, 6 is Sat

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue; // Skip weekends in attendance records
    }

    employees.forEach((emp) => {
      // Create slight variations in punch times
      let checkInH = 8;
      let checkInM = 50 + Math.floor(Math.random() * 20); // 8:50 - 9:10
      let status: 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE' = 'PRESENT';

      if (checkInM > 60) {
        checkInH = 9;
        checkInM = checkInM - 60;
        if (checkInM > 15) {
          status = 'LATE';
        }
      }

      const checkInISO = `${dateStr}T0${checkInH}:${checkInM.toString().padStart(2, '0')}:00.000Z`;
      const checkOutISO = `${dateStr}T17:35:00.000Z`;
      const hours = 8.5;

      attendances.push({
        id: `att-${emp.id}-${dateStr}`,
        employeeId: emp.id,
        date: dateStr,
        checkIn: checkInISO,
        checkOut: i === 0 ? null : checkOutISO, // Today might still be checked in!
        workingHours: i === 0 ? 4.2 : hours,
        status: status,
        notes: status === 'LATE' ? 'Delayed by transit maintenance.' : null,
        createdAt: `${dateStr}T08:55:00.000Z`,
        updatedAt: `${dateStr}T17:35:00.000Z`,
      });
    });
  }

  const notifications: Notification[] = [
    {
      id: 'notif-01',
      userId: 'user-emp-01',
      title: 'Leave Request Received',
      message: 'Your leave request for Sep 21 - Sep 23 has been routed to David Chen for approval.',
      type: 'LEAVE_SUBMITTED',
      isRead: false,
      link: '/leave/requests',
      createdAt: `${currentYear}-09-02T10:30:15.000Z`,
    },
    {
      id: 'notif-02',
      userId: 'user-mgr-01',
      title: 'Action Required: Pending Leave Approval',
      message: 'Emily Watson has submitted a 3-day Annual Vacation request for review.',
      type: 'APPROVAL_REQUIRED',
      isRead: false,
      link: '/leave/requests',
      createdAt: `${currentYear}-09-02T10:30:16.000Z`,
    },
    {
      id: 'notif-03',
      userId: 'user-mgr-01',
      title: 'Action Required: Pending Leave Approval',
      message: 'Alex Morgan has requested 2 days of leave for Sep 18 - Sep 19.',
      type: 'APPROVAL_REQUIRED',
      isRead: true,
      link: '/leave/requests',
      createdAt: `${currentYear}-09-04T11:20:05.000Z`,
    },
    {
      id: 'notif-04',
      userId: 'user-emp-01',
      title: 'Leave Request Approved',
      message: 'Your 4-day vacation request for Jul 15 - Jul 18 was approved by David Chen.',
      type: 'LEAVE_APPROVED',
      isRead: true,
      link: '/leave/requests',
      createdAt: `${currentYear}-07-05T14:15:10.000Z`,
    },
    {
      id: 'notif-05',
      userId: 'user-emp-01',
      title: 'Upcoming Company Holiday',
      message: 'Reminder: HRFlow Innovation & Wellness Day is coming up on October 16.',
      type: 'HOLIDAY_ALERT',
      isRead: true,
      link: '/holidays',
      createdAt: `${currentYear}-08-20T09:00:00.000Z`,
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'aud-01',
      actorId: 'user-emp-01',
      actorEmail: 'employee@hrflow.internal',
      action: 'LEAVE_SUBMITTED',
      entity: 'LeaveRequest',
      entityId: 'lr-101',
      metadata: { startDate: `${currentYear}-09-21`, endDate: `${currentYear}-09-23`, totalDays: 3 },
      ipAddress: '192.168.1.45',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: `${currentYear}-09-02T10:30:00.000Z`,
    },
    {
      id: 'aud-02',
      actorId: 'user-mgr-01',
      actorEmail: 'manager@hrflow.internal',
      action: 'LEAVE_APPROVED',
      entity: 'LeaveRequest',
      entityId: 'lr-102',
      metadata: { reviewerComment: 'Approved! Have a restful trip Emily.' },
      ipAddress: '192.168.1.12',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: `${currentYear}-07-05T14:15:00.000Z`,
    },
    {
      id: 'aud-03',
      actorId: 'user-hr-01',
      actorEmail: 'hr@hrflow.internal',
      action: 'EMPLOYEE_CREATED',
      entity: 'Employee',
      entityId: 'emp-emp-04',
      metadata: { name: 'Sophia Rodriguez', department: 'Growth & Marketing' },
      ipAddress: '192.168.1.8',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: '2024-03-15T09:00:00.000Z',
    },
    {
      id: 'aud-04',
      actorId: 'user-admin-01',
      actorEmail: 'admin@hrflow.internal',
      action: 'SYSTEM_CONFIG_UPDATED',
      entity: 'LeaveType',
      entityId: 'lt-par-04',
      metadata: { updatedField: 'defaultDays', from: 45, to: 60 },
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
      createdAt: '2024-04-01T12:00:00.000Z',
    },
  ];

  return {
    departments,
    users,
    employees,
    leaveTypes,
    leaveBalances,
    holidays,
    leaveRequests,
    attendances,
    notifications,
    auditLogs,
  };
}
