import { allOk, badRequest, createReference, Filter, Operator, resolveId } from '@medplum/core';
import { User, UserSecurityRequest } from '@medplum/fhirtypes';
import { Request, Response } from 'express';
import { body } from 'express-validator';
import { getConfig } from '../config/loader';
import { sendEmail } from '../email/email';
import { sendOutcome } from '../fhir/outcomes';
import { getSystemRepo } from '../fhir/repo';
import { generateSecret } from '../oauth/keys';
import { makeValidationMiddleware } from '../util/validator';
import { isExternalAuth } from './method';

export const resetPasswordValidator = makeValidationMiddleware([
  body('email')
    .isEmail()
    .withMessage('Valid email address between 3 and 72 characters is required')
    .isLength({ min: 3, max: 72 })
    .withMessage('Valid email address between 3 and 72 characters is required'),
]);

export async function resetPasswordHandler(req: Request, res: Response): Promise<void> {
  const email = req.body.email.toLowerCase();
  if (await isExternalAuth(email)) {
    sendOutcome(res, badRequest('Cannot reset password for external auth. Contact your system administrator.'));
    return;
  }

  // Define filters for searching users
  const filters: Filter[] = [
    {
      code: 'email',
      operator: Operator.EXACT,
      value: email, // Set the email value for exact matching
    },
  ];

  // If a specific project is associated with the request, add a project filter
  if (req.body.projectId) {
    filters.push({
      code: 'project',
      operator: Operator.EQUALS,
      value: 'Project/' + req.body.projectId, // Set the project value for equality matching
    });
  } else {
    // If project id not found in the request body then project should not present in the user
    filters.push({
      code: 'project',
      operator: Operator.MISSING,
      value: 'true',
    });
  }

  // Search for a user based on the defined filters
  const systemRepo = getSystemRepo();
  const user = await systemRepo.searchOne<User>({
    resourceType: 'User',
    filters,
  });

  if (!user) {
    // Per OWASP guidelines, send "ok" to prevent account enumeration attack
    // See: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/03-Identity_Management_Testing/04-Testing_for_Account_Enumeration_and_Guessable_User_Account
    sendOutcome(res, allOk);
    return;
  }
  let url: any;
  if (req.body?.type === 'otp') {
    url = await resetPassword(user, 'otp', req.body.redirectUri);
  } else {
    url = await resetPassword(user, 'reset', req.body.redirectUri);
  }

  if (req.body.sendEmail !== false) {
    if (req.body?.type === 'otp') {
      const [id, secret] = url.split('/');
      // This UserSecurityRequest was created as part of a new user invite flow.
      // Send a Welcome email to the user.
      await sendEmail(systemRepo, {
        to: user.email,
        subject: 'Verify Your OTP',
        text: [
          'OTP Verification',
          '',
          'Please copy the following otp and paste:',
          '',
          secret, // otp
          '',
          'Thank you,',
          'Medplum',
          '',
        ].join('\n'),
      });
      // sendOutcome(res, allOk);
      res.status(200).json({
        message: 'Successfully otp sent',
        id: id,
      });
    } else {
      await sendEmail(systemRepo, {
        to: user.email,
        subject: 'Medplum Password Reset',
        text: [
          'Someone requested to reset your Medplum password.',
          '',
          'Please click on the following link:',
          '',
          url,
          '',
          'If you received this in error, you can safely ignore it.',
          '',
          'Thank you,',
          'Medplum',
          '',
        ].join('\n'),
      });
      sendOutcome(res, allOk);
    }
  }
}

/**
 * Creates a "password change request" for the user.
 * Returns the URL to the password change request.
 * @param user - The user to create the password change request for.
 * @param type - The type of password change request.
 * @param redirectUri - Optional URI for redirection to the client application.
 * @returns The URL to reset the password.
 */
export async function resetPassword(
  user: User,
  type: 'invite' | 'reset' | 'otp',
  redirectUri?: string
): Promise<string> {
  // Create the password change request
  let pcr: UserSecurityRequest;
  if (type === 'otp') {
    // Generate a 5-digit numeric OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString();

    // Set expiration time to 10 minutes from now
    // const expirationTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    //1 minute
    const expirationTime = new Date(Date.now() + 60 * 1000).toISOString();

    const systemRepo = getSystemRepo();
    pcr = await systemRepo.createResource<UserSecurityRequest>({
      resourceType: 'UserSecurityRequest',
      meta: {
        project: resolveId(user.project),
      },
      // type,
      user: createReference(user),
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
      redirectUri,
    });
    // Build the reset URL
    return `${pcr.id}/${pcr.secret}`;
  } else {
    const systemRepo = getSystemRepo();
    pcr = await systemRepo.createResource<UserSecurityRequest>({
      resourceType: 'UserSecurityRequest',
      meta: {
        project: resolveId(user.project),
      },
      type,
      user: createReference(user),
      secret: generateSecret(16),
      redirectUri,
    });
    // Build the reset URL
    return `${getConfig().appBaseUrl}setpassword/${pcr.id}/${pcr.secret}`;
  }
}
