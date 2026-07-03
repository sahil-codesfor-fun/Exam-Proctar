// In-memory placeholder store for settings
const settingsStore = {
  university: {
    name: 'Nexus University',
    email: 'contact@nexus.edu',
    phone: '+1 234 567 8900',
    address: '123 Education Blvd, Knowledge City',
    website: 'https://nexus.edu',
    academicYear: '2026-2027',
    timeZone: 'UTC-05:00',
  },
  security: {
    passwordPolicy: 'Strong',
    sessionTimeout: 30, // minutes
    maxLoginAttempts: 5,
    twoFactorAuth: false,
  },
  examination: {
    defaultDuration: 120, // minutes
    autoSubmit: true,
    fullscreenEnforcement: true,
    webcamRequirement: true,
    copyPasteRestriction: true,
    tabSwitchingDetection: true,
    antiCheatLevel: 'High',
  },
  notifications: {
    smtpHost: 'smtp.nexus.edu',
    smtpPort: 587,
    emailNotifications: true,
    examReminders: true,
    resultNotifications: true,
    passwordResetEmails: true,
    welcomeEmails: true,
  },
  appearance: {
    themeMode: 'light',
    primaryColor: '#10B981', // emerald-500
    layout: 'fluid',
    compactMode: false,
  }
};

export const getSettings = (req, res) => {
  const { module } = req.params;
  
  if (module && settingsStore[module]) {
    return res.json({ success: true, data: settingsStore[module] });
  }

  // If no module specified or not found in our dummy store, return all
  res.json({ success: true, data: settingsStore });
};

export const updateSettings = (req, res) => {
  const { module } = req.params;
  const data = req.body;

  if (module && settingsStore[module]) {
    settingsStore[module] = { ...settingsStore[module], ...data };
    return res.json({ success: true, message: `${module} settings updated`, data: settingsStore[module] });
  }

  res.status(404).json({ success: false, message: 'Settings module not found' });
};
