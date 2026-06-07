export const generateUsername = (fullName) => {
    const trimmedName = fullName.trim().toLowerCase().replace(/\s+/g, '');
    const uniqueSuffix = Date.now().toString().slice(-4);
    return trimmedName + uniqueSuffix;
}