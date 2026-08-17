import { HydratedDocument, Model, Schema, model, models } from 'mongoose';

export interface IModule {
	moduleName: string;
	visDescription: string;
	embedding: number[];
	/** Stable GCS object key of the module's .ldr template (e.g. "templates/hair/buzz_cut.ldr"). */
	ldrKey: string;
	colors: number[];
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
		ldrKey: { type: String, required: true },
		colors: [{ type: Number, default: [] }],
	},
	{
		timestamps: false,
	}
);

export const Module: Model<IModule> =
	(models.Module as Model<IModule>) || model<IModule>('Module', ModuleSchema);
