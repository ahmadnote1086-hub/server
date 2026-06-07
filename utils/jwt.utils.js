import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || 'your-default-secret';

/** 
 * Generate a JWT token
 * @param {Object} payload - Data to include in the token  
 * @returns {string} JWT token
*/
export const generateToken = (user) => {
  const token = jwt.sign(
    { id: user.id, username: user.username, fullName: user.fullName, timezone: user.timezone, role: user.role }, SECRET_KEY
  );
  return token;
};   

/**
 * Verify a JWT Token
 * @param {string} token - JWT token to verify 
 * @returns {Object|null} Decoded token if valid, null otherwise
 */
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        console.log('Invalid Token', error.message);
        return null;
    }
}

export default {
    generateToken,
    verifyToken
}