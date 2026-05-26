import { HydratedDocument, Model, Schema, Types, model, models } from 'mongoose';

export interface IPersona {
	userId: Types.ObjectId;
	attributes: Record<string, unknown>;
	modules: Record<string, { file_name: string; color: number }>;
	legoFile: string;
	createdAt: Date;
}

export type PersonaDocument = HydratedDocument<IPersona>;

const PersonaSchema = new Schema<IPersona>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		attributes: { type: Schema.Types.Mixed, required: true, default: () => ({}) },
		modules: { type: Schema.Types.Mixed, required: true, default: () => ({}) },
		legoFile: { type: String, required: true },
	},
	{
		timestamps: { createdAt: true, updatedAt: false },
	}
);

export const Persona: Model<IPersona> =
	(models.Persona as Model<IPersona>) || model<IPersona>('Persona', PersonaSchema);
