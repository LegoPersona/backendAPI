/**
 * @openapi
 * /v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               password: { type: string, format: password }
 *               image: { type: string, format: binary, description: Optional profile image. }
 *             required: [username, password]
 *     responses:
 *       201:
 *         description: Registered successfully.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthTokens' }
 *       400:
 *         description: Missing username or password.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */

/**
 * @openapi
 * /v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with username and password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               password: { type: string, format: password }
 *             required: [username, password]
 *     responses:
 *       200:
 *         description: Logged in successfully.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthTokens' }
 *       400:
 *         description: Missing username or password.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */

/**
 * @openapi
 * /v1/auth/google:
 *   post:
 *     tags: [Auth]
 *     summary: Log in (or register) using a Google ID token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               credential: { type: string, description: Google ID token credential. }
 *             required: [credential]
 *     responses:
 *       200:
 *         description: Logged in successfully.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthTokens' }
 *       400:
 *         description: Missing credential.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */

/**
 * @openapi
 * /v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user
 *     responses:
 *       200:
 *         description: The authenticated user.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthenticatedUser' }
 *       401:
 *         description: Missing or invalid token.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */

/**
 * @openapi
 * /v1/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange a refresh token for a new token pair
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *             required: [refreshToken]
 *     responses:
 *       200:
 *         description: New token pair issued.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthTokens' }
 *       400:
 *         description: Missing refreshToken.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */

/**
 * @openapi
 * /v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Invalidate a refresh token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *             required: [refreshToken]
 *     responses:
 *       200:
 *         description: Logged out.
 *       400:
 *         description: Missing refreshToken.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
