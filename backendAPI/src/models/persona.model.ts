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
	modules: Record<string, { file_name: string; color: number; secondary_color?: number }>;
	/** Legacy: raw combined LDR text. No longer written; superseded by legoFileKey (GCS object). */
	legoFile?: string;
	/** GCS object key (in the private assets bucket) of the generated model .ldr file. */
	legoFileKey?: string;
	/** GCS object key (in the public bucket) of the generated persona (LEGO) render image. */
	personaImage?: string;
	/** GCS object key (in the public bucket) of the original uploaded image. */
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
		legoFile: { type: String },
		legoFileKey: { type: String },
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
