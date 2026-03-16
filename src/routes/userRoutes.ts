import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/User";
import { authenticateToken, isAdmin, AuthRequest } from "../middleware/auth";

const router = express.Router();

const toInt = (val: string | string[]): number =>
  parseInt(Array.isArray(val) ? val[0] : val);

router.use(authenticateToken as any);
//
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
      // Check if another user (not this one) already has this email
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