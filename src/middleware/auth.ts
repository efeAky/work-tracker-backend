import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    userRole: string;
    companyId: number;
    fullname: string;
  };
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // ✅ check both cookie and Authorization header
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      email: string;
      userRole: string;
      companyId: number;
      fullname: string;
    };

    (req as AuthRequest).user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired token" });
    return;
  }
};

export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authReq = req as AuthRequest;

  if (authReq.user?.userRole !== "admin") {
    res.status(403).json({ message: "Access denied. Admin only." });
    return;
  }
  next();
};

export const isAdminOrSupervisor = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authReq = req as AuthRequest;

  if (
    authReq.user?.userRole !== "admin" &&
    authReq.user?.userRole !== "supervisor"
  ) {
    res
      .status(403)
      .json({ message: "Access denied. Admin or Supervisor only." });
    return;
  }
  next();
};
