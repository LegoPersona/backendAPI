import { HydratedDocument, Model, Schema, model, models } from 'mongoose';

export interface IRateLimit {
  userId: Schema.Types.ObjectId;
  count: number;
  windowStart: Date;
}

export type RateLimitDocument = HydratedDocument<IRateLimit>;

const RateLimitSchema = new Schema<IRateLimit>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    count: { type: Number, required: true, default: 1 },
    windowStart: { type: Date, required: true },
  },
  { timestamps: false }
);

RateLimitSchema.index({ userId: 1 }, { unique: true });
RateLimitSchema.index({ windowStart: 1 }, { expireAfterSeconds: 86400 });

export const RateLimit: Model<IRateLimit> =
  (models.RateLimit as Model<IRateLimit>) || model<IRateLimit>('RateLimit', RateLimitSchema);
