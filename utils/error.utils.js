export const throwErr = (message, statusCode) => {
    const error = new Error(message);
    error.status = statusCode || 404;
    throw error;
}