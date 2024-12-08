import { BadRequestException, ValidationPipe } from '@nestjs/common';

import parseValidationErrors from './parseValidationErrors';

export default function getCommonValidationPipe(isLocal: boolean): ValidationPipe {
    return new ValidationPipe({
        whitelist: true,
        transform: true,
        enableDebugMessages: isLocal,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        stopAtFirstError: false,
        validationError: {
            value: true,
        },
        exceptionFactory: (errors): Error => {
            const collectedErrors: Record<string, string> = parseValidationErrors([], errors);
            return new BadRequestException(collectedErrors);
        },
    });
}
