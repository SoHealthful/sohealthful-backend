/**
 * @swagger
 * /fhir/R4/Patient/{patientId}:
 *   put:
 *     summary: Update an existing patient
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: patientId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the patient to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resourceType
 *               - id
 *               - meta
 *               - name
 *               - telecom
 *             properties:
 *               resourceType:
 *                 type: string
 *                 enum: [Patient]
 *                 example: Patient
 *               id:
 *                 type: string
 *                 example: 287239875634239835
 *               extension:
 *                 type: array
 *                 items:
 *                   type: object
 *                   oneOf:
 *                     - required: [url, valueString]
 *                       properties:
 *                         url:
 *                           type: string
 *                           example: urlstring/profileName
 *                         valueString:
 *                           type: string
 *                           example: patient 3
 *                     - required: [url, valueString]
 *                       properties:
 *                         url:
 *                           type: string
 *                           example: urlstring/measurement
 *                         valueString:
 *                           type: string
 *                           example: kg
 *                     - required: [url, extension]
 *                       properties:
 *                         url:
 *                           type: string
 *                           example: urlstring/profileCreating
 *                         extension:
 *                           type: array
 *                           items:
 *                             type: object
 *                             required: [url, valueString]
 *                             properties:
 *                               url:
 *                                 type: string
 *                                 example: name
 *                               valueString:
 *                                 type: string
 *                                 example: myself
 *               meta:
 *                 type: object
 *                 required:
 *                   - project
 *                   - compartment
 *                 properties:
 *                   project:
 *                     type: string
 *                     example: 2872374687239835
 *                   compartment:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         reference:
 *                           type: string
 *                           example: Project/287239832398573485345
 *               name:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     given:
 *                       type: array
 *                       items:
 *                         type: string
 *                     family:
 *                       type: string
 *               telecom:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     system:
 *                       type: string
 *                       enum: [email, phone]
 *                     use:
 *                       type: string
 *                       enum: [home, work, mobile]
 *                     value:
 *                       type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, unknown]
 *                 example: male
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 example: 2025-04-16
 *               address:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     city:
 *                       type: string
 *               communication:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     language:
 *                       type: object
 *                       properties:
 *                         coding:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               code:
 *                                 type: string
 *                                 example: english
 *                               display:
 *                                 type: string
 *                                 example: english
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *         content:
 *           application/json:
 *             example:
 *               resourceType: Patient
 *               id: 29047238734-21043242-ewpoir-4r
 *               gender: male
 *               birthDate: 2025-04-16
 *               telecom:
 *                 - system: email
 *                   use: work
 *                   value: stringemail@gmail.com
 *               name:
 *                 - given: ["testing"]
 *                   family: patient 4
 *               extension:
 *                 - url: urlstring/profileName
 *                   valueString: patient 3
 *                 - url: urlstring/measurement
 *                   valueString: kg
 *                 - url: urlstring/profileCreating
 *                   extension:
 *                     - url: name
 *                       valueString: myself
 *               meta:
 *                 versionId: stringid
 *                 lastUpdated: 2025-04-24T11:25:54.877Z
 *               address:
 *                 - city: Australia
 *               communication:
 *                 - language:
 *                     coding:
 *                       - code: english
 *                         display: english
 *       400:
 *         description: Validation or processing error
 *         content:
 *           application/json:
 *             examples:
 *               InvalidPatientID:
 *                 summary: Invalid or missing Patient ID
 *                 value:
 *                   resourceType: OperationOutcome
 *                   issue:
 *                     - severity: error
 *                       code: invalid
 *                       details:
 *                         text: Incorrect resource ID
 *       401:
 *         description: Unauthorized - Token missing or expired
 *         content:
 *           application/json:
 *             example:
 *               resourceType: OperationOutcome
 *               id: unauthorized
 *               issue:
 *                 - severity: error
 *                   code: login
 *                   details:
 *                     text: Unauthorized
 *               extension:
 *                 - url: urlstring/tracing
 *                   extension:
 *                     - url: requestId
 *                       valueId: stringid
 *                     - url: traceId
 *                       valueId: stringid
 */
