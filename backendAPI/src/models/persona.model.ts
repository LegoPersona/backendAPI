import { HydratedDocument, Model, Schema, Types, model, models } from 'mongoose';

export interface IPersona {
  userId: Types.ObjectId
  attributes: Record<string, unknown>
  modules: Record<string, { file_name: string; color: number }>
  legoFile: string
  originalImage?: Buffer
  originalImageMimeType?: string
  image?: Buffer
  imageMimeType?: string
  partsJson?: Record<string, string>[]
  createdAt: Date
}

export type PersonaDocument = HydratedDocument<IPersona>;

const PersonaSchema = new Schema<IPersona>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attributes: {
      type: Schema.Types.Mixed,
      required: true,
      default: () => ({}),
    },
    modules: {
      type: Schema.Types.Mixed,
      required: true,
      default: () => ({}),
    },
    legoFile: {
      type: String,
      required: true,
    },

    originalImage: {
      type: Buffer,
    },
    originalImageMimeType: {
      type: String,
    },

    image: {
      type: Buffer,
    },
    imageMimeType: {
      type: String,
      default: 'image/png',
    },

    partsJson: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  },
)

PersonaSchema.index({ userId: 1, createdAt: -1 });

export const Persona: Model<IPersona> =
	(models.Persona as Model<IPersona>) || model<IPersona>('Persona', PersonaSchema);
