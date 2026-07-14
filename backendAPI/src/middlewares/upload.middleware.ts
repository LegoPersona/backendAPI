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
