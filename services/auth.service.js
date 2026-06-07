import { createUser, fetchUserByEmail } from "../models/user.model.js";
import { assignDailyQuestsModel } from "../models/quests.model.js";
import { hashPassword, comparePassword } from "../utils/password.utils.js";
import { generateUsername } from "../utils/username.utils.js";
import { throwErr } from "../utils/error.utils.js";

// Hash password, generate username, store user in db and returns user;
export const registerService = async (email, fullName, password, timezone) => {
  const hashedPassword = await hashPassword(password);
  const username = generateUsername(fullName);
  const user = await createUser(
    email,
    username,
    fullName,
    hashedPassword,
    timezone
  );

  await assignDailyQuestsModel(user.id);
  return user;
};

// fetch's user from db, compare's password and return user
export const loginService = async (email, password) => {
    const user = await fetchUserByEmail(email);
    if (!user) {
      throwErr("User not found", 404);
    }
    
    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      throwErr("Password does not match!", 401);
    }

    return {  
      message: "Logged in successfully!",
      success: true,
      user: {
        id: user.user_id,
        email: user.email,
        username: user.username,
        fullname: user.fullname,
        timezone: user.timezone,
        role: user.role
      },
    };
};
