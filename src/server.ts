import express, { Request, Response, Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import { User } from "./models/User";
import authRoutes from "./routes/auth";
import passport from "./config/passport";

// Load env vars
dotenv.config();

const app: Application = express();

// 1. Connect to Database
connectDB();

// 2. Body Parser & Middleware
app.use(express.json());
app.use(cors());

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
