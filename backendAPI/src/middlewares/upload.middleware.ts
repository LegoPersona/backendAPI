import { RequestHandler } from 'express';
import multer from 'multer';

export const imageUpload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024,
	},
});

const ALLOWED_PROFILE_IMAGE_MIME_TYPES = new Set([
	'image/jpeg',
	'image/png',
	'image/webp',
]);

export const profileImageUpload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 5 * 1024 * 1024,
	},
	fileFilter: (_req, file, cb) => {
		if (!ALLOWED_PROFILE_IMAGE_MIME_TYPES.has(file.mimetype)) {
			cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'profileImage'));
			return;
		}

		cb(null, true);
	},
});

/** Runs the profileImage multer upload and maps its errors to 400 responses. */
export const profileImageUploadHandler: RequestHandler = (req, res, next) => {
	profileImageUpload.single('profileImage')(req, res, (error) => {
		if (!error) {
			next();
			return;
		}

		if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
			res.status(400).json({ message: 'Profile image must be 5 MB or smaller.' });
			return;
		}

		res.status(400).json({ message: 'Profile image must be JPG, PNG, or WebP.' });
	});
};
