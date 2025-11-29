import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || responseObj.error || exception.message;
        error = responseObj.error || exception.message;

        // Handle validation errors - array of messages
        if (Array.isArray(responseObj.message)) {
          message = responseObj.message;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.message;
    }

    const errorResponse = {
      success: false,
      error: typeof error === 'string' ? error : 'Error',
      message: message,
      statusCode: status,
      ...(process.env.NODE_ENV === 'development' && {
        path: request.url,
        timestamp: new Date().toISOString(),
      }),
    };

    response.status(status).json(errorResponse);
  }
}

