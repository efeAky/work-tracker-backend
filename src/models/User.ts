import mongoose, { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  userId: number;
  email: string;
  fullname: string;
  hashedPassword: string;
  userRole: "admin" | "supervisor" | "worker";
  companyId: number;
}

const UserSchema = new Schema<IUser>(
  {
    userId: { type: Number, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    fullname: { type: String, required: true },
    hashedPassword: { type: String, required: true },
    userRole: { 
      type: String, 
      enum: ["admin", "supervisor", "worker"], 
      required: true 
    },
    companyId: { type: Number, required: true },
  },
  { 
    timestamps: true,
    collection: "User"  // ← Force collection name to be "User"
  }
);

export const User = model<IUser>("User", UserSchema);