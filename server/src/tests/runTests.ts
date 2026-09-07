import { db } from '../database/db.js';
import { authService } from '../services/authService.js';
import { leaveService } from '../services/leaveService.js';
import { attendanceService } from '../services/attendanceService.js';
import { holidayService } from '../services/holidayService.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { employeeRepository } from '../repositories/employeeRepository.js';
import { leaveRepository } from '../repositories/leaveRepository.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('\n=== HRFlow Backend Integration & Unit Test Suite ===\n');
  await db.initialize();

  try {
    // 1. Authentication Tests
    console.log('[1] Testing Authentication & Token Lifecycle');
    const loginRes = await authService.login('employee@hrflow.internal', 'EmployeePassword123!');
    assert(Boolean(loginRes.accessToken), 'Login returns valid accessToken');
    assert(loginRes.user.role === 'EMPLOYEE', 'Authenticated user role matches database');

    const refreshRes = await authService.refreshToken(loginRes.refreshToken);
    assert(Boolean(refreshRes.accessToken), 'Refresh token endpoint issues new access token');

    try {
      await authService.login('employee@hrflow.internal', 'WrongPassword!');
      assert(false, 'Login with bad password should throw');
    } catch (e: any) {
      assert(e.statusCode === 401, 'Bad credentials correctly trigger 401 Unauthorized');
    }

    // 2. Holiday-Aware Working Days Calculation
    console.log('\n[2] Testing Holiday-Aware Working Days Calculation Engine');
    // Test Friday to Monday range (includes weekend)
    const weekendCalc = await leaveService.calculateLeaveDays('2026-09-11', '2026-09-14');
    // 2026-09-11 is Friday, 12 Sat, 13 Sun, 14 Mon => 4 total days, 2 working days
    assert(weekendCalc.totalDays === 4, 'Correctly counts 4 calendar days span');
    assert(weekendCalc.workingDays === 2, 'Correctly filters out Saturday & Sunday weekends (leaves 2 working days)');

    // 3. Leave Application & Balance Deduction
    console.log('\n[3] Testing Leave Application & Real-time Balance Deductions');
    const empUser = {
      id: 'user-emp-01',
      email: 'employee@hrflow.internal',
      role: 'EMPLOYEE' as const,
      status: 'ACTIVE' as const,
      employeeId: 'emp-emp-01',
    };

    const initialBalances = await leaveService.getEmployeeBalances('emp-emp-01', 2026);
    const vacBalance = initialBalances.find(b => b.leaveType?.code === 'VAC');
    const initialRemaining = vacBalance?.remainingDays || 0;

    // Apply for 2 working days
    const leaveReq = await leaveService.applyLeave({
      leaveTypeId: 'lt-vac-01',
      startDate: '2026-10-05',
      endDate: '2026-10-06',
      reason: 'Automated test vacation request',
    }, empUser);

    assert(leaveReq.status === 'PENDING', 'New leave request enters PENDING state');
    assert(leaveReq.workingDays === 2, 'Calculated working days is 2');

    const updatedBalances = await leaveService.getEmployeeBalances('emp-emp-01', 2026);
    const updatedVac = updatedBalances.find(b => b.leaveType?.code === 'VAC');
    assert(updatedVac?.remainingDays === initialRemaining - 2, 'Remaining balance immediately accounts for pending days');

    // 4. Leave Approval Workflow
    console.log('\n[4] Testing Manager Approval Workflow & Balance Updates');
    const mgrUser = {
      id: 'user-mgr-01',
      email: 'manager@hrflow.internal',
      role: 'MANAGER' as const,
      status: 'ACTIVE' as const,
      employeeId: 'emp-mgr-01',
    };

    const approvedReq = await leaveService.reviewLeave(leaveReq.id, 'APPROVE', 'Looks good, approved!', mgrUser);
    assert(approvedReq.status === 'APPROVED', 'Request moves to APPROVED state');
    assert(approvedReq.reviewerId === 'emp-mgr-01', 'Reviewer employee ID recorded');

    // 5. Attendance Check-in & Check-out
    console.log('\n[5] Testing Attendance Check-in, Lateness Check & Duration');
    const todayStr = new Date().toISOString().split('T')[0];
    db.attendances = db.attendances.filter(a => !(a.employeeId === 'emp-emp-02' && a.date === todayStr));

    const testEmp = {
      id: 'user-emp-02',
      email: 'alex.morgan@hrflow.internal',
      role: 'EMPLOYEE' as const,
      status: 'ACTIVE' as const,
      employeeId: 'emp-emp-02',
    };

    const checkInRecord = await attendanceService.checkIn(testEmp, 'Morning standup ready');
    assert(Boolean(checkInRecord.checkIn), 'Check-in timestamp recorded');
    assert(checkInRecord.status === 'PRESENT' || checkInRecord.status === 'LATE', 'Valid attendance status computed');

    try {
      await attendanceService.checkIn(testEmp, 'Duplicate checkin attempt');
      assert(false, 'Duplicate check-in on same day should fail');
    } catch (e: any) {
      assert(e.statusCode === 409, 'Duplicate checkin rejected with 409 conflict');
    }

    const checkOutRecord = await attendanceService.checkOut(testEmp, 'Completed sprint tasks');
    assert(Boolean(checkOutRecord.checkOut), 'Check-out timestamp recorded');
    assert(checkOutRecord.workingHours >= 0, 'Working hours computed');

    // 6. Audit Logging Verification
    console.log('\n[6] Testing Audit Log Recording');
    const logs = await auditLogRepository.list({ page: 1, limit: 5 });
    assert(logs.total > 0, 'Audit log contains system events');
    const hasLeaveAction = logs.logs.some(l => l.action.includes('LEAVE') || l.action.includes('USER_LOGIN'));
    assert(hasLeaveAction, 'Audit log accurately tracks operational actions');

  } catch (err: any) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed | ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests();
