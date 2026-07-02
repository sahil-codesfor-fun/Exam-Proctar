import prisma from '../../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '8h' });
};

export const superAdminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Access denied. Super Admin privileges required.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is disabled.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'SUPER_ADMIN_LOGIN',
        entity: 'User',
        entityId: user.id,
        details: `Super Admin logged in`,
        userId: user.id
      }
    });

    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Super Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
