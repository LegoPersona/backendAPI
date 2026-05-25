import { HydratedDocument, Model, Schema, model, models } from 'mongoose';

export interface ILegoColor {
	name: string;
	hex: string;
	legoColorId: number;
	lab: [number, number, number];
}

export type LegoColorDocument = HydratedDocument<ILegoColor>;

const LegoColorSchema = new Schema<ILegoColor>(
	{
		name: { type: String, required: true, trim: true },
		hex: {
			type: String,
			required: true,
			match: /^#[0-9A-Fa-f]{6}$/,
		},
		legoColorId: { type: Number, required: true, unique: true, index: true },
		lab: {
			type: [Number],
			required: true,
			validate: {
				validator: (v: number[]) => v.length === 3 && v.every(Number.isFinite),
				message: 'lab must be exactly 3 finite numbers [L, a, b].',
			},
		},
	},
	{
		collection: 'lego_colors',
		timestamps: false,
	}
);

export const LegoColor: Model<ILegoColor> =
	(models.LegoColor as Model<ILegoColor>) || model<ILegoColor>('LegoColor', LegoColorSchema);
