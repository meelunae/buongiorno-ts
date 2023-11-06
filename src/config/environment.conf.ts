export function checkRequiredEnvVariables(requiredVariables: string[]) {
    const missingVariables = requiredVariables.filter((variable) => !process.env[variable]);
    if (missingVariables.length > 0) {
        throw new Error(`Some required environment variables are missing: ${missingVariables.join(', ')}`);
    }
}