import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import process from "process";

import parseValidationErrors from "./parseValidationErrors";

export function validateAndApplyConfig<T extends object>(
	configurationClass: new () => T,
	target: T,
): void {
	const validatedConfig = plainToInstance(configurationClass, process.env, {
		enableImplicitConversion: true,
	});
	const errors = validateSync(validatedConfig, { skipMissingProperties: false });

	if (errors.length > 0) {
		const collectedErrors = parseValidationErrors([], errors);
		throw new Error(
			`Config validation failed\n${configurationClass.name}:${JSON.stringify(
				collectedErrors,
				null,
				2,
			)}`,
		);
	}

	Object.assign(target, validatedConfig);
}
