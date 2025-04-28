import { badRequest, NewUserRequest, createReference, normalizeOperationOutcome, WithId } from '@medplum/core';
import { ClientApplication, User } from '@medplum/fhirtypes';
import { randomUUID } from 'crypto';
import { sendEmail } from '../email/email';
import { Request, Response } from 'express';
import { body } from 'express-validator';
import { pwnedPassword } from 'hibp';
import { getConfig } from '../config/loader';
import { sendOutcome } from '../fhir/outcomes';
import { getSystemRepo } from '../fhir/repo';
import { globalLogger } from '../logger';
import { getUserByEmailInProject, getUserByEmailWithoutProject, tryLogin } from '../oauth/utils';
import { makeValidationMiddleware } from '../util/validator';
import { bcryptHashPassword } from './utils';
import { newPatientHandler } from './newpatient';
import { tokenHandler } from '../oauth/token';
import { TokenResponse } from '../config/types';
import dotenv from 'dotenv';
dotenv.config();

export const newUserValidator = makeValidationMiddleware([
  body('firstName').isLength({ min: 1, max: 128 }).withMessage('First name must be between 1 and 128 characters'),
  body('lastName').isLength({ min: 1, max: 128 }).withMessage('Last name must be between 1 and 128 characters'),
  body('email')
    .isEmail()
    .withMessage('Valid email address between 3 and 72 characters is required')
    .isLength({ min: 3, max: 72 })
    .withMessage('Valid email address between 3 and 72 characters is required'),
  body('password').isByteLength({ min: 8, max: 72 }).withMessage('Password must be between 8 and 72 characters'),
  body('codeChallenge').exists({ checkFalsy: true }).withMessage('codeChallenge is required'),
  body('codeChallengeMethod').exists({ checkFalsy: true }).withMessage('codeChallengeMethod is required'),
  body('codeVerifier').exists({ checkFalsy: true }).withMessage('codeVerifier is required'),
  body('emailVerified')
    .exists()
    .withMessage('emailVerified is required')
    .isBoolean()
    .withMessage('emailVerified must be a boolean value'),
]);

export const biometricValidator = makeValidationMiddleware([
  body('userId').exists({ checkFalsy: true }).withMessage('userId is required'),
  body('signatureKey').exists({ checkFalsy: true }).withMessage('signatureKey is required'),
  body('deviceId').exists({ checkFalsy: true }).withMessage('deviceId is required'),
]);
export const projectIdValidator = makeValidationMiddleware([
  body('projectId').exists({ checkFalsy: true }).withMessage('projectid is required'),
]);

/**
 * Handles a HTTP request to /auth/newuser.
 * @param req - The HTTP request.
 * @param res - The HTTP response.
 */
export async function newUserHandler(req: Request, res: Response): Promise<void> {
  const config = getConfig();

  if (config.registerEnabled === false) {
    // Explicitly check for "false" because the config value may be undefined
    sendOutcome(res, badRequest('Registration is disabled'));
    return;
  }

  if (req.body?.resourceType === 'Patient' && req.body.projectId === 'new') {
    sendOutcome(res, badRequest('Invalid projectId'));
    return;
  }

  const systemRepo = getSystemRepo();

  let projectId = req.body.projectId as string | undefined;
  // If the user specifies a client ID, then make sure it is compatible with the project
  const clientId = req.body.clientId;
  let client: ClientApplication | undefined = undefined;
  if (clientId) {
    client = await systemRepo.readResource<ClientApplication>('ClientApplication', clientId);
    if (projectId) {
      if (client.meta?.project !== projectId) {
        sendOutcome(res, badRequest('Client and project do not match'));
        return;
      }
    } else {
      projectId = client.meta?.project;
    }
  }

  // If the user is a practitioner, then projectId should be undefined
  // If the user is a patient, then projectId must be set
  const email = req.body?.email.toLowerCase();

  let existingUser = undefined;
  if (req.body.projectId && req.body.projectId !== 'new') {
    existingUser = await getUserByEmailInProject(email, req.body.projectId);
  } else {
    existingUser = await getUserByEmailWithoutProject(email);
  }
  if (existingUser) {
    sendOutcome(res, badRequest('Email already registered', 'email'));
    return;
  }

  try {
    let newUser = await createUser({ ...req.body, email } as NewUserRequest);
    let pcr;
    if (newUser?.emailVerified === false) {
      const otp = Math.floor(10000 + Math.random() * 90000).toString();

      //1 minute
      const expirationTime = new Date(Date.now() + 60 * 1000).toISOString();
      pcr = await systemRepo.createResource({
        resourceType: 'UserSecurityRequest',
        user: createReference(newUser),
        // type: 'otp',
        secret: otp,
        extension: [
          {
            url: `${getConfig().baseUrl}fhir/StructureDefinition/expirationTime`,
            valueInstant: expirationTime,
          },
          {
            url: `${getConfig().baseUrl}fhir/StructureDefinition/securityRequestType`,
            valueCode: 'otp', // or 'login', 'mfa', etc. if you're adding different sub-types
          },
        ],
      });
      await sendEmail(systemRepo, {
        to: email,
        subject: 'Verify Your OTP',
        text: [
          'OTP Verification',
          '',
          'Please copy the following otp and paste:',
          '',
          otp, // otp
          '',
          'Thank you,',
          'Medplum',
          '',
        ].join('\n'),
      });
      globalLogger.info('Email verification sent', { email });
    }

    const login = await tryLogin({
      authMethod: 'password',
      clientId,
      projectId,
      scope: req.body.scope || 'openid',
      nonce: req.body.nonce || randomUUID(),
      codeChallenge: req.body.codeChallenge,
      codeChallengeMethod: req.body.codeChallengeMethod,
      email,
      password: req.body.password,
      remember: req.body.remember,
      remoteAddress: req.ip,
      userAgent: req.get('User-Agent'),
      allowNoMembership: true,
      isEmailCheck: false,
    });
    if (!login?.id || !login?.code) {
      sendOutcome(res, badRequest('Login failed'));
      return;
    }

    let token: TokenResponse | undefined;
    if (req.body?.resourceType === 'Patient' && req.body.projectId) {
      let membership = await newPatientHandler({ body: { projectId, login: login.id, return: true } } as any, res);
      if (membership) {
        token = await issueTokenAfterRegistration({
          code: login.code,
          codeVerifier: req.body?.codeVerifier,
        });
      }
    }
    res.status(200).json({
      login: login.id,
      token: token?.access_token,
      patientId: token?.patient,
      otpId: pcr?.id,
      userId: newUser.id,
    });
  } catch (err) {
    sendOutcome(res, normalizeOperationOutcome(err));
  }
}

async function issueTokenAfterRegistration(objParams: {
  code: string;
  codeVerifier: string;
  clientId?: string;
  redirectUri?: string;
}): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      is: (type: string) => type === 'application/x-www-form-urlencoded',
      body: {
        grant_type: 'authorization_code',
        code: objParams.code,
        code_verifier: objParams.codeVerifier,
        // client_id: objParams.clientId,
        // redirect_uri: objParams.redirectUri,
      },
    } as unknown as Request;

    const res = {
      status: (_code: number) => res,
      send: (data: any) => {
        resolve(data);
        return res;
      },
      json: (data: any) => {
        resolve(data);
        return res;
      },
    } as unknown as Response;

    tokenHandler(req, res, (err?: any) => {
      if (err) {
        reject(err);
      }
    });
  });
}

export async function createUser(request: Omit<NewUserRequest, 'recaptchaToken'>): Promise<WithId<User>> {
  const { firstName, lastName, email, password, projectId, emailVerified } = request;

  const numPwns = await pwnedPassword(password);
  if (numPwns > 0) {
    return Promise.reject(badRequest('Password found in breach database', 'password'));
  }

  globalLogger.info('User creation request received', { email });
  const passwordHash = await bcryptHashPassword(password);

  const systemRepo = getSystemRepo();
  const result = await systemRepo.createResource<User>({
    resourceType: 'User',
    firstName,
    lastName,
    email,
    passwordHash,
    project: projectId && projectId !== 'new' ? { reference: `Project/${projectId}` } : undefined,
    emailVerified: emailVerified === true || emailVerified === false ? emailVerified : undefined,
  });
  globalLogger.info('User created', { id: result.id, email });
  return result;
}

export async function setBiometric(req: Request, res: Response): Promise<any> {
  const { userId, signatureKey, deviceId } = req.body;
  const systemRepo = getSystemRepo();
  const user = await systemRepo.readResource<User>('User', userId);
  console.log('oldUser:', user);
  if (user?.extension) {
    console.log('oldUser extension detail:', user.extension[0].extension);
  }
  if (!user) {
    sendOutcome(res, badRequest('User not found'));
    return;
  }
  // return;

  const biometricData = user.extension?.find(
    (ext) => ext.url === `${getConfig().baseUrl}fhir/StructureDefinition/biometric-data`
  );

  const newBiometricData = {
    url: `${getConfig().baseUrl}fhir/StructureDefinition/biometric-data`,
    extension: [
      {
        url: `${getConfig().baseUrl}fhir/StructureDefinition/deviceId`,
        valueString: deviceId, // Replace with actual deviceId
      },
      {
        url: `${getConfig().baseUrl}fhir/StructureDefinition/signatureKey`,
        valueString: signatureKey, // Replace with actual signatureKey
      },
    ],
  };

  if (biometricData) {
    biometricData.extension = biometricData.extension || [];
    biometricData.extension.push(...newBiometricData.extension);
  } else {
    if (!user.extension) {
      user.extension = [];
    }
    user.extension.push(newBiometricData);
  }

  try {
    // Update the user without modifying other data
    const userUpdated = await systemRepo.updateResource<User>({
      ...user, // Spread the user object, including all other extensions
    });
    console.log('User updated:', userUpdated);

    // Optionally check if the update was successful
    const usercheck = await systemRepo.readResource<User>('User', userId);
    console.log('User usercheck:', usercheck);

    return res.status(200).json({ message: 'Biometric data updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    sendOutcome(res, badRequest('Failed to update user'));
  }
}
