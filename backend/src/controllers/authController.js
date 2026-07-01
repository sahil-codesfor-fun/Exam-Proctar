import prisma from '../config/prisma.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '4h' });
};

export const registerUser = async (req, res) => {
  // 🚀 GRAB THE NEW COURSE AND SECTION
  const { name, studentId, email, password, role, course, section } = req.body;

  try {
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
      passwordResetRequired: false,
      // 🚀 INJECT THEM INTO THE DB
      course: role === 'student' ? course : null,
      section: role === 'student' ? section : null
    };

    if (newUserData.role === 'teacher' || newUserData.role === 'faculty') {
      newUserData.facultyId = `FAC-${Date.now()}`;
    } else {
      newUserData.studentId = studentId;
    }

    const user = await prisma.user.create({ data: newUserData });

    res.status(201).json({
      success: true,
      _id: user.id,
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
  const { email, password, id, role: requestedRole } = req.body; 
  const loginIdentifier = email || id;

  try {
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

    if (requestedRole) {
      const isFacultyPortal = requestedRole === 'teacher' || requestedRole === 'faculty';
      const isUserFaculty = user.role === 'teacher' || user.role === 'faculty';
      
      if (isFacultyPortal && !isUserFaculty) {
        return res.status(403).json({ success: false, message: `Access Denied`});
      } else if (!isFacultyPortal && user.role !== requestedRole) {
        return res.status(403).json({ success: false, message: `Access Denied` });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
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