import { HydratedDocument, Model, Schema, model, models } from 'mongoose';

export interface IUser {
	username: string;
	password: string; // Store hashed password values only.
	profileImageKey?: string | null;
	roles: string[];
	refreshTokens: string[];
	createdAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const UserSchema = new Schema<IUser>(
	{
		username: { type: String, required: true, trim: true },
		password: { type: String, required: true },
		profileImageKey: { type: String, required: false, default: null },
		roles: { type: [String], default: [] },
		refreshTokens: { type: [String], default: [] },
	},
	{
		timestamps: { createdAt: true, updatedAt: false },
	}
);

export const User: Model<IUser> = (models.User as Model<IUser>) || model<IUser>('User', UserSchema);
