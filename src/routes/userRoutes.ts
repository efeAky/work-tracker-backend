import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/User";
import { Task } from "../models/Task";
import { authenticateToken, isAdmin, isAdminOrSupervisor, AuthRequest } from "../middleware/auth";

const router = express.Router();

const toInt = (val: string | string[]): number =>
  parseInt(Array.isArray(val) ? val[0] : val);

router.use(authenticateToken as any);

// ----------------------
// POST /api/users/register
// ACCESS: Admin only
router.post(
  "/register",
  isAdmin as any,
  async (req: Request, res: Response) => {
    try {
      const { userId, email, fullname, password, userRole } = req.body;

      if (!userId || !email || !fullname || !password || !userRole) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const existingUser = await User.findOne({
        $or: [{ email }, { userId: userId }],
      });

      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User with this email or userId already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        userId,
        email,
        fullname,
        hashedPassword,
        userRole,
        companyId: req.body.companyId || 1,
      });

      res.status(201).json({
        success: true,
        message: "User created successfully",
        user: {
          userId: newUser.userId,
          email: newUser.email,
          fullname: newUser.fullname,
          userRole: newUser.userRole,
        },
      });
    } catch (error: any) {
      console.error("DEBUG - Error creating user:", error);
      res.status(500).json({
        message: "Error creating user",
        detail: error.message,
        code: error.code,
      });
    }
  },
);

// ----------------------
// GET /api/users
// ACCESS: Admin only
router.get("/", isAdmin as any, async (req: Request, res: Response) => {
  try {
    const users = await User.find({}, { hashedPassword: 0 }).sort({
      createdAt: -1,
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// ----------------------
// GET /api/users/last/:limit
// ACCESS: Admin only
router.get(
  "/last/:limit",
  isAdmin as any,
  async (req: Request, res: Response) => {
    try {
      const limit = toInt(req.params.limit) || 10;
      const users = await User.find({}, { hashedPassword: 0 })
        .sort({ createdAt: -1 })
        .limit(limit);
      res.json(users);
    } catch (error) {
      console.error("Error fetching last users:", error);
      res.status(500).json({ message: "Error fetching last users" });
    }
  },
);

// ----------------------
// GET /api/users/search
// ACCESS: Admin + Supervisor
router.get("/search", isAdminOrSupervisor as any, async (req: Request, res: Response) => {
  try {
    const { q, role } = req.query;

    const filter: Record<string, any> = {};

    if (q) {
      filter.fullname = { $regex: q as string, $options: "i" };
    }

    if (role) {
      filter.userRole = role as string;
    }

    const users = await User.find(filter, { hashedPassword: 0 }).limit(10);
    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Error searching users" });
  }
});

// ----------------------
// GET /api/users/employees/stats
// ACCESS: Admin + Supervisor
router.get(
  "/employees/stats",
  isAdminOrSupervisor as any,
  async (req: Request, res: Response) => {
    try {
      const workers = await User.find(
        { userRole: "worker" },
        { hashedPassword: 0 }
      );

      const employeeStats = await Promise.all(
        workers.map(async (worker) => {
          const [total, completed, pending, failed, lastTask] =
            await Promise.all([
              Task.countDocuments({ assigneeId: worker.userId }),
              Task.countDocuments({ assigneeId: worker.userId, status: "done" }),
              Task.countDocuments({
                assigneeId: worker.userId,
                status: { $in: ["toDo", "inProgress"] },
              }),
              Task.countDocuments({ assigneeId: worker.userId, status: "failed" }),
              Task.findOne({ assigneeId: worker.userId }).sort({ dueDate: -1 }),
            ]);

          return {
            userId: worker.userId,
            fullname: worker.fullname,
            email: worker.email,
            userRole: worker.userRole,
            stats: {
              total,
              completed,
              pending,
              failed,
              lastTaskDate: lastTask?.dueDate || null,
            },
          };
        })
      );

      res.json(employeeStats);
    } catch (error) {
      console.error("Error fetching employee stats:", error);
      res.status(500).json({ message: "Error fetching employee stats" });
    }
  }
);

// ----------------------
// GET /api/users/:userId
// ACCESS: Admin only
router.get("/:userId", isAdmin as any, async (req: Request, res: Response) => {
  try {
    const userId = toInt(req.params.userId);
    const user = await User.findOne({ userId: userId }, { hashedPassword: 0 });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Error fetching user" });
  }
});

// ----------------------
// PUT /api/users/:userId
// ACCESS: Admin only
router.put("/:userId", isAdmin as any, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const userId = toInt(req.params.userId);
    const { email, fullname, userRole, companyId, password } = req.body;

    if (!authReq.user) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findOne({ userId: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (email) {
      const existingUser = await User.findOne({
        email,
        userId: { $ne: userId },
      });
      if (existingUser)
        return res.status(400).json({ message: "Email already in use" });
      user.email = email;
    }
    if (fullname) user.fullname = fullname;
    if (userRole) user.userRole = userRole;
    if (companyId) user.companyId = companyId;
    if (password) {
      if (password.length < 8)
        return res
          .status(400)
          .json({ message: "Password must be at least 8 characters long" });
      user.hashedPassword = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.json({
      success: true,
      message: "User updated successfully",
      user: {
        userId: user.userId,
        email: user.email,
        fullname: user.fullname,
        userRole: user.userRole,
        companyId: user.companyId,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user" });
  }
});

// ----------------------
// DELETE /api/users/:userId
// ACCESS: Admin only
router.delete(
  "/:userId",
  isAdmin as any,
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    try {
      const userId = toInt(req.params.userId);

      if (!authReq.user)
        return res.status(401).json({ message: "Unauthorized" });

      if (userId === authReq.user.userId) {
        return res
          .status(400)
          .json({ message: "You cannot delete your own account" });
      }

      const user = await User.findOneAndDelete({ userId: userId });
      if (!user) return res.status(404).json({ message: "User not found" });

      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Error deleting user" });
    }
  },
);

export default router;