import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // If data is already wrapped in success format, return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Wrap response in standard format
        return {
          success: true,
          data: data,
        };
      }),
    );
  }
}

