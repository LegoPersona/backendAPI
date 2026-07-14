import { HydratedDocument, Model, Schema, Types, model, models } from 'mongoose';

export interface IPersonaComment {
	_id: Types.ObjectId;
	userId: Types.ObjectId;
	text: string;
	createdAt: Date;
}

export interface IPersona {
	userId: Types.ObjectId;
	attributes: Record<string, unknown>;
	modules: Record<string, { file_name: string; color: number }>;
	legoFile: string;
	/** Filename of the generated persona (LEGO) image stored under public/personas. */
	personaImage?: string;
	/** Filename of the original uploaded image stored under public/personas. */
	originalImage?: string;
	/** Parsed parts list. Will be replaced with an object-storage URL in the future. */
	partsJson?: Record<string, string>[];
	/** LEGO color id of the skin tone chosen during generation. Absent on legacy personas. */
	skinTone?: number;
	/** Ids of users who liked this persona in the community gallery. */
	likes: Types.ObjectId[];
	/** Community comments on this persona. */
	comments: IPersonaComment[];
	createdAt: Date;
}

export type PersonaDocument = HydratedDocument<IPersona>;

const PersonaCommentSchema = new Schema<IPersonaComment>({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	text: { type: String, required: true, trim: true, maxlength: 500 },
	createdAt: { type: Date, default: Date.now },
});

const PersonaSchema = new Schema<IPersona>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		attributes: { type: Schema.Types.Mixed, required: true, default: () => ({}) },
		modules: { type: Schema.Types.Mixed, required: true, default: () => ({}) },
		legoFile: { type: String, required: true },
		personaImage: { type: String },
		originalImage: { type: String },
		partsJson: { type: Schema.Types.Mixed },
		skinTone: { type: Number },
		likes: { type: [Schema.Types.ObjectId], ref: 'User', default: () => [] },
		comments: { type: [PersonaCommentSchema], default: () => [] },
	},
	{
		timestamps: { createdAt: true, updatedAt: false },
	}
);

export const Persona: Model<IPersona> =
	(models.Persona as Model<IPersona>) || model<IPersona>('Persona', PersonaSchema);
