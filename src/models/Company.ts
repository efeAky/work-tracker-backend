import mongoose, { Schema, model, Document } from "mongoose";

export interface ICompany extends Document {
  companyId: number;
  name: string;
  registrationNumber: string;
}

const CompanySchema = new Schema<ICompany>(
  {
    companyId: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    registrationNumber: { type: String, required: true, unique: true },
  },
  { 
    timestamps: true,
    collection: "Company"  // ← Force collection name to be "Company"
  }
);

export const Company = model<ICompany>("Company", CompanySchema);