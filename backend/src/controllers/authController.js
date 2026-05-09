import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '4h' });
};

export const registerUser = async (req, res) => {
  // 1. Added 'role' to the destructuring
  const { name, studentId, email, password, role } = req.body;

  try {
    // 2. Check for existing user by Email or ID
    const query = [{ email }];
    if (studentId && studentId.trim() !== '') query.push({ studentId });
    const userExists = await User.findOne({ $or: query });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists!' });
    }

    // 3. Create user with the role sent from Frontend
    const userData = {
      name,
      email,
      password,
      role: role || 'student'
    };

    if (userData.role === 'teacher') {
      userData.facultyId = `FAC-${Date.now()}`;
    } else {
      userData.studentId = studentId;
    }

    const user = await User.create(userData);

    if (user) {
      res.status(201).json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password, id } = req.body; // 'id' can be studentId or facultyId
  const loginIdentifier = email || id;

  try {
    const user = await User.findOne({
      $or: [
        { email: loginIdentifier },
        { studentId: loginIdentifier },
        { facultyId: loginIdentifier }
      ]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is disabled. Please contact admin.' });
    }

    if (await user.matchPassword(password)) {
      user.lastLogin = new Date();
      await user.save();

      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        facultyId: user.facultyId,
        passwordResetRequired: user.passwordResetRequired,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (currentPassword && !(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }

    user.password = newPassword;
    user.passwordResetRequired = false;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};