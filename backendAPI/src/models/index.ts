import { HydratedDocument, Model, Schema, Types, model, models } from 'mongoose';

export interface IUser {
	username: string;
	password: string; // Store hashed password values only.
	createdAt: Date;
}

export interface IModule {
	moduleName: string;
	visDescription: string;
	embedding: number[];
	ldrFileUrl: string;
}

export interface IPersona {
	name: string;
	userId: Types.ObjectId;
	imageUrl: string;
	attributes: Record<string, unknown>;
	modules: Types.ObjectId[];
	createdAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;
export type ModuleDocument = HydratedDocument<IModule>;
export type PersonaDocument = HydratedDocument<IPersona>;

const UserSchema = new Schema<IUser>(
	{
		username: { type: String, required: true, trim: true },
		password: { type: String, required: true },
	},
	{
		timestamps: { createdAt: true, updatedAt: false },
	}
);

const ModuleSchema = new Schema<IModule>(
	{
		moduleName: { type: String, required: true, trim: true },
		visDescription: { type: String, required: true },
		embedding: {
			type: [Number],
			required: true,
			default: [],
			validate: {
				validator: (values: number[]) => values.every((value) => Number.isFinite(value)),
				message: 'Embedding must contain finite numeric values only.',
			},
		},
		ldrFileUrl: { type: String, required: true },
	},
	{
		timestamps: false,
	}
);

const PersonaSchema = new Schema<IPersona>(
	{
		name: { type: String, required: true, trim: true },
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		imageUrl: { type: String, required: true },
		attributes: { type: Schema.Types.Mixed, required: true, default: {} },
		modules: [{ type: Schema.Types.ObjectId, ref: 'Module', required: true }],
	},
	{
		timestamps: { createdAt: true, updatedAt: false },
	}
);

export const User: Model<IUser> = (models.User as Model<IUser>) || model<IUser>('User', UserSchema);
export const Module: Model<IModule> =
	(models.Module as Model<IModule>) || model<IModule>('Module', ModuleSchema);
export const Persona: Model<IPersona> =
	(models.Persona as Model<IPersona>) || model<IPersona>('Persona', PersonaSchema);