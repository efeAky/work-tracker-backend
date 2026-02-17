import express, { Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/User";
import { authenticateToken, isAdmin, AuthRequest } from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken as any);

// POST /api/users/register
// ACCESS: Admin only
// PURPOSE: Admin creates new users (supervisors and workers)
router.post("/register", isAdmin as any, async (req: any, res: any) => {
  try {
    const { userId, email, fullname, password, userRole, companyId } = req.body;

    // Validate required fields
    if (!userId || !email || !fullname || !password || !userRole || !companyId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { userId }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: "User with this email or userId already exists" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      userId,
      email,
      fullname,
      hashedPassword,
      userRole,
      companyId
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        userId: newUser.userId,
        email: newUser.email,
        fullname: newUser.fullname,
        userRole: newUser.userRole,
        companyId: newUser.companyId
      }
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Error creating user" });
  }
});

// GET /api/users
// ACCESS: Admin only
// PURPOSE: Admin views all users in the system
router.get("/", isAdmin as any, async (req: any, res: any) => {
  try {
    const users = await User.find({}, { hashedPassword: 0 }); // Exclude password
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// GET /api/users/:userId
// ACCESS: Admin only
// PURPOSE: Admin views a specific user's details
router.get("/:userId", isAdmin as any, async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({ userId: parseInt(userId) }, { hashedPassword: 0 });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Error fetching user" });
  }
});

// PUT /api/users/:userId
// ACCESS: Admin only
// PURPOSE: Admin updates a user's information
router.put("/:userId", isAdmin as any, async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { email, fullname, userRole, companyId, password } = req.body;

    const user = await User.findOne({ userId: parseInt(userId) });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields if provided
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email, 
        userId: { $ne: parseInt(userId) } 
      });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }
    
    if (fullname) user.fullname = fullname;
    if (userRole) user.userRole = userRole;
    if (companyId) user.companyId = companyId;
    
    // Update password if provided
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }
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
        companyId: user.companyId
      }
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user" });
  }
});

// DELETE /api/users/:userId
// ACCESS: Admin only
// PURPOSE: Admin deletes a user from the system
router.delete("/:userId", isAdmin as any, async (req: any, res: any) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(userId) === req.user.userId) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findOneAndDelete({ userId: parseInt(userId) });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
});

export default router;