import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import { schemas } from './components';

const definition: swaggerJSDoc.Options['definition'] = {
  openapi: '3.0.3',
  info: {
    title: 'LegoPersona API',
    version: '1.0.0',
    description: 'API for uploading a photo, generating a LEGO-fied persona, and browsing the community gallery.',
  },
  servers: [
    { url: '/api' },
  ],
  components: {
    schemas,
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const pathsGlob = path.join(__dirname, 'paths', '*.docs.{ts,js}').split(path.sep).join('/');

const options: swaggerJSDoc.Options = {
  definition,
  apis: [pathsGlob],
};

export const swaggerSpec = swaggerJSDoc(options);
