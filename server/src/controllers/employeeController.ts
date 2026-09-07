import { Request, Response, NextFunction } from 'express';
import { employeeService } from '../services/employeeService.js';
import { leaveService } from '../services/leaveService.js';

export class EmployeeController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, departmentId, role, status, managerId, page, limit, sortBy, sortOrder } = req.query;

      const result = await employeeService.listEmployees({
        search: search as string,
        departmentId: departmentId as string,
        role: role as string,
        status: status as string,
        managerId: managerId as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.status(200).json({
        success: true,
        data: result.employees,
        meta: {
          total: result.total,
          totalPages: result.totalPages,
          page: page ? parseInt(page as string, 10) : 1,
          limit: limit ? parseInt(limit as string, 10) : 10,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const employee = await employeeService.getEmployeeById(id);
      res.status(200).json({
        success: true,
        data: employee,
      });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await employeeService.createEmployee(req.body, {
        id: req.user!.id,
        email: req.user!.email,
      });

      res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: employee,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await employeeService.updateEmployee(id, req.body, {
        id: req.user!.id,
        email: req.user!.email,
      });

      res.status(200).json({
        success: true,
        message: 'Employee updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await employeeService.deleteEmployee(id, {
        id: req.user!.id,
        email: req.user!.email,
      });

      res.status(200).json({
        success: true,
        message: 'Employee deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async getBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      const balances = await leaveService.getEmployeeBalances(id, year);

      res.status(200).json({
        success: true,
        data: balances,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const employeeController = new EmployeeController();
