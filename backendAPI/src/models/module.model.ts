import { HydratedDocument, Model, Schema, Types, model, models } from 'mongoose';

export interface IModule {
	moduleName: string;
	visDescription: string;
	embedding: number[];
	ldrFileUrl: string;
	colors: Types.ObjectId[];
}

export type ModuleDocument = HydratedDocument<IModule>;

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
		colors: [{ type: Schema.Types.ObjectId, ref: 'LegoColor', default: [] }],
	},
	{
		timestamps: false,
	}
);

export const Module: Model<IModule> =
	(models.Module as Model<IModule>) || model<IModule>('Module', ModuleSchema);
