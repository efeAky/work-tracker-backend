import express, { Request, Response, Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser"; // Import cookie-parser
import connectDB from "./config/db";
import { User } from "./models/User";
import authRoutes from "./routes/authRoutes";
import passport from "./config/passport";

// Load env vars FIRST
dotenv.config();

const app: Application = express();

// 1. Connect to Database
connectDB();

// 2. Middleware
app.use(express.json());

// CORS configuration - MUST allow credentials and specify origin
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000", // Your frontend URL
  credentials: true, // CRITICAL: Allow cookies to be sent
}));

// Cookie parser - MUST be added for req.cookies to work
app.use(cookieParser());

app.use(passport.initialize());

// 3. Basic Test Route
app.get("/", (req: Request, res: Response) => {
  res.send("API is running...");
});

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
