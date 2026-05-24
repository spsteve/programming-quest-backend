import React, { useState, useEffect, useRef } from 'react';

// API base URL
const API_URL = 'http://localhost:5000/api';

const BOARD_SIZE = 30;
const PLAYER_COLORS = [
  { bg: '#3B82F6', name: 'Μπλε', ring: 'ring-blue-400' },
  { bg: '#EF4444', name: 'Κόκκινος', ring: 'ring-red-400' },
  { bg: '#10B981', name: 'Πράσινος', ring: 'ring-green-400' },
  { bg: '#F59E0B', name: 'Κίτρινος', ring: 'ring-amber-400' }
];

// API helper functions
const api = {
  async getRandomQuestion(excludeIds = [], filters = {}) {
    const params = new URLSearchParams();
    if (excludeIds.length) params.set('exclude', excludeIds.join(','));
    if (filters.category) params.set('category', filters.category);
    if (filters.difficulty) params.set('difficulty', filters.difficulty);

    const res = await fetch(`${API_URL}/questions/random?${params}`);
    if (!res.ok) throw new Error('Σφάλμα φόρτωσης ερώτησης');
    const json = await res.json();
    return json.data;
  },

  async recordAnswer(questionId, correct) {
    try {
      await fetch(`${API_URL}/questions/${questionId}/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correct })
      });
    } catch (e) {
      console.warn('Could not record stat:', e);
    }
  },

  async saveSession(sessionData) {
    try {
      await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
    } catch (e) {
      console.warn('Could not save session:', e);
    }
  },

  async getCategories() {
    try {
      const res = await fetch(`${API_URL}/questions/categories`);
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  }
};

export default function BoardGame() {
  const [gameState, setGameState] = useState('setup');
  const [numPlayers, setNumPlayers] = useState(2);
  const [playerNames, setPlayerNames] = useState(['Παίκτης 1', 'Παίκτης 2', 'Παίκτης 3', 'Παίκτης 4']);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [diceValue, setDiceValue] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [winner, setWinner] = useState(null);
  const [usedQuestionIds, setUsedQuestionIds] = useState([]);
  const [log, setLog] = useState([]);
  const [canRoll, setCanRoll] = useState(true);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [categories, setCategories] = useState([]);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [stats, setStats] = useState({});

  const logRef = useRef(null);

  useEffect(() => {
    api.getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  const addLog = (msg) => {
    setLog(prev => [...prev, { msg, time: Date.now() }]);
  };

  const startGame = () => {
    const initialPlayers = Array.from({ length: numPlayers }, (_, i) => ({
      id: i,
      name: playerNames[i] || `Παίκτης ${i + 1}`,
      position: 0,
      color: PLAYER_COLORS[i]
    }));
    setPlayers(initialPlayers);
    setCurrentPlayer(0);
    setGameState('playing');
    setGameStartTime(Date.now());
    setStats({});
    setLog([{ msg: `🎮 Το παιχνίδι ξεκινά! Πρώτος παίζει ο ${initialPlayers[0].name}`, time: Date.now() }]);
  };

  const rollDice = () => {
    if (!canRoll || isRolling) return;
    setCanRoll(false);
    setIsRolling(true);
    setFeedback(null);
    setApiError(null);

    let rolls = 0;
    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 10) {
        clearInterval(rollInterval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalValue);
        setIsRolling(false);
        movePlayer(finalValue);
      }
    }, 80);
  };

  const movePlayer = (steps) => {
    const player = players[currentPlayer];
    const newPosition = Math.min(player.position + steps, BOARD_SIZE - 1);

    const updatedPlayers = [...players];
    updatedPlayers[currentPlayer] = { ...player, position: newPosition };
    setPlayers(updatedPlayers);

    addLog(`🎲 ${player.name} έριξε ${steps} και μετακινήθηκε στο τετράγωνο ${newPosition + 1}`);

    setTimeout(() => {
      if (newPosition >= BOARD_SIZE - 1) {
        handleWin(player);
      } else {
        askQuestion();
      }
    }, 600);
  };

  const askQuestion = async () => {
    setLoadingQuestion(true);
    setGameState('question');
    try {
      const question = await api.getRandomQuestion(usedQuestionIds, { category, difficulty });
      setCurrentQuestion(question);
      setUsedQuestionIds(prev => [...prev, question._id]);
    } catch (err) {
      // Αν τελείωσαν οι ερωτήσεις, ξαναξεκινάμε
      if (usedQuestionIds.length > 0) {
        setUsedQuestionIds([]);
        try {
          const question = await api.getRandomQuestion([], { category, difficulty });
          setCurrentQuestion(question);
          setUsedQuestionIds([question._id]);
        } catch (err2) {
          setApiError('Δεν μπορώ να συνδεθώ με τη βάση. Βεβαιώσου ότι το backend τρέχει στο ' + API_URL);
        }
      } else {
        setApiError('Δεν μπορώ να συνδεθώ με τη βάση. Βεβαιώσου ότι το backend τρέχει στο ' + API_URL);
      }
    } finally {
      setLoadingQuestion(false);
    }
  };

  const answerQuestion = async (answer) => {
    const player = players[currentPlayer];
    const isCorrect = answer === currentQuestion.answer;
    const delta = isCorrect ? 3 : -2;
    const newPosition = Math.max(0, Math.min(player.position + delta, BOARD_SIZE - 1));

    // Καταγραφή στατιστικού στο backend (async, fire-and-forget)
    api.recordAnswer(currentQuestion._id, isCorrect);

    // Local stats
    setStats(prev => ({
      ...prev,
      [player.id]: {
        correct: (prev[player.id]?.correct || 0) + (isCorrect ? 1 : 0),
        wrong: (prev[player.id]?.wrong || 0) + (isCorrect ? 0 : 1)
      }
    }));

    const updatedPlayers = [...players];
    updatedPlayers[currentPlayer] = { ...player, position: newPosition };

    setFeedback({
      correct: isCorrect,
      answer: currentQuestion.answer ? 'Σωστό' : 'Λάθος',
      explanation: currentQuestion.explanation,
      delta
    });

    addLog(
      isCorrect
        ? `✅ ${player.name} απάντησε σωστά (+3 → ${newPosition + 1})`
        : `❌ ${player.name} απάντησε λάθος (-2 → ${newPosition + 1})`
    );

    setTimeout(() => {
      setPlayers(updatedPlayers);

      setTimeout(() => {
        if (newPosition >= BOARD_SIZE - 1) {
          handleWin({ ...player, position: newPosition });
        } else {
          const nextPlayer = (currentPlayer + 1) % players.length;
          setCurrentPlayer(nextPlayer);
          setGameState('playing');
          setCurrentQuestion(null);
          setFeedback(null);
          setDiceValue(null);
          setCanRoll(true);
          addLog(`➡️ Σειρά του ${updatedPlayers[nextPlayer].name}`);
        }
      }, 2800);
    }, 200);
  };

  const handleWin = (winningPlayer) => {
    setWinner(winningPlayer);
    setGameState('finished');
    addLog(`🏆 Ο ${winningPlayer.name} κέρδισε!`);

    // Save session to backend
    const duration = Math.floor((Date.now() - gameStartTime) / 1000);
    api.saveSession({
      players: players.map(p => ({
        name: p.name,
        finalPosition: p.id === winningPlayer.id ? winningPlayer.position : p.position,
        correctAnswers: stats[p.id]?.correct || 0,
        wrongAnswers: stats[p.id]?.wrong || 0
      })),
      winner: winningPlayer.name,
      totalRounds: log.filter(l => l.msg.includes('έριξε')).length,
      durationSeconds: duration,
      completed: true
    });
  };

  const resetGame = () => {
    setGameState('setup');
    setPlayers([]);
    setCurrentPlayer(0);
    setDiceValue(null);
    setCurrentQuestion(null);
    setFeedback(null);
    setWinner(null);
    setUsedQuestionIds([]);
    setLog([]);
    setCanRoll(true);
    setApiError(null);
  };

  const renderBoard = () => {
    const rows = [];
    for (let row = 0; row < 5; row++) {
      const cells = [];
      for (let col = 0; col < 6; col++) {
        const idx = row % 2 === 0 ? row * 6 + col : row * 6 + (5 - col);
        const playersOnCell = players.filter(p => p.position === idx);
        const isStart = idx === 0;
        const isEnd = idx === BOARD_SIZE - 1;

        cells.push(
          <div
            key={idx}
            className={`relative aspect-square rounded-lg border-2 flex items-center justify-center transition-all ${
              isStart ? 'bg-emerald-100 border-emerald-400' :
              isEnd ? 'bg-amber-100 border-amber-400' :
              'bg-slate-50 border-slate-200'
            }`}
          >
            <span className="absolute top-1 left-1.5 text-[10px] font-semibold text-slate-400">
              {idx + 1}
            </span>
            {isStart && <span className="text-xs font-bold text-emerald-700">START</span>}
            {isEnd && <span className="text-xs font-bold text-amber-700">🏁</span>}
            {playersOnCell.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center flex-wrap gap-0.5 p-1">
                {playersOnCell.map((p) => (
                  <div
                    key={p.id}
                    className={`w-5 h-5 rounded-full border-2 border-white shadow-md transform transition-all ${
                      currentPlayer === p.id && gameState !== 'finished' ? 'scale-125 ring-2 ring-offset-1 ' + p.color.ring : ''
                    }`}
                    style={{ backgroundColor: p.color.bg }}
                    title={p.name}
                  />
                ))}
              </div>
            )}
          </div>
        );
      }
      rows.push(<div key={row} className="grid grid-cols-6 gap-1.5">{cells}</div>);
    }
    return <div className="space-y-1.5">{rows}</div>;
  };

  // Setup screen
  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
        <div className="max-w-2xl mx-auto py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              🎲 Programming Quest 🎲
            </h1>
            <p className="text-slate-600">Επιτραπέζιο παιχνίδι με ερωτήσεις από MongoDB</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Ρυθμίσεις παιχνιδιού</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Αριθμός παικτών
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[2, 3, 4].map(n => (
                  <button
                    key={n}
                    onClick={() => setNumPlayers(n)}
                    className={`py-3 rounded-lg font-semibold transition-all ${
                      numPlayers === n
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {n} παίκτες
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6 space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Ονόματα παικτών
              </label>
              {Array.from({ length: numPlayers }, (_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: PLAYER_COLORS[i].bg }}
                  />
                  <input
                    type="text"
                    value={playerNames[i]}
                    onChange={(e) => {
                      const newNames = [...playerNames];
                      newNames[i] = e.target.value;
                      setPlayerNames(newNames);
                    }}
                    placeholder={`Παίκτης ${i + 1}`}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Κατηγορία (προαιρετικό)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">Όλες</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c._id} ({c.count})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Δυσκολία (προαιρετικό)
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">Όλες</option>
                  <option value="easy">Εύκολο</option>
                  <option value="medium">Μεσαίο</option>
                  <option value="hard">Δύσκολο</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 mb-6 text-sm text-slate-600">
              <p className="mb-2">📋 <strong>Κανόνες:</strong></p>
              <ul className="space-y-1 ml-5 list-disc text-xs">
                <li>Ρίξε το ζάρι και μετακινήσου ανάλογα</li>
                <li>Απάντησε σε ερώτηση Programming (True/False)</li>
                <li>Σωστή: +3 τετράγωνα ✅ / Λάθος: -2 τετράγωνα ❌</li>
                <li>Νικητής όποιος φτάσει πρώτος στο τετράγωνο 30 🏆</li>
              </ul>
              <p className="mt-2 text-xs text-slate-500">
                🔌 API: <code className="bg-slate-200 px-1 rounded">{API_URL}</code>
              </p>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
            >
              Ξεκίνα το παιχνίδι 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Finished screen
  if (gameState === 'finished' && winner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border-2 border-amber-200">
          <div className="text-7xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Νικητής!</h1>
          <div
            className="inline-block w-16 h-16 rounded-full border-4 border-white shadow-lg my-4"
            style={{ backgroundColor: winner.color.bg }}
          />
          <p className="text-2xl font-bold text-slate-800 mb-1">{winner.name}</p>
          <p className="text-slate-600 mb-6">έφτασε πρώτος στον στόχο!</p>

          {/* Player stats */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
            <div className="text-xs font-bold text-slate-500 uppercase mb-2">Στατιστικά</div>
            {players.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm py-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color.bg }} />
                  <span className="text-slate-700">{p.name}</span>
                </div>
                <span className="text-slate-500">
                  ✅ {stats[p.id]?.correct || 0} / ❌ {stats[p.id]?.wrong || 0}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={resetGame}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Νέο παιχνίδι 🔄
          </button>
        </div>
      </div>
    );
  }

  const activePlayer = players[currentPlayer];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-800">🎲 Programming Quest</h1>
          <button
            onClick={resetGame}
            className="px-4 py-2 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
          >
            Reset
          </button>
        </div>

        {apiError && (
          <div className="bg-rose-50 border border-rose-300 text-rose-700 px-4 py-3 rounded-lg mb-4 text-sm">
            ⚠️ {apiError}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-4 border border-slate-200">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-slate-700">Διαδρομή (30 τετράγωνα)</h2>
              <div className="text-xs text-slate-500">Snake path ↩</div>
            </div>
            {renderBoard()}

            <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-2">
              {players.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    currentPlayer === p.id ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'bg-slate-50'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: p.color.bg }}
                  />
                  <span className="text-sm font-medium text-slate-700 flex-1 truncate">{p.name}</span>
                  <span className="text-xs font-bold text-slate-500">{p.position + 1}/30</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {gameState === 'playing' && (
              <div className="bg-white rounded-2xl shadow-lg p-5 border border-slate-200">
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Σειρά</div>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: activePlayer.color.bg }}
                  />
                  <div>
                    <div className="font-bold text-slate-800">{activePlayer.name}</div>
                    <div className="text-xs text-slate-500">Θέση {activePlayer.position + 1}</div>
                  </div>
                </div>

                <div className="flex flex-col items-center py-4">
                  <Dice value={diceValue} rolling={isRolling} />
                  <button
                    onClick={rollDice}
                    disabled={!canRoll || isRolling}
                    className={`mt-4 px-6 py-3 rounded-xl font-bold text-white transition-all ${
                      canRoll && !isRolling
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md hover:shadow-lg hover:scale-105'
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    {isRolling ? 'Ρίχνει...' : 'Ρίξε το ζάρι 🎲'}
                  </button>
                </div>
              </div>
            )}

            {gameState === 'question' && (
              <div className="bg-white rounded-2xl shadow-lg p-5 border border-slate-200">
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                  Ερώτηση Programming
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
                    style={{ backgroundColor: activePlayer.color.bg }}
                  >
                    {activePlayer.name}
                  </div>
                  {currentQuestion && (
                    <>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {currentQuestion.category}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded capitalize">
                        {currentQuestion.difficulty}
                      </span>
                    </>
                  )}
                </div>

                {loadingQuestion ? (
                  <div className="text-center py-8 text-slate-500">
                    <div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
                    <div className="text-sm">Φόρτωση από MongoDB...</div>
                  </div>
                ) : currentQuestion ? (
                  <>
                    <p className="text-slate-800 font-medium mb-5 leading-relaxed">
                      {currentQuestion.question}
                    </p>

                    {!feedback ? (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => answerQuestion(true)}
                          className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow transition-all hover:scale-105"
                        >
                          ✓ Σωστό
                        </button>
                        <button
                          onClick={() => answerQuestion(false)}
                          className="py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow transition-all hover:scale-105"
                        >
                          ✗ Λάθος
                        </button>
                      </div>
                    ) : (
                      <div className={`rounded-xl p-4 ${
                        feedback.correct ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'
                      }`}>
                        <div className={`font-bold mb-2 ${feedback.correct ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {feedback.correct ? '✅ Σωστή απάντηση! (+3)' : `❌ Λάθος! Σωστή απάντηση: ${feedback.answer} (-2)`}
                        </div>
                        <div className="text-sm text-slate-600">{feedback.explanation}</div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg p-4 border border-slate-200">
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-2 font-semibold">
                Ιστορικό
              </div>
              <div ref={logRef} className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
                {log.map((entry, i) => (
                  <div key={i} className="text-xs text-slate-600 leading-relaxed">
                    {entry.msg}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dice({ value, rolling }) {
  const dots = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [0, 2], [2, 0], [2, 2]],
    5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]]
  };

  if (!value) {
    return (
      <div className="w-20 h-20 bg-white rounded-2xl border-2 border-slate-300 shadow-md flex items-center justify-center text-3xl text-slate-300">
        ?
      </div>
    );
  }

  return (
    <div className={`w-20 h-20 bg-white rounded-2xl border-2 border-slate-400 shadow-lg grid grid-cols-3 grid-rows-3 p-2 gap-1 ${rolling ? 'animate-spin' : ''}`}>
      {Array.from({ length: 9 }, (_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const hasDot = dots[value]?.some(([r, c]) => r === row && c === col);
        return (
          <div key={i} className="flex items-center justify-center">
            {hasDot && <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />}
          </div>
        );
      })}
    </div>
  );
}
