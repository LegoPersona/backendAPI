import { HydratedDocument, Model, Schema, model, models } from 'mongoose';

export interface IUser {
	username: string;
	password?: string; // Store hashed password values only. Absent for Google-only accounts.
	email?: string | null;
	googleId?: string | null;
	/** Either a GCS object key "profiles/<file>" (uploaded) or an absolute Google picture URL. */
	profileImageUrl?: string | null;
	roles: string[];
	refreshTokens: string[];
	createdAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const UserSchema = new Schema<IUser>(
	{
		username: { type: String, required: true, trim: true },
		password: {
			type: String,
			required: function (this: IUser) {
				return !this.googleId;
			},
		},
		email: { type: String, required: false, trim: true },
		// No default for googleId: an explicit null would still land in the
		// sparse unique index and collide across password-only accounts.
		googleId: { type: String, required: false, unique: true, sparse: true },
		profileImageUrl: { type: String, required: false, default: null },
		roles: { type: [String], default: [] },
		refreshTokens: { type: [String], default: [] },
	},
	{
		timestamps: { createdAt: true, updatedAt: false },
	}
);

export const User: Model<IUser> = (models.User as Model<IUser>) || model<IUser>('User', UserSchema);
