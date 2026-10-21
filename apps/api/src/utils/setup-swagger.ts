import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { Environment } from '../common/constants/app.constant';
import { AllConfigType } from '../config/config.type';

import { getPackageVersion } from './app-version.util';

let cachedDocument: OpenAPIObject | null = null;

export function getOpenApiDocument(): OpenAPIObject | null {
  return cachedDocument;
}

export function setOpenApiDocument(doc: OpenAPIObject | null): void {
  cachedDocument = doc;
}

export function setupSwagger(app: INestApplication): OpenAPIObject {
  const configService = app.get(ConfigService<AllConfigType>);
  const appName = configService.getOrThrow('app.name', { infer: true });
  const appUrl = configService.getOrThrow('app.url', { infer: true });
  const nodeEnv = configService.getOrThrow('app.nodeEnv', { infer: true });

  const config = new DocumentBuilder()
    .setTitle(appName)
    .setDescription('NestJS API Documentation')
    .setVersion(getPackageVersion())
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer(appUrl, 'Current Environment')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  cachedDocument = document;

  // Do not expose public Swagger UI in production
  if (nodeEnv !== Environment.PRODUCTION) {
    SwaggerModule.setup('docs', app, document, {
      customSiteTitle: `${appName} - Swagger Docs`,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
      },
    });
  }

  return document;
}
