import { Schema, model, Document, Types } from "mongoose";

// Define roles for type safety
export enum UserRole {
  SUPERVISOR = "supervisor",
  WORKER = "worker",
}

interface IUser extends Document {
  email: string;
  fullName: string;
  password?: string; // Optional because of OAuth
  role: UserRole;
  provider: "local" | "google" | "github";
  externalId?: string; // To store Google/GitHub unique ID
  avatarUrl?: string;
  // For Workers: links to their specific tasks and time logs
  tasks?: Types.ObjectId[];
  // For Supervisors: links to the workers they manage
  managedWorkers?: Types.ObjectId[];
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    password: { type: String },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.WORKER,
    },
    provider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },
    externalId: { type: String },
    avatarUrl: { type: String },
    managedWorkers: [{ type: Schema.Types.ObjectId, ref: "User" }], // Used if Supervisor
  },
  { timestamps: true },
);

export const User = model<IUser>("User", UserSchema);
