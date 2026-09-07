import { Request, Response, NextFunction } from 'express';
import { departmentService } from '../services/departmentService.js';

export class DepartmentController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departments = await departmentService.listDepartments();
      res.status(200).json({
        success: true,
        data: departments,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dept = await departmentService.getDepartmentById(req.params.id);
      res.status(200).json({
        success: true,
        data: dept,
      });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dept = await departmentService.createDepartment(req.body, {
        id: req.user!.id,
        email: req.user!.email,
      });

      res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: dept,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await departmentService.updateDepartment(req.params.id, req.body, {
        id: req.user!.id,
        email: req.user!.email,
      });

      res.status(200).json({
        success: true,
        message: 'Department updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await departmentService.deleteDepartment(req.params.id, {
        id: req.user!.id,
        email: req.user!.email,
      });

      res.status(200).json({
        success: true,
        message: 'Department deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const departmentController = new DepartmentController();
