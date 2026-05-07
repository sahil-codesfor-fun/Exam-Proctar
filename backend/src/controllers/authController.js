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
    const user = await User.create({ 
      name, 
      studentId: role === 'teacher' ? `FAC-${Date.now()}` : studentId, 
      email, 
      password,
      role: role || 'student' 
    });

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
  // 4. Changed to email for login flexibility
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials, ¡inténtalo de nuevo!' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};