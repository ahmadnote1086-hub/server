import { registerService, loginService } from '../services/auth.service.js';
import { generateToken } from '../utils/jwt.utils.js';

// Registers a new user account
export const registerController = async (req, res) => {
    try {
        const { email, fullName, password, timezone } = req.body;

        const user = await registerService(email, fullName, password, timezone);
        const token = generateToken(user, timezone); // Generate token
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "None",
            path: '/',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });
        res.status(200).json({ message: 'User created successfully!', user, token });
    } catch (error) {
        console.log('error', error.message);
        res.status(error.status || 500).json({ message: "Failed to create user", error: error.message })
    }
}

// Authenticates a user and sets a JWT cookie
export const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const result = await loginService(email, password);
        const token = generateToken(result.user); // Generates token

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "None",
            maxAge: 30 * 24 * 60 * 60 * 1000
        });
        res.status(200).json({
            message: result.message,
            user: result.user,
            token
          });
    } catch (error) {
        const statusCode = error.status || 500;
        res.status(statusCode).json({ message: "Login failed", error: error.message });
    }
}

// Logs out a user by clearing the JWT cookie
export const logoutController = (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: "Logged out successfully" });
}