const { checkRedis, checkDatabase } = require('../utils');
const User = require('../models/User');
const File = require('../models/File');

const AppController = {
  getStatus: async (req, res) => {
    try {
      const redisStatus = await checkRedis();
      const dbStatus = await checkDatabase();

      res.status(200).json({ redis: redisStatus, db: dbStatus });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  getStats: async (req, res) => {
    try {
      const userCount = await User.countDocuments();
      const fileCount = await File.countDocuments();

      res.status(200).json({ users: userCount, files: fileCount });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

module.exports = AppController;
