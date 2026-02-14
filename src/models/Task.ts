import mongoose, { Schema, model, Document, Types } from "mongoose";

export interface ITask extends Document {
  worker: Types.ObjectId;
  title: string;
  isCompleted: boolean;
  sessions: {
    startTime: Date;
    endTime?: Date;
    duration: number;
  }[];
  totalTimeSpent: number;
}

const TaskSchema = new Schema<ITask>(
  {
    worker: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
    sessions: [
      {
        startTime: { type: Date, default: Date.now },
        endTime: { type: Date },
        duration: { type: Number, default: 0 },
      },
    ],
    totalTimeSpent: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Task = model<ITask>("Task", TaskSchema);
