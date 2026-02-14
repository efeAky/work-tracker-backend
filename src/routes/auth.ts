import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import passport from "passport";
import { User } from "../models/User";
const router = express.Router();

// --- MANUAL SIGNUP ---
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, role } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create new user (Matching your Schema fields)
    const newUser = new User({
      email,
      password: hashedPassword,
      fullName,
      role: role || "worker", // Default to worker if not provided
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error });
  }
});

// --- MANUAL LOGIN ---
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 2. Check password (Fixed TS error by checking if user.password exists)
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

    // 3. Generate JWT (Updated payload to use email and fullName)
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" },
    );

    res.json({
      token,
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

    // Redirect to frontend with token in URL (Fixed with process.env.FRONTEND_URL)
    const redirectUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${redirectUrl}/login-success?token=${token}`);
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
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" },
    );

    const redirectUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${redirectUrl}/login-success?token=${token}`);
  },
);

export default router;

/* const express = require('express');
const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    // TODO: Store user in database

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    // TODO: Database check

    res.status(201).json({ message: 'User loged in successfully '});
  }catch (error) {
    console.error(error);
    res.status(500).json( {error: 'Server error'})
  }
});

router.get('/google', (req, res) => {
  // Google OAuth
});

router.get('/google/callback', (req, res) => {
  // Google callback
});

module.exports = router; */
