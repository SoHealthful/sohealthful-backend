/**
 * @swagger
 * /auth/newuser:
 *   post:
 *     summary: Register a new patient user and retrieve login ID and token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resourceType
 *               - projectId
 *               - email
 *               - firstName
 *               - lastName
 *               - password
 *               - emailVerified
 *               - codeChallenge
 *               - codeChallengeMethod
 *               - codeVerifier
 *             properties:
 *               resourceType:
 *                 type: string
 *                 nullable: false
 *                 example: Patient
 *               projectId:
 *                 type: string
 *                 nullable: false
 *                 example: 230897589yewuiyt-weufie-23964
 *               email:
 *                 type: string
 *                 nullable: false
 *                 example: stringinput
 *               firstName:
 *                 type: string
 *                 example: stringinput
 *               lastName:
 *                 type: string
 *                 example: patient
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 pattern: '^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'
 *                 description: |
 *                   - Password must be at least 8 characters long
 *                   - At least one uppercase letter
 *                   - At least one number
 *                   - At least one special character
 *                 example: Password!@#123
 *               emailVerified:
 *                 type: boolean
 *                 example: false
 *               codeChallenge:
 *                 type: string
 *                 example: 39845734eworfhsjdfsdfjdhf
 *               codeChallengeMethod:
 *                 type: string
 *                 enum: [S256]
 *                 example: stringmethod
 *               codeVerifier:
 *                 type: string
 *                 example: 982356yrieuwrhi
 *     responses:
 *       200:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 login:
 *                   type: string
 *                   example: stringloginid
 *                 token:
 *                   type: string
 *                   example: <JWT token string>
 *                 patientId:
 *                   type: string
 *                   example: stringpatientid
 *                 otpId:
 *                   type: string
 *                   example: stringotpid
 *       400:
 *         description: Expected Errors in Registration
 *         content:
 *           application/json:
 *             examples:
 *               EmailAlreadyRegistered:
 *                 summary: Email already registered
 *                 value:
 *                   resourceType: OperationOutcome
 *                   issue:
 *                     - severity: error
 *                       code: conflict
 *                       details:
 *                         text: Email already registered
 *               WeakPassword:
 *                 summary: Password too weak or found in breach database
 *                 value:
 *                   resourceType: OperationOutcome
 *                   issue:
 *                     - severity: error
 *                       code: invalid
 *                       details:
 *                         text: Password found in breach database
 *               InvalidProjectId:
 *                 summary: Invalid project for resourceType
 *                 value:
 *                   resourceType: OperationOutcome
 *                   issue:
 *                     - severity: error
 *                       code: invalid
 *                       details:
 *                         text: Invalid project ID
 *               RegistrationDisabled:
 *                 summary: Registration not allowed
 *                 value:
 *                   resourceType: OperationOutcome
 *                   issue:
 *                     - severity: error
 *                       code: forbidden
 *                       details:
 *                         text: Registration is disabled
 */
