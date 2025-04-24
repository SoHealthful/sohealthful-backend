/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *               - id
 *             properties:
 *               otp:
 *                 type: string
 *                 example: "85923"
 *               id:
 *                 type: string
 *                 example: "stringid"
 *               type:
 *                 type: string
 *                 description: Optional. Use "verify-email" to trigger email verification
 *                 example: "verify-email"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             examples:
 *               EmailVerified:
 *                 summary: Email verified successfully
 *                 value:
 *                   message: Email verified successfully
 *               OtpVerified:
 *                 summary: OTP verified without email verification
 *                 value:
 *                   message: OTP verified successfully
 *                   id: "stringid"
 *                   code: "38945739457349"
 *       400:
 *         description: Bad request or validation error
 *         content:
 *           application/json:
 *             examples:
 *               AlreadyUsed:
 *                 summary: OTP already used
 *                 value:
 *                   resourceType: OperationOutcome
 *                   issue:
 *                     - severity: error
 *                       code: invalid
 *                       details:
 *                         text: Already used
 *                   extension:
 *                     - url: urlstring/tracing
 *                       extension:
 *                         - url: requestId
 *                           valueId: stringid
 *                         - url: traceId
 *                           valueId: stringid
 *               OtpExpired:
 *                 summary: OTP expired
 *                 value:
 *                   resourceType: OperationOutcome
 *                   issue:
 *                     - severity: error
 *                       code: invalid
 *                       details:
 *                         text: OTP has expired
 *                   extension:
 *                     - url: urlstring/tracing
 *                       extension:
 *                         - url: requestId
 *                           valueId: stringid
 *                         - url: traceId
 *                           valueId: stringid
 *               OtpIncorrect:
 *                 summary: OTP incorrect
 *                 value:
 *                   resourceType: OperationOutcome
 *                   issue:
 *                     - severity: error
 *                       code: invalid
 *                       details:
 *                         text: Incorrect otp
 *                   extension:
 *                     - url: urlstring/tracing
 *                       extension:
 *                         - url: requestId
 *                           valueId: stringid
 *                         - url: traceId
 *                           valueId: stringid
 *               InvalidId:
 *                 summary: Invalid ID
 *                 value:
 *                   resourceType: OperationOutcome
 *                   id: not-found
 *                   issue:
 *                     - severity: error
 *                       code: not-found
 *                       details:
 *                         text: Not found
 *                   extension:
 *                     - url: urlstring/tracing
 *                       extension:
 *                         - url: requestId
 *                           valueId: stringid
 *                         - url: traceId
 *                           valueId: stringid
 */
