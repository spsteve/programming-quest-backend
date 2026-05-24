import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    finalPosition: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    wrongAnswers: { type: Number, default: 0 }
  },
  { _id: false }
);

const gameSessionSchema = new mongoose.Schema(
  {
    players: [playerSchema],
    winner: { type: String },
    totalRounds: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    completed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('GameSession', gameSessionSchema);
