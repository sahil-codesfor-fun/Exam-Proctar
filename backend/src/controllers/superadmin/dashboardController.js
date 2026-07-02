import dashboardService from '../../services/dashboardService.js';

export const getDashboardStats = async (req, res) => {
  try {
    const stats = await dashboardService.getStats();
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardActivity = async (req, res) => {
  try {
    const activity = await dashboardService.getRecentActivity();
    res.status(200).json(activity);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
