import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // 🚨 PRISMA TRANSLATION
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { departmentRel: { select: { name: true, code: true } } }
      });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      delete user.password;
      req.user = user;
      
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token' });
};

export const teacherOnly = (req, res, next) => {
  if (req.user?.role !== 'teacher' && req.user?.role !== 'faculty') {
    return res.status(403).json({ message: 'Teacher access only' });
  }
  next();
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
};

export const superAdminOnly = (req, res, next) => {
  console.log('superAdminOnly check - User:', req.user?.email, 'Role:', req.user?.role);
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ message: `Super Admin access only. Detected role: ${req.user?.role || 'None'}` });
  }
  next();
};

export const facultyOnly = teacherOnly;

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: `Access denied. Requires one of roles: ${roles.join(', ')}` });
    }
    next();
  };
};