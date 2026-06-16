import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';

const generateFacultyId = async () => {
  let id;
  let exists = true;
  while (exists) {
    id = `FAC${Math.floor(1000 + Math.random() * 9000)}`;
    const user = await prisma.user.findUnique({ where: { facultyId: id } });
    if (!user) exists = false;
  }
  return id;
};

export const getFacultyList = async (req, res) => {
  try {
    const { search, department } = req.query;
    
    // 🚨 PRISMA FILTERING
    let whereClause = {
      role: { in: ['teacher', 'faculty'] }
    };
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { facultyId: { contains: search } }
      ];
    }
    if (department && department !== 'All') whereClause.department = department;

    const faculty = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    // Map 'id' to '_id' so the React frontend Admin Dashboard still works perfectly!
    const formattedFaculty = faculty.map(f => ({ ...f, _id: f.id }));
    res.json({ success: true, data: formattedFaculty });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createFaculty = async (req, res) => {
  try {
    const { name, email, department, password } = req.body;
    
    if (!password) return res.status(400).json({ success: false, message: 'Admin must manually provide a password.' });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const facultyId = await generateFacultyId();
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // 🚨 PRISMA CREATE
    await prisma.user.create({
      data: {
        name,
        email,
        facultyId,
        department,
        password: hashedPassword,
        role: 'faculty', 
        isActive: true,
        passwordResetRequired: false
      }
    });

    return res.status(201).json({ success: true, message: '✅ Faculty provisioned instantly!' });
  } catch (err) {
    console.error("Creation Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleFacultyStatus = async (req, res) => {
  try {
    const faculty = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });

    await prisma.user.update({
      where: { id: faculty.id },
      data: { isActive: !faculty.isActive }
    });

    res.json({ success: true, message: `Faculty status updated successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const resetFacultyPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, message: 'New password is required.' });

    const faculty = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });

    const hashedPassword = bcrypt.hashSync(password, 10);
    await prisma.user.update({
      where: { id: faculty.id },
      data: { password: hashedPassword, passwordResetRequired: false }
    });

    res.json({ success: true, message: `Password manually updated successfully!` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteFaculty = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Faculty account deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Faculty not found or deletion error' });
  }
};

export const testEmail = async (req, res) => {
  res.status(200).json({ success: true, message: 'Email system disabled by admin.' });
};