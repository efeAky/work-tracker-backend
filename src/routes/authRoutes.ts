import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        userRole: user.userRole,
        companyId: user.companyId,
        fullname: user.fullname,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "10h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({
      success: true,
      token, // ✅ added
      user: {
        userId: user.userId,
        email: user.email,
        fullname: user.fullname,
        userRole: user.userRole,
        companyId: user.companyId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login error" });
  }
});

router.get("/verify", authenticateToken as any, (req: any, res: any) => {
  res.json({
    success: true,
    user: req.user,
  });
});

router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  res.json({ success: true, message: "Logged out successfully" });
});

export default router;