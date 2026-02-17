import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request type to include user
export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    userRole: string;
    companyId: number;
    fullname: string;
  };
}

// Verify user is logged in
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Get token from cookie
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      email: string;
      userRole: string;
      companyId: number;
      fullname: string;
    };

    // Attach user info to request
    (req as AuthRequest).user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired token" });
    return;
  }
};

// Check if user is admin
export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthRequest;
  
  if (authReq.user?.userRole !== "admin") {
    res.status(403).json({ message: "Access denied. Admin only." });
    return;
  }
  next();
};

// Check if user is admin or supervisor
export const isAdminOrSupervisor = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthRequest;
  
  if (authReq.user?.userRole !== "admin" && authReq.user?.userRole !== "supervisor") {
    res.status(403).json({ message: "Access denied. Admin or Supervisor only." });
    return;
  }
  next();
};