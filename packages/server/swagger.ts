export const swaggerOptions: Record<string, any> = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'sohealthfull API',
      version: '1.0.0',
      description: 'Custom APIs built on top of Medplum',
    },
    servers: [
      {
        url: 'http://localhost:8103',
        description: 'Local server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [
    './api/auth/login.docs.ts',
    './api/auth/signup.docs.ts',
    './api/auth/updateprofile.docs.ts',
    './api/auth/getprojectid.docs.ts',
    './api/auth/verifyotp.docs.ts',
  ],
};
