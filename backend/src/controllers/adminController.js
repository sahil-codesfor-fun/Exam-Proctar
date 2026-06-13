import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const generateFacultyId = async () => {
  let id;
  let exists = true;
  while (exists) {
    id = `FAC${Math.floor(1000 + Math.random() * 9000)}`;
    const user = await User.findOne({ facultyId: id });
    if (!user) exists = false;
  }
  return id;
};

export const getFacultyList = async (req, res) => {
  try {
    const { search, department } = req.query;
    let query = { role: { $in: ['teacher', 'faculty'] } }; 
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { facultyId: { $regex: search, $options: 'i' } }
      ];
    }
    if (department && department !== 'All') query.department = department;

    const faculty = await User.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: faculty });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createFaculty = async (req, res) => {
  try {
    const { name, email, department, password } = req.body;
    
    if (!password) return res.status(400).json({ success: false, message: 'Admin must manually provide a password.' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const facultyId = await generateFacultyId();

    // 🚨 RAW DB BYPASS: Hashes perfectly once, skips the infinite loop hook!
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const newFaculty = {
      name,
      email,
      facultyId,
      department,
      password: hashedPassword,
      role: 'faculty', 
      isActive: true,
      passwordResetRequired: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 🚨 INSTANT CREATION: No Mongoose hanging!
    await User.collection.insertOne(newFaculty);

    return res.status(201).json({ success: true, message: '✅ Faculty provisioned instantly!' });
  } catch (err) {
    console.error("Creation Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleFacultyStatus = async (req, res) => {
  try {
    const faculty = await User.findById(req.params.id);
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });

    // 🚨 Bypassing hooks just to be safe!
    await User.collection.updateOne(
        { _id: faculty._id },
        { $set: { isActive: !faculty.isActive } }
    );

    res.json({ success: true, message: `Faculty status updated successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const resetFacultyPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, message: 'New password is required.' });

    const faculty = await User.findById(req.params.id);
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });

    // 🚨 Bypassing hooks so the password isn't corrupted!
    const hashedPassword = bcrypt.hashSync(password, 10);
    await User.collection.updateOne(
        { _id: faculty._id },
        { $set: { password: hashedPassword, passwordResetRequired: false } }
    );

    res.json({ success: true, message: `Password manually updated successfully!` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteFaculty = async (req, res) => {
  try {
    const faculty = await User.findByIdAndDelete(req.params.id);
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });
    res.json({ success: true, message: 'Faculty account deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const testEmail = async (req, res) => {
  res.status(200).json({ success: true, message: 'Email system disabled by admin.' });
};