import { verifyToken } from "../utils/jwt.utils.js";

export const authMiddleware = (req, res, next) => {
  let token = req.cookies.token;

  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res.status(403).json({ message: "Invalid token" });
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    console.error("JWT verification error:", err.message);
    return res.status(403).json({ message: "Invalid token" });
  }
  if (!decoded) {
    console.error("JWT verification failed:", token);
    return res.status(403).json({ message: "Invalid token" });
  }

  req.user = decoded;
  next();
};
