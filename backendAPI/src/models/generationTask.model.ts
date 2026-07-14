import { HydratedDocument, Model, Schema, Types, model, models } from 'mongoose';

export const GENERATION_TASK_STATUSES = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'] as const;

export type GenerationTaskStatus = (typeof GENERATION_TASK_STATUSES)[number];

export interface IGenerationTask {
  jobId: string;
  userId?: Types.ObjectId;
  status: GenerationTaskStatus;
  actionDescription?: string;
  percentCompleteEstimate?: number;
  resultPersonaId?: Types.ObjectId;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type GenerationTaskDocument = HydratedDocument<IGenerationTask>;

const GenerationTaskSchema = new Schema<IGenerationTask>(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    status: {
      type: String,
      enum: GENERATION_TASK_STATUSES,
      default: 'PENDING',
      required: true,
    },
    actionDescription: { type: String },
    percentCompleteEstimate: { type: Number, min: 0, max: 100 },
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
