import { badRequest, NewUserRequest, createReference, normalizeOperationOutcome, WithId } from '@medplum/core';
import { ClientApplication, User } from '@medplum/fhirtypes';
import { generateSecret } from '../oauth/keys';
import { randomUUID } from 'crypto';
import Mail from 'nodemailer/lib/mailer';
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
import dotenv from 'dotenv';
dotenv.config();
type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  [key: string]: any;
};

export const newUserValidator = makeValidationMiddleware([
  body('firstName').isLength({ min: 1, max: 128 }).withMessage('First name must be between 1 and 128 characters'),
  body('lastName').isLength({ min: 1, max: 128 }).withMessage('Last name must be between 1 and 128 characters'),
  body('email')
    .isEmail()
    .withMessage('Valid email address between 3 and 72 characters is required')
    .isLength({ min: 3, max: 72 })
    .withMessage('Valid email address between 3 and 72 characters is required'),
  body('password').isByteLength({ min: 8, max: 72 }).withMessage('Password must be between 8 and 72 characters'),
]);

/**
 * Handles a HTTP request to /auth/newuser.
 * @param req - The HTTP request.
 * @param res - The HTTP response.
 */
export async function newUserHandler(req: Request, res: Response): Promise<void> {
  const config = getConfig();
  const secret = generateSecret(16);

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
  const email = req.body.email.toLowerCase();
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

    if (newUser?.emailVerified === false) {
      const pcr = await systemRepo.createResource({
        resourceType: 'UserSecurityRequest',
        user: createReference(newUser),
        type: 'verify-email', // or 'invite'
        secret,
      });
      let emailVerifiedUrl = `${getConfig().baseUrl}auth/verify-email/${pcr.id}/${pcr.secret}`;
      const options: Mail.Options = {
        to: newUser.email,
        subject: 'Verify your email',
        text: [
          `Hello!`,
          '',
          'Please click the following link verify your email:',
          '',
          emailVerifiedUrl,
          '',
          'Thank you,',
          'Your App Team',
        ].join('\n'),
      };

      await sendEmail(systemRepo, options);
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
    });
    if (!login?.id || !login?.code) {
      sendOutcome(res, badRequest('Login failed'));
      return;
    }

    let token: TokenResponse | undefined;
    if (req.body?.resourceType === 'Patient' && req.body.projectId && req.body.projectId !== 'new') {
      let membership = await newPatientHandler({ body: { projectId, login: login.id, return: true } } as any, res);
      if (membership) {
        token = await issueTokenAfterRegistration({
          code: login.code,
          codeVerifier: req.body?.codeVerifier,
        });
      }
    }
    res.status(200).json({ login: login.id, token: token?.access_token, patiendId: token?.patient });
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
