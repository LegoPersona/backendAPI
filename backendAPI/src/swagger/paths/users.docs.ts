/**
 * @openapi
 * /v1/users/me/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get the current user's profile, stats, personas, and achievements
 *     responses:
 *       200:
 *         description: The current user's profile.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CurrentUserProfile' }
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *   patch:
 *     tags: [Users]
 *     summary: Update the current user's username and/or profile image
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               profileImage: { type: string, format: binary }
 *             required: [username]
 *     responses:
 *       200:
 *         description: Updated profile.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CurrentUserProfile' }
 *       400:
 *         description: Invalid fields or missing username.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
