# Programming Quest — Backend API

Express + Mongoose REST API για το επιτραπέζιο παιχνίδι Programming Quest.

## Stack

- **Node.js** + **Express 4** (ES Modules)
- **MongoDB** + **Mongoose 8**
- **CORS**, **Helmet**, **express-rate-limit** για security

## Setup

### 1. Εγκατάσταση dependencies

```bash
cd backend
npm install
```

### 2. MongoDB

Πρέπει να τρέχει instance του MongoDB. Επιλογές:

**Local** (απαιτείται εγκατεστημένο MongoDB):
```bash
mongod
```

**Docker** (πιο εύκολο):
```bash
docker run -d --name mongo-quest -p 27017:27017 mongo:7
```

**MongoDB Atlas** (cloud, δωρεάν tier): δημιούργησε cluster στο cloud.mongodb.com και πάρε το connection string.

### 3. Environment variables

```bash
cp .env.example .env
```

Άνοιξε το `.env` και βάλε το δικό σου `MONGODB_URI` αν χρησιμοποιείς Atlas.

### 4. Seed τη βάση

```bash
npm run seed
```

Για να ξαναγεμίσεις από το μηδέν (διαγράφει υπάρχοντα):
```bash
npm run seed:reset
```

### 5. Τρέξε τον server

Development (auto-reload):
```bash
npm run dev
```

Production:
```bash
npm start
```

Server τρέχει στο `http://localhost:5000`.

## API Endpoints

### Questions

| Method | Endpoint | Περιγραφή |
|--------|----------|-----------|
| GET | `/api/questions/random` | Τυχαία ερώτηση. Query params: `category`, `difficulty`, `exclude` (comma-separated IDs) |
| GET | `/api/questions` | Όλες οι ερωτήσεις με pagination. Query: `page`, `limit`, `category`, `difficulty` |
| GET | `/api/questions/categories` | Λίστα κατηγοριών με count |
| GET | `/api/questions/:id` | Συγκεκριμένη ερώτηση |
| POST | `/api/questions` | Δημιουργία νέας ερώτησης |
| POST | `/api/questions/:id/record` | Καταγραφή στατιστικού (body: `{ correct: true/false }`) |
| PUT | `/api/questions/:id` | Update |
| DELETE | `/api/questions/:id` | Διαγραφή |

### Game Sessions

| Method | Endpoint | Περιγραφή |
|--------|----------|-----------|
| POST | `/api/sessions` | Αποθήκευση ολοκληρωμένου παιχνιδιού |
| GET | `/api/sessions/stats` | Συνολικά στατιστικά |
| GET | `/api/sessions` | Recent sessions |

## Παραδείγματα

### Πάρε τυχαία ερώτηση

```bash
curl http://localhost:5000/api/questions/random
```

### Πάρε τυχαία JavaScript easy ερώτηση

```bash
curl "http://localhost:5000/api/questions/random?category=JavaScript&difficulty=easy"
```

### Απάντηση format

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "question": "Η JavaScript είναι statically typed γλώσσα.",
    "answer": false,
    "explanation": "Η JavaScript είναι dynamically typed.",
    "category": "JavaScript",
    "difficulty": "easy",
    "timesAsked": 0,
    "timesCorrect": 0
  }
}
```

## Σύνδεση με το Frontend

Στο frontend (React) αντικατέστησε το `QUESTIONS_DB` array με fetch:

```javascript
const fetchRandomQuestion = async (excludeIds = []) => {
  const params = new URLSearchParams();
  if (excludeIds.length) params.set('exclude', excludeIds.join(','));
  const res = await fetch(`http://localhost:5000/api/questions/random?${params}`);
  const json = await res.json();
  return json.data;
};

const recordAnswer = async (questionId, correct) => {
  await fetch(`http://localhost:5000/api/questions/${questionId}/record`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correct })
  });
};
```

## Δομή φακέλων

```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── models/
│   ├── Question.js        # Question schema
│   └── GameSession.js     # GameSession schema
├── routes/
│   ├── questions.js       # Questions endpoints
│   └── sessions.js        # Sessions endpoints
├── scripts/
│   └── seed.js            # Seed script
├── .env.example
├── package.json
└── server.js              # Entry point
```
