import express, { Request, Response, Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import usersRoutes from "./routes/userRoutes"; // ✅ added

dotenv.config();

const app: Application = express();

connectDB();

app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // ✅ added
    allowedHeaders: ["Content-Type", "Authorization"],    // ✅ added
  }),
);

app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("API is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes); // ✅ added

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});