import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import passport from "passport";
import { User } from "../models/User";
import { authenticateToken } from "../middleware/auth"; // Import middleware
const router = express.Router();

// --- MANUAL SIGNUP ---
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, confirmPassword, fullName, role } = req.body;

    // 1. Validate all required fields are present
    if (!email || !password || !confirmPassword || !fullName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // 3. Validate password length
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    // 4. Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // 5. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 6. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7. Create new user (Matching your Schema fields)
    const newUser = new User({
      email,
      password: hashedPassword,
      fullName,
      role: role || "worker", // Default to worker if not provided
    });

    await newUser.save();

    // 8. Generate JWT token for auto-login after signup
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" },
    );

    // 9. Set token in httpOnly cookie (SECURE)
    res.cookie("token", token, {
      httpOnly: true, // Can't be accessed by JavaScript (XSS protection)
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax", // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours (matches JWT expiry)
      path: "/",
    });

    // 10. Send success response without token in body
    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error });
  }
});

// --- MANUAL LOGIN ---
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Validate all required fields are present
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // 3. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 4. Check password (Fixed TS error by checking if user.password exists)
    if (!user.password) {
      return res.status(400).json({
        message:
          "This account uses social login. Please login with Google/GitHub.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 5. Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" },
    );

    // 6. Set token in httpOnly cookie (SECURE)
    res.cookie("token", token, {
      httpOnly: true, // Can't be accessed by JavaScript (XSS protection)
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax", // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours (matches JWT expiry)
      path: "/",
    });

    // 7. Send response without token in body
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login error", error });
  }
});

// --- VERIFY TOKEN ROUTE (Protected) ---
// This route checks if the user's token in cookie is valid
router.get("/verify", authenticateToken as any, (req: any, res: any) => {
  // If middleware passes, token is valid
  res.json({
    success: true,
    user: req.user, // User info from decoded token (id, email, role)
  });
});

// --- LOGOUT ROUTE ---
router.post("/logout", (req: Request, res: Response) => {
  // Clear the token cookie
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  res.json({ success: true, message: "Logged out successfully" });
});

// --- GOOGLE OAUTH ROUTES ---
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req: any, res) => {
    // req.user is populated by passport after successful login
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" },
    );

    // Set token in httpOnly cookie (SECURE)
    res.cookie("token", token, {
      httpOnly: true, // Can't be accessed by JavaScript (XSS protection)
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax", // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours (matches JWT expiry)
      path: "/",
    });

    // Redirect to frontend dashboard (token is in cookie, not URL)
    const redirectUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${redirectUrl}/dashboard`);
  },
);

// --- GITHUB OAUTH ROUTES ---
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] }),
);

router.get(
  "/github/callback",
  passport.authenticate("github", { session: false }),
  (req: any, res) => {
    // Generate JWT token
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" },
    );

    // Set token in httpOnly cookie (SECURE)
    res.cookie("token", token, {
      httpOnly: true, // Can't be accessed by JavaScript (XSS protection)
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax", // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours (matches JWT expiry)
      path: "/",
    });

    // Redirect to frontend dashboard (token is in cookie, not URL)
    const redirectUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${redirectUrl}/dashboard`);
  },
);

export default router;
