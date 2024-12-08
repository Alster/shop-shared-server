import { ValidationError } from '@nestjs/common/interfaces/external/validation-error.interface';

export default function parseValidationErrors(
    propertyPath: string[],
    errors: ValidationError[],
): Record<string, string> {
    const result: Record<string, string> = {};

    for (const error of errors) {
        const { property, constraints, children } = error;
        const currentPath = [...propertyPath, property];

        if (constraints) {
            for (const value of Object.values(constraints)) {
                result[currentPath.join('.')] = `${value}. Got value: ${error.value}`;
            }
        }

        if (children) {
            const childResult = parseValidationErrors(currentPath, children);
            Object.assign(result, childResult);
        }
    }

    return result;
}
