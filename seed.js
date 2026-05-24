import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Question from '../models/Question.js';

dotenv.config();

const QUESTIONS = [
  { question: "Η JavaScript είναι statically typed γλώσσα.", answer: false, explanation: "Η JavaScript είναι dynamically typed.", category: "JavaScript", difficulty: "easy" },
  { question: "Το 'let' στην JavaScript έχει block scope.", answer: true, explanation: "Σωστά, σε αντίθεση με το 'var' που έχει function scope.", category: "JavaScript", difficulty: "easy" },
  { question: "Η Python χρησιμοποιεί indentation για να ορίσει code blocks.", answer: true, explanation: "Σωστά, αντί για braces {}.", category: "Python", difficulty: "easy" },
  { question: "Το 'null' και το 'undefined' είναι ίδια στη JavaScript.", answer: false, explanation: "null === undefined είναι false. Είναι διαφορετικοί τύποι.", category: "JavaScript", difficulty: "medium" },
  { question: "Σε C++, το ++i είναι πιο γρήγορο από το i++.", answer: true, explanation: "Το post-increment δημιουργεί προσωρινό αντίγραφο.", category: "C++", difficulty: "medium" },
  { question: "Η HTML είναι γλώσσα προγραμματισμού.", answer: false, explanation: "Η HTML είναι markup language, όχι programming language.", category: "HTML", difficulty: "easy" },
  { question: "Το React χρησιμοποιεί Virtual DOM.", answer: true, explanation: "Για βελτιστοποίηση των renders.", category: "React", difficulty: "easy" },
  { question: "Σε SQL, το 'WHERE' εκτελείται μετά το 'GROUP BY'.", answer: false, explanation: "Το WHERE εκτελείται πριν το GROUP BY. Το HAVING εκτελείται μετά.", category: "SQL", difficulty: "hard" },
  { question: "Σε Java, όλα τα αντικείμενα κληρονομούν από την κλάση Object.", answer: true, explanation: "Η Object είναι η root class στη Java.", category: "Java", difficulty: "easy" },
  { question: "Το Big O (n²) είναι καλύτερο από O(n log n).", answer: false, explanation: "Το O(n log n) είναι πιο αποδοτικό από O(n²).", category: "Algorithms", difficulty: "medium" },
  { question: "Το useEffect στο React τρέχει πριν το render.", answer: false, explanation: "Τρέχει μετά το render, εκτός αν χρησιμοποιήσεις useLayoutEffect.", category: "React", difficulty: "medium" },
  { question: "Η MongoDB είναι relational database.", answer: false, explanation: "Η MongoDB είναι NoSQL document database.", category: "MongoDB", difficulty: "easy" },
  { question: "Το Git 'merge' δημιουργεί νέο commit.", answer: true, explanation: "Δημιουργείται merge commit (εκτός fast-forward).", category: "Git", difficulty: "medium" },
  { question: "Η εντολή 'console.log' είναι μέρος του ECMAScript standard.", answer: false, explanation: "Είναι μέρος του Web API/Node.js, όχι του ECMAScript.", category: "JavaScript", difficulty: "hard" },
  { question: "Σε CSS, το 'flexbox' είναι one-dimensional layout.", answer: true, explanation: "Σωστά. Το 'grid' είναι two-dimensional.", category: "CSS", difficulty: "medium" },
  { question: "Το TypeScript compile-άρεται σε JavaScript.", answer: true, explanation: "Σωστά, το TS είναι superset της JS.", category: "JavaScript", difficulty: "easy" },
  { question: "Το REST API χρησιμοποιεί υποχρεωτικά JSON.", answer: false, explanation: "Το REST μπορεί να χρησιμοποιεί XML, HTML, plain text κλπ.", category: "Web", difficulty: "medium" },
  { question: "Σε Python, οι λίστες είναι immutable.", answer: false, explanation: "Οι λίστες είναι mutable. Τα tuples είναι immutable.", category: "Python", difficulty: "easy" },
  { question: "Το 'async/await' στη JavaScript βασίζεται στα Promises.", answer: true, explanation: "Σωστά, είναι syntactic sugar πάνω από Promises.", category: "JavaScript", difficulty: "medium" },
  { question: "Σε CSS, το margin είναι μέσα από το border.", answer: false, explanation: "Το margin είναι έξω από το border. Το padding είναι μέσα.", category: "CSS", difficulty: "easy" },
  { question: "Η Tail Recursion μπορεί να βελτιστοποιηθεί ώστε να μην αυξάνει το stack.", answer: true, explanation: "Σε γλώσσες που υποστηρίζουν tail call optimization.", category: "Algorithms", difficulty: "hard" },
  { question: "Σε React, το state πρέπει να αλλάζει direct με mutation.", answer: false, explanation: "Πρέπει να χρησιμοποιείς setState ή το setter του useState.", category: "React", difficulty: "easy" },
  { question: "Το HTTP είναι stateful protocol.", answer: false, explanation: "Το HTTP είναι stateless. Sessions διατηρούνται με cookies/tokens.", category: "Web", difficulty: "medium" },
  { question: "Σε binary search, το array πρέπει να είναι sorted.", answer: true, explanation: "Απαραίτητη προϋπόθεση για binary search.", category: "Algorithms", difficulty: "easy" },
  { question: "Η εντολή 'git push' στέλνει τα commits στον remote.", answer: true, explanation: "Σωστά, push = upload local commits στο remote repo.", category: "Git", difficulty: "easy" },
  { question: "Το NoSQL σημαίνει 'No SQL allowed'.", answer: false, explanation: "NoSQL = 'Not Only SQL'.", category: "MongoDB", difficulty: "medium" },
  { question: "Σε Python, το == συγκρίνει τιμές ενώ το 'is' συγκρίνει identity.", answer: true, explanation: "Το 'is' ελέγχει αν είναι το ίδιο object στη μνήμη.", category: "Python", difficulty: "medium" },
  { question: "Το CSS Grid αντικαθιστά πλήρως το Flexbox.", answer: false, explanation: "Είναι συμπληρωματικά εργαλεία για διαφορετικές περιπτώσεις.", category: "CSS", difficulty: "medium" },
  { question: "Σε JavaScript, το NaN === NaN επιστρέφει true.", answer: false, explanation: "Το NaN δεν είναι ίσο με τίποτα, ούτε με τον εαυτό του.", category: "JavaScript", difficulty: "hard" },
  { question: "Το localStorage διατηρείται μετά το κλείσιμο του browser.", answer: true, explanation: "Σε αντίθεση με το sessionStorage.", category: "Web", difficulty: "easy" }
];

const seedDatabase = async () => {
  try {
    await connectDB();

    const shouldReset = process.argv.includes('--reset');

    if (shouldReset) {
      console.log('🗑️  Διαγραφή υπάρχοντων ερωτήσεων...');
      await Question.deleteMany({});
    }

    const existingCount = await Question.countDocuments();
    if (existingCount > 0 && !shouldReset) {
      console.log(`Υπάρχουν ήδη ${existingCount} ερωτήσεις. Τρέξε με --reset για να τις αντικαταστήσεις.`);
      process.exit(0);
    }

    console.log(`Εισαγωγή ${QUESTIONS.length} ερωτήσεων...`);
    const inserted = await Question.insertMany(QUESTIONS);
    console.log(`Εισήχθησαν ${inserted.length} ερωτήσεις επιτυχώς`);

    // Στατιστικά ανά κατηγορία
    const byCategory = await Question.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\nΚατανομή ανά κατηγορία:');
    byCategory.forEach(c => console.log(`   ${c._id}: ${c.count}`));

    await mongoose.disconnect();
    console.log('\nDisconnected. Done!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
