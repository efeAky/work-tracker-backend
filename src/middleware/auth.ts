import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    userId: number; // Allow both
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
  const fromCookie = req.cookies?.token;
  const fromHeader = req.headers.authorization;


  const token = fromCookie || fromHeader?.split(" ")[1];

  if (!token) {
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Force the userId to be a number here just in case the token has a string
    (req as AuthRequest).user = {
      ...decoded,
      userId: Number(decoded.userId),
      companyId: Number(decoded.companyId),
    };

    next();
  } catch (err: any) {
    // LOG THE ERROR so you can see it in your terminal
    res
      .status(403)
      .json({ message: "Invalid or expired token", detail: err.message });
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
