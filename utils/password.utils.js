import bcrypt from 'bcrypt';

const SALT_ROUND = 10;

export const hashPassword = async (password) => {
    return bcrypt.hash(password, SALT_ROUND);
}

export const comparePassword = (plainPassword, hashedPassword) => {
    return bcrypt.compare(plainPassword, hashedPassword);
}