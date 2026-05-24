import express from 'express';
import Question from '../models/Question.js';

const router = express.Router();

// GET /api/questions/random?category=&difficulty=&exclude=id1,id2
// Επιστρέφει μία τυχαία ερώτηση με optional filters
router.get('/random', async (req, res) => {
  try {
    const { category, difficulty, exclude } = req.query;

    const match = {};
    if (category) match.category = category;
    if (difficulty) match.difficulty = difficulty;
    if (exclude) {
      const excludeIds = exclude.split(',').filter(Boolean);
      if (excludeIds.length > 0) {
        match._id = { $nin: excludeIds };
      }
    }

    const [question] = await Question.aggregate([
      { $match: match },
      { $sample: { size: 1 } }
    ]);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Δεν βρέθηκε ερώτηση με αυτά τα κριτήρια'
      });
    }

    res.json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/questions με pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;

    const [questions, total] = await Promise.all([
      Question.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Question.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: questions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/questions/categories λίστα με όλες τις κατηγορίες και count
router.get('/categories', async (req, res) => {
  try {
    const categories = await Question.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/questions/:id
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Δεν βρέθηκε' });
    }
    res.json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/questions δημιουργία νέας ερώτησης
router.post('/', async (req, res) => {
  try {
    const question = await Question.create(req.body);
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/questions/:id/record καταγραφή στατιστικού (σωστή/λάθος)
router.post('/:id/record', async (req, res) => {
  try {
    const { correct } = req.body;
    const update = correct
      ? { $inc: { timesAsked: 1, timesCorrect: 1 } }
      : { $inc: { timesAsked: 1 } };

    const question = await Question.findByIdAndUpdate(req.params.id, update, {
      new: true
    });

    if (!question) {
      return res.status(404).json({ success: false, message: 'Δεν βρέθηκε' });
    }
    res.json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/questions/:id
router.put('/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!question) {
      return res.status(404).json({ success: false, message: 'Δεν βρέθηκε' });
    }
    res.json({ success: true, data: question });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/questions/:id
router.delete('/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Δεν βρέθηκε' });
    }
    res.json({ success: true, message: 'Διαγράφηκε επιτυχώς' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
