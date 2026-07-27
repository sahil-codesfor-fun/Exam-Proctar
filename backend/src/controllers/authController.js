import prisma from '../config/prisma.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '4h' });
};

export const registerUser = async (req, res) => {
  const { name, studentId, email, password, course, section, departmentId } = req.body;

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
      role: 'student',
      isActive: true,
      passwordResetRequired: false,
      course: course || null,
      section: section || null,
      departmentId: departmentId || null
    };

    newUserData.studentId = studentId;

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
      },
      include: {
        departmentRel: { select: { name: true, code: true } }
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
      const userAgent = req.headers['user-agent'] || '';
      const browser = userAgent.match(/(firefox|edge|msie|chrome|safari|trident)/i)?.[0] || 'Unknown';
      const os = userAgent.match(/(windows|macintosh|linux|android|iphone|ipad)/i)?.[0] || 'Unknown';
      const deviceType = userAgent.match(/(mobi|tablet)/i) ? 'Mobile/Tablet' : 'Desktop';
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'Unknown';

      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        }),
        prisma.loginHistory.create({
          data: {
            userId: user.id,
            ipAddress,
            browser,
            os,
            deviceType
          }
        })
      ]);

      res.json({
        success: true,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        facultyId: user.facultyId,
        departmentRel: user.departmentRel,
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

export const getPublicDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, code: true }
    });
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFacultyProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        departmentRel: { select: { name: true, code: true } },
        subjectsTeaching: {
          include: {
            subject: true
          }
        },
        _count: {
          select: {
            examsCreated: true,
            practiceSheetsCreated: true
          }
        }
      }
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const activeExams = await prisma.exam.count({
      where: { creatorId: req.user.id, status: 'active' }
    });
    const draftedExams = await prisma.exam.count({
      where: { creatorId: req.user.id, status: 'draft' }
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        facultyId: user.facultyId,
        department: user.departmentRel,
        designation: user.designation,
        qualification: user.qualification,
        experience: user.experience,
        phone: user.phone,
        joinedAt: user.createdAt,
        subjects: user.subjectsTeaching.map(st => st.subject),
        stats: {
          totalExamsCreated: user._count.examsCreated,
          activeExams,
          draftedExams,
          totalPracticeSheets: user._count.practiceSheetsCreated
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};