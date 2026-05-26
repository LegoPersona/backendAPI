import { HydratedDocument, Model, Schema, Types, model, models } from 'mongoose';

export const GENERATION_TASK_STATUSES = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] as const;

export type GenerationTaskStatus = (typeof GENERATION_TASK_STATUSES)[number];

export interface IGenerationTask {
  jobId: string;
  status: GenerationTaskStatus;
  resultPersonaId?: Types.ObjectId;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type GenerationTaskDocument = HydratedDocument<IGenerationTask>;

const GenerationTaskSchema = new Schema<IGenerationTask>(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: GENERATION_TASK_STATUSES,
      default: 'PENDING',
      required: true,
    },
    resultPersonaId: { type: Schema.Types.ObjectId, ref: 'Persona' },
    errorMessage: { type: String },
  },
  {
    timestamps: true,
  },
);

export const GenerationTask: Model<IGenerationTask> =
  (models.GenerationTask as Model<IGenerationTask>)
  || model<IGenerationTask>('GenerationTask', GenerationTaskSchema);
