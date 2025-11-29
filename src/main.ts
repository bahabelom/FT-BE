import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });
  
  // Set global prefix for all routes
  app.setGlobalPrefix('api');
  
  // Enable global exception filter for consistent error format
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Enable global response interceptor for consistent success format
  app.useGlobalInterceptors(new TransformInterceptor());
  
  // Enable global request logging
  app.useGlobalInterceptors(new LoggingInterceptor());
  
  // Enable global validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => {
      const messages = errors.map((error) => {
        const constraints = error.constraints || {};
        return Object.values(constraints).join(', ');
      });
      return new ValidationPipe().createExceptionFactory()(errors);
    },
  }));
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
