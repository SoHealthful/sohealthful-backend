/**
 * @swagger
 * /auth/projectid:
 *   get:
 *     summary: Get project ID
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Project found successfully
 *         content:
 *           application/json:
 *             example:
 *               id: 161452d9-43b7-5c29-aa7b-c85680fa44c2
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             example:
 *               message: Project not found
 */
