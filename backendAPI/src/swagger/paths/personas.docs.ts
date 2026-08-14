/**
 * @openapi
 * /v1/personas:
 *   get:
 *     tags: [Personas]
 *     summary: List the current user's personas
 *     responses:
 *       200:
 *         description: The user's personas.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Persona' }
 *   post:
 *     tags: [Personas]
 *     summary: Start generating a persona from an uploaded photo
 *     description: >
 *       Creates a generation task and processes it in the background.
 *       Poll GET /v1/personas/tasks/{jobId}/status for progress.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: { type: string, format: binary }
 *             required: [image]
 *     responses:
 *       202:
 *         description: Generation task accepted.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/GenerationTaskAccepted' }
 *       400:
 *         description: Image file missing.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       429:
 *         description: Daily generation rate limit exceeded.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */

/**
 * @openapi
 * /v1/personas/ratelimit:
 *   get:
 *     tags: [Personas]
 *     summary: Get the current user's daily generation rate limit status
 *     responses:
 *       200:
 *         description: Rate limit status.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RateLimitStatus' }
 */

/**
 * @openapi
 * /v1/personas/tasks/{jobId}/status:
 *   get:
 *     tags: [Personas]
 *     summary: Get the status of a persona generation task
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Generation task status.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/GenerationTaskStatus' }
 *       404:
 *         description: Generation task not found.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */

/**
 * @openapi
 * /v1/personas/tasks/{jobId}/cancel:
 *   post:
 *     tags: [Personas]
 *     summary: Cancel a pending or in-progress persona generation task
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task cancelled (or already terminal, returned as a no-op).
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/GenerationTaskAccepted' }
 *       404:
 *         description: Generation task not found or not owned by the caller.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */

/**
 * @openapi
 * /v1/personas/{id}:
 *   get:
 *     tags: [Personas]
 *     summary: Get a single persona by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The persona.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Persona' }
 *       400:
 *         description: Invalid persona id.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Persona not found.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *   delete:
 *     tags: [Personas]
 *     summary: Delete a persona
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Referred to as personaId by the route.
 *     responses:
 *       204:
 *         description: Persona deleted.
 *       400:
 *         description: Invalid persona id.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Persona not found.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */

/**
 * @openapi
 * /v1/personas/{id}/instructions:
 *   get:
 *     tags: [Personas]
 *     summary: Download the build instructions PDF for a persona
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Instructions PDF.
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       404:
 *         description: Persona not found.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       502:
 *         description: Instructions generation failed.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */

/**
 * @openapi
 * /v1/personas/{id}/legoPartsJson:
 *   get:
 *     tags: [Personas]
 *     summary: Download the LEGO parts list for a persona as JSON
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: LEGO parts list.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { type: object, additionalProperties: { type: string } }
 *       404:
 *         description: Persona not found.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       502:
 *         description: Parts retrieval failed.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
