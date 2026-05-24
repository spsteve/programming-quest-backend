import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Η ερώτηση είναι υποχρεωτική'],
      trim: true,
      maxlength: 500
    },
    answer: {
      type: Boolean,
      required: [true, 'Η απάντηση είναι υποχρεωτική (true/false)']
    },
    explanation: {
      type: String,
      required: [true, 'Η επεξήγηση είναι υποχρεωτική'],
      trim: true,
      maxlength: 500
    },
    category: {
      type: String,
      enum: [
        'JavaScript',
        'Python',
        'React',
        'SQL',
        'MongoDB',
        'Git',
        'CSS',
        'HTML',
        'Java',
        'C++',
        'Algorithms',
        'Web',
        'General'
      ],
      default: 'General',
      index: true
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      index: true
    },
    timesAsked: {
      type: Number,
      default: 0
    },
    timesCorrect: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Virtual για success rate
questionSchema.virtual('successRate').get(function () {
  if (this.timesAsked === 0) return null;
  return Math.round((this.timesCorrect / this.timesAsked) * 100);
});

questionSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Question', questionSchema);
