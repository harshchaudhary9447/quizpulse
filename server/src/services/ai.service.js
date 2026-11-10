const { ENABLE_AI_QUESTION_STUB } = require('../config');

// Realistic intelligent templates for simulated AI Question generation
const AI_QUESTION_TEMPLATES = {
  javascript: [
    {
      text: 'What will `console.log(1 + "2" + "2")` output in JavaScript?',
      explanation: 'Due to string concatenation precedence, 1 + "2" becomes "12", and "12" + "2" becomes "122".',
      type: 'SINGLE_CHOICE',
      difficulty: 'MEDIUM',
      category: 'Web Development',
      tags: ['JavaScript', 'Type Coercion'],
      options: [
        { text: '"122"', isCorrect: true, order: 0 },
        { text: '"14"', isCorrect: false, order: 1 },
        { text: '5', isCorrect: false, order: 2 },
        { text: 'NaN', isCorrect: false, order: 3 },
      ],
    },
    {
      text: 'Which array methods mutate the original array in JavaScript?',
      explanation: 'push, splice, and sort mutate the array in-place, whereas map and filter return a new array.',
      type: 'MULTI_SELECT',
      difficulty: 'MEDIUM',
      category: 'Web Development',
      tags: ['JavaScript', 'Arrays'],
      options: [
        { text: 'Array.prototype.splice()', isCorrect: true, order: 0 },
        { text: 'Array.prototype.push()', isCorrect: true, order: 1 },
        { text: 'Array.prototype.map()', isCorrect: false, order: 2 },
        { text: 'Array.prototype.slice()', isCorrect: false, order: 3 },
      ],
    },
  ],
  python: [
    {
      text: 'In Python, lists are mutable while tuples are immutable.',
      explanation: 'Tuples cannot be altered once instantiated, while lists support in-place mutation.',
      type: 'TRUE_FALSE',
      difficulty: 'EASY',
      category: 'Computer Science',
      tags: ['Python', 'Data Structures'],
      options: [
        { text: 'True', isCorrect: true, order: 0 },
        { text: 'False', isCorrect: false, order: 1 },
      ],
    },
    {
      text: 'What keyword is used to define an anonymous inline function in Python?',
      explanation: 'The `lambda` keyword creates anonymous functions.',
      type: 'SHORT_ANSWER',
      difficulty: 'EASY',
      category: 'Computer Science',
      tags: ['Python', 'Functions'],
      options: [
        { text: 'lambda', isCorrect: true, order: 0 },
      ],
    },
  ],
  general: [
    {
      text: 'Which data structure follows the LIFO (Last-In-First-Out) principle?',
      explanation: 'A Stack strictly adheres to LIFO semantics.',
      type: 'SINGLE_CHOICE',
      difficulty: 'EASY',
      category: 'Computer Science',
      tags: ['Data Structures', 'Stack'],
      options: [
        { text: 'Stack', isCorrect: true, order: 0 },
        { text: 'Queue', isCorrect: false, order: 1 },
        { text: 'Linked List', isCorrect: false, order: 2 },
        { text: 'Heap', isCorrect: false, order: 3 },
      ],
    },
  ],
};

async function generateQuestions({ topic, difficulty = 'MEDIUM', count = 2 }) {
  if (!ENABLE_AI_QUESTION_STUB) {
    const error = new Error('AI Question Generation is currently disabled by administrator configuration');
    error.statusCode = 403;
    error.code = 'AI_FEATURE_DISABLED';
    throw error;
  }

  // Simulate network/AI processing delay for realistic UX
  await new Promise((resolve) => setTimeout(resolve, 800));

  const lowerTopic = topic.toLowerCase();
  let pool = AI_QUESTION_TEMPLATES.general;

  if (lowerTopic.includes('java') || lowerTopic.includes('js') || lowerTopic.includes('react') || lowerTopic.includes('web')) {
    pool = [...AI_QUESTION_TEMPLATES.javascript, ...AI_QUESTION_TEMPLATES.general];
  } else if (lowerTopic.includes('py') || lowerTopic.includes('data') || lowerTopic.includes('ml')) {
    pool = [...AI_QUESTION_TEMPLATES.python, ...AI_QUESTION_TEMPLATES.general];
  }

  // Dynamic customization
  const generated = [];
  for (let i = 0; i < Math.min(count, 5); i++) {
    const base = pool[i % pool.length];
    generated.push({
      text: base.text.replace(/^\[AI Generated\]\s*/i, '').trim(),
      explanation: base.explanation,
      type: base.type,
      difficulty,
      category: topic.charAt(0).toUpperCase() + topic.slice(1),
      tags: base.tags.filter((t) => t.toLowerCase() !== 'ai generated'),
      options: base.options,
    });
  }

  return generated;
}

module.exports = {
  generateQuestions,
};
