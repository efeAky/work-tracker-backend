import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { User } from "../src/models/User";
import { Company } from "../src/models/Company";

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("Connected to MongoDB");

    const adminExists = await User.findOne({ email: "admin@company.com" });
    if (adminExists) {
      console.log("❌ Admin already exists!");
      process.exit(0);
    }

    // Create company first
    const company = await Company.create({
      companyId: 1, // ← First company, ID = 1
      name: "Main Company",
      registrationNumber: "REG-00001",
    });
    console.log("✅ Company created");

    // Hash password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Create admin with companyId = 1
    const admin = await User.create({
      userId: 1,
      email: "admin@company.com",
      fullname: "System Admin",
      hashedPassword: hashedPassword,
      userRole: "admin",
      companyId: 1, // ← References the company we just created
    });

    console.log("✅ Admin created!");
    console.log("Email:", admin.email);
    console.log("Password: admin123");
    console.log("Company ID:", admin.companyId);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

seedAdmin();
