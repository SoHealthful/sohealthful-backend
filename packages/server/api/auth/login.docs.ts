/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user and retrieve login ID and OAuth code
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - projectId
 *               - codeChallenge
 *               - codeChallengeMethod
 *             properties:
 *               email:
 *                 type: string
 *                 example: stringemail@gmail.com
 *               password:
 *                 type: string
 *                 example: Password123!@#
 *               projectId:
 *                 type: string
 *                 example: project-id-placeholder
 *               codeChallenge:
 *                 type: string
 *                 example: stringcodechallene
 *               codeChallengeMethod:
 *                 type: string
 *                 enum: [S256]
 *                 example: methodstring
 *     responses:
 *       200:
 *         description: User successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 login:
 *                   type: string
 *                   example: stringloginid
 *                 code:
 *                   type: string
 *                   example: stringcodeid
 *       400:
 *         description: Possible login errors
 *         content:
 *           application/json:
 *             examples:
 *               EmailNotVerified:
 *                 summary: Email not verified
 *                 value:
 *                   resourceType: OperationOutcome
 *                   issue:
 *                     - severity: error
 *                       code: invalid
 *                       details:
 *                         text: Email not verified
 *                   extension:
 *                     - url: urlstring/tracing
 *                       extension:
 *                         - url: requestId
 *                           valueId: req-uuid-1
 *                         - url: traceId
 *                           valueId: trace-uuid-1
 *               UserNotFound:
 *                 summary: User not found or no membership
 *                 value:
 *                   resourceType: OperationOutcome
 *                   issue:
 *                     - severity: error
 *                       code: not-found
 *                       details:
 *                         text: User not found
 *                   extension:
 *                     - url: urlstring/tracing
 *                       extension:
 *                         - url: requestId
 *                           valueId: req-uuid-2
 *                         - url: traceId
 *                           valueId: trace-uuid-2
 */
