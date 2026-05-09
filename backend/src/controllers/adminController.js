import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { sendFacultyCredentials, sendTestEmail } from '../services/emailService.js';

const generateFacultyId = async () => {
  let id;
  let exists = true;
  while (exists) {
    // FAC + random 4 digits (FACXXXX)
    id = `FAC${Math.floor(1000 + Math.random() * 9000)}`;
    const user = await User.findOne({ facultyId: id });
    if (!user) exists = false;
  }
  return id;
};

const generateRandomPassword = () => {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const nums = "0123456789";
  const syms = "!@#$%^&*";
  const all = upper + lower + nums + syms;
  
  let pass = "";
  // Ensure one of each
  pass += upper.charAt(Math.floor(Math.random() * upper.length));
  pass += lower.charAt(Math.floor(Math.random() * lower.length));
  pass += nums.charAt(Math.floor(Math.random() * nums.length));
  pass += syms.charAt(Math.floor(Math.random() * syms.length));
  
  for (let i = 0; i < 6; i++) {
    pass += all.charAt(Math.floor(Math.random() * all.length));
  }
  return pass.split('').sort(() => Math.random() - 0.5).join('');
};

/** GET /api/admin/faculty — List all faculty */
export const getFacultyList = async (req, res) => {
  try {
    const { search, department } = req.query;
    // Querying both 'teacher' (legacy) and 'faculty' (new)
    let query = { role: { $in: ['teacher', 'faculty'] } };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { facultyId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (department && department !== 'All') {
      query.department = department;
    }

    const faculty = await User.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: faculty });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** POST /api/admin/faculty — Create faculty */
export const createFaculty = async (req, res) => {
  try {
    const { name, email, department } = req.body;
    
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const facultyId = await generateFacultyId();
    const tempPassword = generateRandomPassword();

    const faculty = await User.create({
      name,
      email,
      facultyId,
      department,
      password: tempPassword, // Will be hashed by User model pre-save hook
      role: 'faculty',
      passwordResetRequired: true,
      isActive: true
    });

    // Send Email
    try {
      await sendFacultyCredentials({ name, email, facultyId, tempPassword });
      
      res.status(201).json({ 
        success: true, 
        message: '✅ Faculty account created\n✅ Credentials email sent successfully', 
        data: faculty 
      });
    } catch (mailErr) {
      console.error("❌ SMTP ERROR:", mailErr);
      return res.status(201).json({
        success: true,
        message: '✅ Faculty account created\n❌ Credentials email could not be delivered',
        error: mailErr.message,
        data: faculty
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** PATCH /api/admin/faculty/:id/status — Toggle status */
export const toggleFacultyStatus = async (req, res) => {
  try {
    const faculty = await User.findById(req.params.id);
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });

    faculty.isActive = !faculty.isActive;
    await faculty.save();

    res.json({ success: true, message: `Faculty ${faculty.isActive ? 'enabled' : 'disabled'} successfully`, data: faculty });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** POST /api/admin/faculty/:id/reset-password — Reset password */
export const resetFacultyPassword = async (req, res) => {
  try {
    const faculty = await User.findById(req.params.id);
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });

    const tempPassword = generateRandomPassword();
    faculty.password = tempPassword;
    faculty.passwordResetRequired = true;
    await faculty.save();

    // Send Email
    try {
      await sendFacultyCredentials({ 
        name: faculty.name, 
        email: faculty.email, 
        facultyId: faculty.facultyId, 
        tempPassword 
      });
    } catch (mailErr) {
      return res.json({ 
        success: true, 
        message: 'Password reset, but email failed.',
        tempPassword 
      });
    }

    res.json({ success: true, message: 'Password reset and email sent successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** DELETE /api/admin/faculty/:id — Delete faculty */
export const deleteFaculty = async (req, res) => {
  try {
    const faculty = await User.findByIdAndDelete(req.params.id);
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });
    res.json({ success: true, message: 'Faculty account deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** POST /api/admin/test-email — Send test email */
export const testEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Recipient email required' });

    await sendTestEmail(email);
    res.json({ success: true, message: 'Test email sent successfully! Check your inbox/spam.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'SMTP Test Failed: ' + err.message });
  }
};
