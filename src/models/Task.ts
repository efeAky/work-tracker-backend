import mongoose, { Schema, model, Document } from "mongoose";

export interface ITask extends Document {
  taskId: number;
  title: string;
  dueDate: Date;
  description: string;
  status: "toDo" | "inProgress" | "done" | "failed";
  inTime: boolean;
  assigneeId: number;  // References User.userId (who does the task)
  assignorId: number;  // References User.userId (who assigned the task)
  completedAt?: Date;  // When worker clicks "Done" (optional - not all tasks completed)
}

const TaskSchema = new Schema<ITask>(
  {
    taskId: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    dueDate: { type: Date, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["toDo", "inProgress", "done", "failed"],  // Only these 4 values allowed
      default: "toDo",  // New tasks start as "toDo"
      required: true
    },
    inTime: { type: Boolean, default: true },
    assigneeId: { type: Number, required: true, ref: "User" },  // Foreign key to User
    assignorId: { type: Number, required: true, ref: "User" },  // Foreign key to User
    completedAt: { type: Date }  // Optional - set when task is done
  },
  { 
    timestamps: true,  // Auto-adds createdAt (assigned time) and updatedAt
    collection: "Task"  // ← Force collection name to be "Task"
  }
);

export const Task = model<ITask>("Task", TaskSchema);