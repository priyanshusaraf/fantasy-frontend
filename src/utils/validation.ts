export interface RegistrationData {
  username: string;
  email: string;
  password: string;
}

export interface UserUpdateData {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
}

export interface PasswordResetData {
  email: string;
  newPassword: string;
  resetToken: string;
}

export function validateRegistration(userData: RegistrationData) {
  const errors: { [key: string]: string } = {};

  if (!userData.username || userData.username.length < 3) {
    errors.username = "Username must be at least 3 characters long";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!userData.email || !emailRegex.test(userData.email)) {
    errors.email = "Invalid email address";
  }

  if (!userData.password || userData.password.length < 8) {
    errors.password = "Password must be at least 8 characters long";
  }

  const passwordStrengthRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (userData.password && !passwordStrengthRegex.test(userData.password)) {
    errors.passwordStrength =
      "Password must include uppercase, lowercase, number, and special character";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateUserUpdate(userData: UserUpdateData) {
  const errors: { [key: string]: string } = {};

  if (userData.username && userData.username.length < 3) {
    errors.username = "Username must be at least 3 characters long";
  }

  if (userData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      errors.email = "Invalid email address";
    }
  }

  if (userData.password) {
    if (userData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }

    const passwordStrengthRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordStrengthRegex.test(userData.password)) {
      errors.passwordStrength =
        "Password must include uppercase, lowercase, number, and special character";
    }
  }

  if (userData.role && !["user", "admin"].includes(userData.role)) {
    errors.role = 'Invalid role. Must be "user" or "admin"';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export function validatePasswordReset(data: PasswordResetData) {
  const errors: { [key: string]: string } = {};

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.email = "Invalid email address";
  }

  if (!data.newPassword || data.newPassword.length < 8) {
    errors.newPassword = "New password must be at least 8 characters long";
  }

  const passwordStrengthRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (data.newPassword && !passwordStrengthRegex.test(data.newPassword)) {
    errors.passwordStrength =
      "New password must include uppercase, lowercase, number, and special character";
  }

  if (!data.resetToken) {
    errors.resetToken = "Reset token is required";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
