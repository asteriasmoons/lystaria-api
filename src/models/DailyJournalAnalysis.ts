import { Schema, model, Document } from "mongoose";

export interface DailyJournalAnalysisDoc extends Document {
  userId: string;
  dateKey: string;
  themes: string[];
  mood: string;
  reflection: string;
  createdAt: Date;
  updatedAt: Date;
}

const DailyJournalAnalysisSchema = new Schema<DailyJournalAnalysisDoc>(
  {
    userId: { type: String, required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    themes: { type: [String], required: true, default: [] },
    mood: { type: String, required: true, default: "" },
    reflection: { type: String, required: true, default: "" },
  },
  { timestamps: true },
);

DailyJournalAnalysisSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

export const DailyJournalAnalysis = model<DailyJournalAnalysisDoc>(
  "DailyJournalAnalysis",
  DailyJournalAnalysisSchema,
);
