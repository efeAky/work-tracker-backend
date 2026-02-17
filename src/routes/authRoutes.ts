import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// POST /api/auth/login
// ACCESS: Public (anyone can attempt to login)
// PURPOSE: User authentication - validates credentials and returns JWT token in cookie
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT token - expires in 10 hours
    const token = jwt.sign(
      { 
        userId: user.userId,
        email: user.email,
        userRole: user.userRole,
        companyId: user.companyId,
        fullname: user.fullname
      },
      process.env.JWT_SECRET!,
      { expiresIn: "10h" }  // ← 10 hour expiry
    );

    // Set token in httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 10 * 60 * 60 * 1000, // 10 hours in milliseconds
      path: "/",
    });

    res.json({
      success: true,
      user: {
        userId: user.userId,
        email: user.email,
        fullname: user.fullname,
        userRole: user.userRole,
        companyId: user.companyId
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login error" });
  }
});

// GET /api/auth/verify
// ACCESS: Authenticated users only (admin, supervisor, worker)
// PURPOSE: Verify if user's JWT token is still valid and return user info
router.get("/verify", authenticateToken as any, (req: any, res: any) => {
  res.json({
    success: true,
    user: req.user // Contains: userId, email, userRole, companyId, fullname
  });
});

// POST /api/auth/logout
// ACCESS: Public (anyone can logout)
// PURPOSE: Clear the authentication token cookie to log user out
router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  res.json({ success: true, message: "Logged out successfully" });
});

export default router;