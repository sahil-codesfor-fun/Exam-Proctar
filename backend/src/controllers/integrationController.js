import prisma from '../config/prisma.js';
import ProviderRegistry from '../services/sync/ProviderRegistry.js';
import PlatformSyncService from '../services/sync/PlatformSyncService.js';

export const getIntegrations = async (req, res) => {
  try {
    const integrations = await prisma.platformIntegration.findMany({
      where: { userId: req.user.id },
      include: { statistics: true }
    });
    res.json({ success: true, data: integrations });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch integrations.' });
  }
};

export const verifyUsername = async (req, res) => {
  const { platform } = req.params;
  const { username } = req.body;

  try {
    const provider = ProviderRegistry.get(platform.toUpperCase());
    const profile = await provider.validate(username);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const connectIntegration = async (req, res) => {
  const { platform } = req.params;
  const { username } = req.body;

  try {
    const provider = ProviderRegistry.get(platform.toUpperCase());
    
    // Double check it's valid
    const profile = await provider.validate(username);

    // Save
    const integration = await prisma.platformIntegration.upsert({
      where: {
        userId_platform: { userId: req.user.id, platform: platform.toUpperCase() }
      },
      update: {
        username: profile.username,
        profileUrl: profile.profileUrl,
        avatarUrl: profile.avatarUrl,
        displayName: profile.displayName,
        country: profile.country,
        syncStatus: 'CONNECTED'
      },
      create: {
        userId: req.user.id,
        platform: platform.toUpperCase(),
        username: profile.username,
        profileUrl: profile.profileUrl,
        avatarUrl: profile.avatarUrl,
        displayName: profile.displayName,
        country: profile.country,
        syncStatus: 'CONNECTED'
      }
    });

    // Trigger background sync, but don't block
    PlatformSyncService.syncIntegration(integration.id).catch(err => console.error('Initial sync error:', err));

    res.json({ success: true, data: integration });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const disconnectIntegration = async (req, res) => {
  const { platform } = req.params;

  try {
    await prisma.platformIntegration.update({
      where: {
        userId_platform: { userId: req.user.id, platform: platform.toUpperCase() }
      },
      data: { syncStatus: 'DISCONNECTED' }
    });
    res.json({ success: true, message: 'Platform disconnected.' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Integration not found.' });
  }
};

export const syncIntegration = async (req, res) => {
  const { platform } = req.params;

  try {
    const integration = await prisma.platformIntegration.findUnique({
      where: { userId_platform: { userId: req.user.id, platform: platform.toUpperCase() } }
    });
    if (!integration) throw new Error('Integration not found.');

    await PlatformSyncService.syncIntegration(integration.id);
    
    // Return fresh data
    const fresh = await prisma.platformIntegration.findUnique({
      where: { id: integration.id },
      include: { statistics: true }
    });

    res.json({ success: true, data: fresh });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 🚀 NUEVO: The Universal Sync Engine!
export const syncAllIntegrations = async (req, res) => {
  try {
    // 1. Find all active integrations
    const integrations = await prisma.platformIntegration.findMany({
      where: { syncStatus: { not: 'DISCONNECTED' } }
    });

    // 2. Respond immediately so the frontend button stops spinning
    // We run the heavy scraping in the background!
    res.json({ success: true, message: `Mass sync initiated for ${integrations.length} profiles.` });

    // 3. Run the scraping engine for every student
    for (const integration of integrations) {
      try {
        await PlatformSyncService.syncIntegration(integration.id);
        // Add a polite 2-second delay so LeetCode/HackerRank doesn't block your IP!
        await new Promise(resolve => setTimeout(resolve, 2000)); 
      } catch (err) {
        console.error(`Mass Sync failed for ID ${integration.id}:`, err.message);
      }
    }
    console.log('✅ Universal Mass Sync Complete!');
  } catch (error) {
    console.error('❌ Universal Sync Error:', error);
    // Only send error if headers aren't already sent
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error during mass sync' });
    }
  }
};