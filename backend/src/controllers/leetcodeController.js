import axios from 'axios';

export const verifyLeetcodeUser = async (req, res) => {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username required' });
  }

  try {
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
        }
      }
    `;

    console.log(`🔍 [DEBUG] Verifying user: ${username}`);

    const response = await axios.post('https://leetcode.com/graphql', {
      query,
      variables: { username }
    }, {
      headers: {
        'Content-Type': 'application/json',
        // Let's use a more "human" User-Agent
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    // 🚀 LOGGING THE FULL RESPONSE TO YOUR TERMINAL
    console.log('📦 [DEBUG] LeetCode API Response:', JSON.stringify(response.data, null, 2));

    const matchedUser = response.data?.data?.matchedUser;

    if (matchedUser && matchedUser.username) {
      return res.json({ success: true, message: 'Valid LeetCode profile' });
    } else {
      return res.json({ success: false, message: 'User does not exist' });
    }
  } catch (error) {
    console.error('❌ [DEBUG] LeetCode Verification Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to connect to LeetCode' });
  }
};