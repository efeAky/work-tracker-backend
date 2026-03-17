import express, { Request, Response } from "express";
import { Task } from "../models/Task";
import { authenticateToken, isAdminOrSupervisor, AuthRequest } from "../middleware/auth";

const router = express.Router();

const toInt = (val: string | string[]): number =>
  parseInt(Array.isArray(val) ? val[0] : val);

router.use(authenticateToken as any);

// ----------------------
// POST /api/tasks/create
// ACCESS: Supervisor + Admin
router.post(
  "/create",
  isAdminOrSupervisor as any,
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    try {
      const { workerId, date, title, description } = req.body;

      if (!workerId || !date || !title || !description) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const taskId = Math.floor(Date.now() / 1000);

      const newTask = await Task.create({
        taskId,
        title,
        description,
        dueDate: new Date(date),
        status: "toDo",
        inTime: true,
        assigneeId: Number(workerId),
        assignorId: authReq.user!.userId, // from token
      });

      res.status(201).json({
        success: true,
        message: "Task created successfully",
        task: newTask,
      });
    } catch (error: any) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Error creating task", detail: error.message });
    }
  }
);

// ----------------------
// GET /api/tasks
// ACCESS: Supervisor + Admin
router.get(
  "/",
  isAdminOrSupervisor as any,
  async (req: Request, res: Response) => {
    try {
      const tasks = await Task.find().sort({ dueDate: -1 });
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Error fetching tasks" });
    }
  }
);

// ----------------------
// GET /api/tasks/:taskId
// ACCESS: Supervisor + Admin
router.get(
  "/:taskId",
  isAdminOrSupervisor as any,
  async (req: Request, res: Response) => {
    try {
      const taskId = toInt(req.params.taskId);
      const task = await Task.findOne({ taskId });

      if (!task) return res.status(404).json({ message: "Task not found" });

      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Error fetching task" });
    }
  }
);

// ----------------------
// PUT /api/tasks/:taskId
// ACCESS: Supervisor + Admin
router.put(
  "/:taskId",
  isAdminOrSupervisor as any,
  async (req: Request, res: Response) => {
    try {
      const taskId = toInt(req.params.taskId);
      const { title, description, status, dueDate } = req.body;

      const task = await Task.findOne({ taskId });
      if (!task) return res.status(404).json({ message: "Task not found" });

      if (title) task.title = title;
      if (description) task.description = description;
      if (dueDate) task.dueDate = new Date(dueDate);
      if (status) {
        const validStatuses = ["toDo", "inProgress", "done", "failed"];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ message: "Invalid status value" });
        }
        task.status = status;
        if (status === "done") task.completedAt = new Date();
      }

      await task.save();

      res.json({
        success: true,
        message: "Task updated successfully",
        task,
      });
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Error updating task" });
    }
  }
);

// ----------------------
// DELETE /api/tasks/:taskId
// ACCESS: Supervisor + Admin
router.delete(
  "/:taskId",
  isAdminOrSupervisor as any,
  async (req: Request, res: Response) => {
    try {
      const taskId = toInt(req.params.taskId);

      const task = await Task.findOneAndDelete({ taskId });
      if (!task) return res.status(404).json({ message: "Task not found" });

      res.json({ success: true, message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Error deleting task" });
    }
  }
);

export default router;