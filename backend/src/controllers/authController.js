import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '4h' });
};

export const registerUser = async (req, res) => {
  const { name, studentId, email, password, role } = req.body;

  try {
    const query = [{ email }];
    if (studentId && studentId.trim() !== '') query.push({ studentId });
    const userExists = await User.findOne({ $or: query });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists!' });
    }

    // 🚨 MANUALLY HASH AND BYPASS BROKEN MONGOOSE HOOKS!
    const hashedPassword = bcrypt.hashSync(password, 10);

    const userData = {
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      isActive: true,
      passwordResetRequired: false
    };

    if (userData.role === 'teacher' || userData.role === 'faculty') {
      userData.facultyId = `FAC-${Date.now()}`;
    } else {
      userData.studentId = studentId;
    }

    // 🚨 RAW MONGODB INSERT: This NEVER loops forever!
    await User.collection.insertOne(userData);
    const user = await User.findOne({ email });

    res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password, id } = req.body; 
  const loginIdentifier = email || id;

  try {
    const user = await User.findOne({
      $or: [
        { email: loginIdentifier },
        { studentId: loginIdentifier },
        { facultyId: loginIdentifier }
      ]
    });

    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account is disabled. Please contact admin.' });

    if (await user.matchPassword(password)) {
      
      // 🚨 CRITICAL FIX: Bypass Mongoose save() to update lastLogin so it doesn't trigger the password hashing hook!
      await User.collection.updateOne(
        { _id: user._id },
        { $set: { lastLogin: new Date() } }
      );

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

    // 🚨 MANUALLY HASH AND BYPASS BROKEN MONGOOSE HOOKS!
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await User.collection.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword, passwordResetRequired: false } }
    );

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};