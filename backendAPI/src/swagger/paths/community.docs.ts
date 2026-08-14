/**
 * @openapi
 * /v1/community:
 *   get:
 *     tags: [Community]
 *     summary: Browse the community gallery
 *     parameters:
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [newest, popularity, most-discussed], default: newest }
 *       - in: query
 *         name: skip
 *         schema: { type: integer, default: 0 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 8, minimum: 1, maximum: 50 }
 *       - in: query
 *         name: hairColors
 *         schema: { type: string }
 *         description: Comma-separated LEGO color ids.
 *       - in: query
 *         name: skinTones
 *         schema: { type: string }
 *         description: Comma-separated LEGO color ids.
 *       - in: query
 *         name: hasGlasses
 *         schema: { type: boolean }
 *       - in: query
 *         name: hasBeard
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Gallery page.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/CommunityPersona' }
 */

/**
 * @openapi
 * /v1/community/filters:
 *   get:
 *     tags: [Community]
 *     summary: Get the available gallery filter options
 *     responses:
 *       200:
 *         description: Filter options.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CommunityFilterOptions' }
 */

/**
 * @openapi
 * /v1/community/{personaId}/like:
 *   post:
 *     tags: [Community]
 *     summary: Like a community persona
 *     parameters:
 *       - in: path
 *         name: personaId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated like state.
 *       400:
 *         description: Invalid persona id.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *   delete:
 *     tags: [Community]
 *     summary: Unlike a community persona
 *     parameters:
 *       - in: path
 *         name: personaId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated like state.
 *       400:
 *         description: Invalid persona id.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */

/**
 * @openapi
 * /v1/community/{personaId}/comments:
 *   post:
 *     tags: [Community]
 *     summary: Add a comment to a community persona
 *     parameters:
 *       - in: path
 *         name: personaId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text: { type: string }
 *             required: [text]
 *     responses:
 *       201:
 *         description: The created comment.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CommunityComment' }
 *       400:
 *         description: Invalid persona id.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
