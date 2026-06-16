import prisma from '../config/prisma.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '4h' });
};

export const registerUser = async (req, res) => {
  const { name, studentId, email, password, role } = req.body;

  try {
    // 🚨 PRISMA OR QUERY
    const userExists = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(studentId && studentId.trim() !== '' ? [{ studentId }] : [])
        ]
      }
    });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists!' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    let newUserData = {
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      isActive: true,
      passwordResetRequired: false
    };

    if (newUserData.role === 'teacher' || newUserData.role === 'faculty') {
      newUserData.facultyId = `FAC-${Date.now()}`;
    } else {
      newUserData.studentId = studentId;
    }

    // 🚨 PRISMA CREATE
    const user = await prisma.user.create({ data: newUserData });

    res.status(201).json({
      success: true,
      _id: user.id, // Mapped to _id for frontend compatibility
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password, id } = req.body; 
  const loginIdentifier = email || id;

  try {
    // 🚨 PRISMA MULTI-FIELD SEARCH
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginIdentifier },
          { studentId: loginIdentifier },
          { facultyId: loginIdentifier }
        ]
      }
    });

    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account is disabled. Please contact admin.' });

    // Directly use bcrypt to compare
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      // 🚨 PRISMA UPDATE
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      res.json({
        success: true,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        facultyId: user.facultyId,
        passwordResetRequired: user.passwordResetRequired,
        token: generateToken(user.id),
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
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, passwordResetRequired: false }
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};