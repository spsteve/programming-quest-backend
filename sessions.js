import express from 'express';
import GameSession from '../models/GameSession.js';

const router = express.Router();

// POST /api/sessions αποθήκευση ολοκληρωμένου παιχνιδιού
router.post('/', async (req, res) => {
  try {
    const session = await GameSession.create(req.body);
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/sessions/stats γενικά στατιστικά
router.get('/stats', async (req, res) => {
  try {
    const [totalGames, completedGames, avgDuration] = await Promise.all([
      GameSession.countDocuments(),
      GameSession.countDocuments({ completed: true }),
      GameSession.aggregate([
        { $match: { completed: true } },
        { $group: { _id: null, avg: { $avg: '$durationSeconds' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalGames,
        completedGames,
        avgDurationSeconds: avgDuration[0]?.avg || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/sessions recent
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const sessions = await GameSession.find()
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
