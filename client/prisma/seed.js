const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting QuizPulse Database Seeding...');

  // 1. Clean existing data in reverse relation order
  await prisma.proctorEvent.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.livePlayer.deleteMany();
  await prisma.liveSession.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.option.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database records.');

  // 2. Hash default passwords
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const teacherPassword = await bcrypt.hash('Teacher123!', 10);
  const studentPassword = await bcrypt.hash('Student123!', 10);

  // 3. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@quizpulse.com',
      passwordHash: adminPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const teacher1 = await prisma.user.create({
    data: {
      email: 'teacher1@quizpulse.com',
      passwordHash: teacherPassword,
      name: 'Dr. Sarah Connor',
      role: 'TEACHER',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      email: 'teacher2@quizpulse.com',
      passwordHash: teacherPassword,
      name: 'Prof. Alan Turing',
      role: 'TEACHER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const students = [];
  const studentData = [
    { email: 'student1@quizpulse.com', name: 'Alex Rivera' },
    { email: 'student2@quizpulse.com', name: 'Maya Patel' },
    { email: 'student3@quizpulse.com', name: 'Liam Chen' },
    { email: 'student4@quizpulse.com', name: 'Emma Watson' },
    { email: 'student5@quizpulse.com', name: 'Lucas Vance' },
  ];

  for (const s of studentData) {
    const created = await prisma.user.create({
      data: {
        email: s.email,
        passwordHash: studentPassword,
        name: s.name,
        role: 'STUDENT',
      },
    });
    students.push(created);
  }

  console.log(`👤 Created 1 Admin, 2 Teachers, and ${students.length} Students.`);

  // 4. Create 30 Questions across Web Dev, Computer Science, Science & Tech, Logic
  const rawQuestions = [
    // Web Dev - 10 Questions
    {
      text: 'Which HTML5 element is used to specify a header for a document or section?',
      explanation: 'The <header> element represents introductory content, typically a group of introductory or navigational aids.',
      type: 'SINGLE_CHOICE',
      difficulty: 'EASY',
      category: 'Web Development',
      tags: JSON.stringify(['HTML5', 'Frontend']),
      createdById: teacher1.id,
      options: [
        { text: '<header>', isCorrect: true, order: 0 },
        { text: '<top>', isCorrect: false, order: 1 },
        { text: '<section>', isCorrect: false, order: 2 },
        { text: '<head>', isCorrect: false, order: 3 },
      ],
    },
    {
      text: 'Which of the following are valid React Hooks introduced in React 16.8+?',
      explanation: 'useState, useEffect, and useContext are standard React hooks. useFetch is a common custom hook name, not a built-in one.',
      type: 'MULTI_SELECT',
      difficulty: 'MEDIUM',
      category: 'Web Development',
      tags: JSON.stringify(['React', 'Frontend', 'Hooks']),
      createdById: teacher1.id,
      options: [
        { text: 'useState', isCorrect: true, order: 0 },
        { text: 'useEffect', isCorrect: true, order: 1 },
        { text: 'useContext', isCorrect: true, order: 2 },
        { text: 'useLifecycle', isCorrect: false, order: 3 },
      ],
    },
    {
      text: 'In JavaScript, typeof null returns "object".',
      explanation: 'This is a well-known historical bug in JavaScript from its first implementation in 1995 that is retained for backwards compatibility.',
      type: 'TRUE_FALSE',
      difficulty: 'EASY',
      category: 'Web Development',
      tags: JSON.stringify(['JavaScript', 'Basics']),
      createdById: teacher1.id,
      options: [
        { text: 'True', isCorrect: true, order: 0 },
        { text: 'False', isCorrect: false, order: 1 },
      ],
    },
    {
      text: 'What HTTP status code is used to indicate that a requested resource was not found?',
      explanation: 'HTTP 404 Not Found indicates that the origin server did not find a current representation for the target resource.',
      type: 'SHORT_ANSWER',
      difficulty: 'EASY',
      category: 'Web Development',
      tags: JSON.stringify(['HTTP', 'Backend', 'REST']),
      createdById: teacher1.id,
      options: [
        { text: '404', isCorrect: true, order: 0 },
      ],
    },
    {
      text: 'Which CSS property is used to create a flexbox container?',
      explanation: 'display: flex defines a flex container and inlines its children into a flex context.',
      type: 'SINGLE_CHOICE',
      difficulty: 'EASY',
      category: 'Web Development',
      tags: JSON.stringify(['CSS', 'Flexbox']),
      createdById: teacher1.id,
      options: [
        { text: 'display: flex', isCorrect: true, order: 0 },
        { text: 'flex-direction: row', isCorrect: false, order: 1 },
        { text: 'box-type: flex', isCorrect: false, order: 2 },
        { text: 'align-items: center', isCorrect: false, order: 3 },
      ],
    },
    {
      text: 'Which HTTP methods are typically considered idempotent in REST API design?',
      explanation: 'GET, PUT, and DELETE are idempotent because executing them multiple times produces the same server state as executing them once. POST is generally not idempotent.',
      type: 'MULTI_SELECT',
      difficulty: 'MEDIUM',
      category: 'Web Development',
      tags: JSON.stringify(['HTTP', 'REST', 'Architecture']),
      createdById: teacher1.id,
      options: [
        { text: 'GET', isCorrect: true, order: 0 },
        { text: 'PUT', isCorrect: true, order: 1 },
        { text: 'DELETE', isCorrect: true, order: 2 },
        { text: 'POST', isCorrect: false, order: 3 },
      ],
    },
    {
      text: 'JavaScript Promise.all() rejects immediately if any of the input promises reject.',
      explanation: 'Promise.all rejects with the reason of the first promise that rejects. Promise.allSettled waits for all promises to settle regardless of rejection.',
      type: 'TRUE_FALSE',
      difficulty: 'MEDIUM',
      category: 'Web Development',
      tags: JSON.stringify(['JavaScript', 'Async']),
      createdById: teacher1.id,
      options: [
        { text: 'True', isCorrect: true, order: 0 },
        { text: 'False', isCorrect: false, order: 1 },
      ],
    },
    {
      text: 'What package manager command flag is used to install a package strictly as a development dependency?',
      explanation: 'The flag is --save-dev or -D.',
      type: 'SHORT_ANSWER',
      difficulty: 'EASY',
      category: 'Web Development',
      tags: JSON.stringify(['NodeJS', 'NPM']),
      createdById: teacher1.id,
      options: [
        { text: '--save-dev', isCorrect: true, order: 0 },
        { text: '-D', isCorrect: true, order: 1 },
      ],
    },
    {
      text: 'What is the purpose of the key prop when rendering lists in React?',
      explanation: 'The key prop gives elements a stable identity across renders so React can efficiently identify which items have changed, been added, or removed in the reconciliation process.',
      type: 'SINGLE_CHOICE',
      difficulty: 'MEDIUM',
      category: 'Web Development',
      tags: JSON.stringify(['React', 'VirtualDOM']),
      createdById: teacher1.id,
      options: [
        { text: 'Helps React identify which items have changed, added, or removed for efficient diffing', isCorrect: true, order: 0 },
        { text: 'Styles each item with unique CSS properties', isCorrect: false, order: 1 },
        { text: 'Encrypts the component props in the browser DOM', isCorrect: false, order: 2 },
        { text: 'Automatically sorts the list items alphabetically', isCorrect: false, order: 3 },
      ],
    },
    {
      text: 'Which web security headers protect against cross-site scripting (XSS) and clickjacking?',
      explanation: 'Content-Security-Policy helps prevent XSS and data injection; X-Frame-Options prevents clickjacking by controlling if the page can be embedded in an iframe.',
      type: 'MULTI_SELECT',
      difficulty: 'HARD',
      category: 'Web Development',
      tags: JSON.stringify(['Security', 'HTTP', 'Headers']),
      createdById: teacher1.id,
      options: [
        { text: 'Content-Security-Policy', isCorrect: true, order: 0 },
        { text: 'X-Frame-Options', isCorrect: true, order: 1 },
        { text: 'Access-Control-Allow-Origin', isCorrect: false, order: 2 },
        { text: 'Strict-Transport-Security', isCorrect: false, order: 3 },
      ],
    },

    // Computer Science & Algorithms - 10 Questions
    {
      text: 'What is the average-case time complexity of QuickSort?',
      explanation: 'On average, QuickSort divides the array into two halves, yielding O(n log n). Worst-case with poor pivot selection is O(n^2).',
      type: 'SINGLE_CHOICE',
      difficulty: 'MEDIUM',
      category: 'Computer Science',
      tags: JSON.stringify(['Algorithms', 'Sorting', 'Complexity']),
      createdById: teacher2.id,
      options: [
        { text: 'O(n log n)', isCorrect: true, order: 0 },
        { text: 'O(n^2)', isCorrect: false, order: 1 },
        { text: 'O(log n)', isCorrect: false, order: 2 },
        { text: 'O(n)', isCorrect: false, order: 3 },
      ],
    },
    {
      text: 'Which data structures operate on a First-In-First-Out (FIFO) principle?',
      explanation: 'A Queue and a Circular Queue operate strictly on FIFO principles. Stacks use LIFO (Last-In-First-Out).',
      type: 'MULTI_SELECT',
      difficulty: 'EASY',
      category: 'Computer Science',
      tags: JSON.stringify(['Data Structures', 'Queues']),
      createdById: teacher2.id,
      options: [
        { text: 'Queue', isCorrect: true, order: 0 },
        { text: 'Circular Queue', isCorrect: true, order: 1 },
        { text: 'Stack', isCorrect: false, order: 2 },
        { text: 'Binary Search Tree', isCorrect: false, order: 3 },
      ],
    },
    {
      text: 'A binary tree with N nodes always has a height of log2(N).',
      explanation: 'False. A degenerate (skewed) binary tree can have a height of N, behaving identically to a linked list.',
      type: 'TRUE_FALSE',
      difficulty: 'MEDIUM',
      category: 'Computer Science',
      tags: JSON.stringify(['Data Structures', 'Trees']),
      createdById: teacher2.id,
      options: [
        { text: 'False', isCorrect: true, order: 0 },
        { text: 'True', isCorrect: false, order: 1 },
      ],
    },
    {
      text: 'What graph traversal algorithm uses a queue data structure?',
      explanation: 'Breadth-First Search (BFS) utilizes a queue to visit neighbors layer by layer.',
      type: 'SHORT_ANSWER',
      difficulty: 'MEDIUM',
      category: 'Computer Science',
      tags: JSON.stringify(['Graphs', 'Algorithms', 'BFS']),
      createdById: teacher2.id,
      options: [
        { text: 'Breadth-First Search', isCorrect: true, order: 0 },
        { text: 'BFS', isCorrect: true, order: 1 },
      ],
    },
    {
      text: 'Which OSI model layer is responsible for end-to-end communication, reliability, and flow control (e.g., TCP)?',
      explanation: 'The Transport Layer (Layer 4) handles reliable host-to-host communication, segmentation, and flow control via protocols like TCP.',
      type: 'SINGLE_CHOICE',
      difficulty: 'MEDIUM',
      category: 'Computer Science',
      tags: JSON.stringify(['Networking', 'OSI']),
      createdById: teacher2.id,
      options: [
        { text: 'Transport Layer (Layer 4)', isCorrect: true, order: 0 },
        { text: 'Network Layer (Layer 3)', isCorrect: false, order: 1 },
        { text: 'Data Link Layer (Layer 2)', isCorrect: false, order: 2 },
        { text: 'Session Layer (Layer 5)', isCorrect: false, order: 3 },
      ],
    },
    {
      text: 'Which of the following problems are known to be NP-Complete?',
      explanation: 'The Traveling Salesperson Problem (decision version) and Boolean Satisfiability (SAT) are classic NP-Complete problems. Sorting can be solved in O(n log n) (P).',
      type: 'MULTI_SELECT',
      difficulty: 'HARD',
      category: 'Computer Science',
      tags: JSON.stringify(['Complexity', 'NP-Complete']),
      createdById: teacher2.id,
      options: [
        { text: 'Boolean Satisfiability (3-SAT)', isCorrect: true, order: 0 },
        { text: 'Traveling Salesperson Problem (Decision version)', isCorrect: true, order: 1 },
        { text: 'Knapsack Problem (0/1)', isCorrect: true, order: 2 },
        { text: 'Binary Search', isCorrect: false, order: 3 },
      ],
    },
    {
      text: 'In relational databases, the B-Tree index lookup is typically O(log N).',
      explanation: 'True. B-Trees maintain sorted balanced keys, enabling search, insertions, and deletions in logarithmic time.',
      type: 'TRUE_FALSE',
      difficulty: 'EASY',
      category: 'Computer Science',
      tags: JSON.stringify(['Databases', 'Indexing', 'B-Tree']),
      createdById: teacher2.id,
      options: [
        { text: 'True', isCorrect: true, order: 0 },
        { text: 'False', isCorrect: false, order: 1 },
      ],
    },
    {
      text: 'What term describes a situation where two or more processes are unable to proceed because each is waiting for the other to release a resource?',
      explanation: 'Deadlock is a permanent blocking condition where each process holds resources and waits for resources held by others.',
      type: 'SHORT_ANSWER',
      difficulty: 'MEDIUM',
      category: 'Computer Science',
      tags: JSON.stringify(['Operating Systems', 'Concurrency']),
      createdById: teacher2.id,
      options: [
        { text: 'Deadlock', isCorrect: true, order: 0 },
        { text: 'deadlock', isCorrect: true, order: 1 },
      ],
    },
    {
      text: 'Which sorting algorithm has a guaranteed worst-case time complexity of O(n log n)?',
      explanation: 'MergeSort divides the list in half recursively and merges in linear time, guaranteeing O(n log n) even in the worst case.',
      type: 'SINGLE_CHOICE',
      difficulty: 'MEDIUM',
      category: 'Computer Science',
      tags: JSON.stringify(['Algorithms', 'Sorting']),
      createdById: teacher2.id,
      options: [
        { text: 'MergeSort', isCorrect: true, order: 0 },
        { text: 'QuickSort', isCorrect: false, order: 1 },
        { text: 'InsertionSort', isCorrect: false, order: 2 },
        { text: 'BubbleSort', isCorrect: false, order: 3 },
      ],
    },
    {
      text: 'Which hashing concepts help minimize collisions in open addressing hash tables?',
      explanation: 'Linear probing, quadratic probing, and double hashing are collision resolution strategies in open addressing.',
      type: 'MULTI_SELECT',
      difficulty: 'HARD',
      category: 'Computer Science',
      tags: JSON.stringify(['Data Structures', 'Hashing']),
      createdById: teacher2.id,
      options: [
        { text: 'Linear Probing', isCorrect: true, order: 0 },
        { text: 'Double Hashing', isCorrect: true, order: 1 },
        { text: 'Quadratic Probing', isCorrect: true, order: 2 },
        { text: 'Chaining with AVL Trees', isCorrect: false, order: 3 },
      ],
    },

    // Science & Technology - 10 Questions
    {
      text: 'What is the fundamental unit of quantum computing information called?',
      explanation: 'A qubit (quantum bit) is the basic unit of information in quantum computing, capable of existing in superposition.',
      type: 'SINGLE_CHOICE',
      difficulty: 'EASY',
      category: 'Science & Technology',
      tags: JSON.stringify(['Quantum', 'Hardware']),
      createdById: teacher1.id,
      options: [
        { text: 'Qubit', isCorrect: true, order: 0 },
        { text: 'Quantum Byte', isCorrect: false, order: 1 },
        { text: 'Q-Node', isCorrect: false, order: 2 },
        { text: 'Photonic Bit', isCorrect: false, order: 3 },
      ],
    },
    {
      text: 'Which neural network architectures are primarily used in modern Large Language Models (LLMs)?',
      explanation: 'Transformer architecture introduced in "Attention is All You Need" (2017) powers modern LLMs with self-attention mechanisms.',
      type: 'MULTI_SELECT',
      difficulty: 'MEDIUM',
      category: 'Science & Technology',
      tags: JSON.stringify(['AI', 'Machine Learning', 'Transformers']),
      createdById: teacher1.id,
      options: [
        { text: 'Transformer', isCorrect: true, order: 0 },
        { text: 'Self-Attention Network', isCorrect: true, order: 1 },
        { text: 'Linear Perceptron alone', isCorrect: false, order: 2 },
        { text: 'Markov Decision Process', isCorrect: false, order: 3 },
      ],
    },
    {
      text: 'Light travels faster in a vacuum than through any physical medium.',
      explanation: 'True. In a vacuum, light travels at approximately 299,792 km/s (c), which is the cosmic speed limit according to Einstein’s special relativity.',
      type: 'TRUE_FALSE',
      difficulty: 'EASY',
      category: 'Science & Technology',
      tags: JSON.stringify(['Physics', 'Space']),
      createdById: teacher1.id,
      options: [
        { text: 'True', isCorrect: true, order: 0 },
        { text: 'False', isCorrect: false, order: 1 },
      ],
    },
    {
      text: 'What is the name of the rover landed by NASA on Mars in February 2021?',
      explanation: 'NASA’s Perseverance rover landed in Jezero crater on Mars in February 2021 accompanied by the Ingenuity helicopter.',
      type: 'SHORT_ANSWER',
      difficulty: 'MEDIUM',
      category: 'Science & Technology',
      tags: JSON.stringify(['Space', 'NASA', 'Robotics']),
      createdById: teacher1.id,
      options: [
        { text: 'Perseverance', isCorrect: true, order: 0 },
        { text: 'perseverance', isCorrect: true, order: 1 },
      ],
    },
    {
      text: 'Who proposed the famous thought experiment known as the "Turing Test" to evaluate machine intelligence?',
      explanation: 'Alan Turing proposed the imitation game in his 1950 paper "Computing Machinery and Intelligence".',
      type: 'SINGLE_CHOICE',
      difficulty: 'EASY',
      category: 'Science & Technology',
      tags: JSON.stringify(['AI', 'History']),
      createdById: teacher2.id,
      options: [
        { text: 'Alan Turing', isCorrect: true, order: 0 },
        { text: 'John von Neumann', isCorrect: false, order: 1 },
        { text: 'Claude Shannon', isCorrect: false, order: 2 },
        { text: 'Marvin Minsky', isCorrect: false, order: 3 },
      ],
    },
    {
      text: 'Which renewable energy sources generate electricity without direct greenhouse gas emissions during operation?',
      explanation: 'Solar, wind, and geothermal power harness natural kinetic or thermal energy without combustion during generation.',
      type: 'MULTI_SELECT',
      difficulty: 'EASY',
      category: 'Science & Technology',
      tags: JSON.stringify(['Energy', 'Environment']),
      createdById: teacher2.id,
      options: [
        { text: 'Solar Photovoltaic', isCorrect: true, order: 0 },
        { text: 'Wind Turbines', isCorrect: true, order: 1 },
        { text: 'Geothermal', isCorrect: true, order: 2 },
        { text: 'Coal Thermal', isCorrect: false, order: 3 },
      ],
    },
    {
      text: 'Moore\'s Law is a physical law of nature established by Isaac Newton.',
      explanation: 'False. Moore’s Law is an empirical observation made by Gordon Moore in 1965 about the doubling of transistors on microchips roughly every two years.',
      type: 'TRUE_FALSE',
      difficulty: 'EASY',
      category: 'Science & Technology',
      tags: JSON.stringify(['Hardware', 'Semiconductors']),
      createdById: teacher2.id,
      options: [
        { text: 'False', isCorrect: true, order: 0 },
        { text: 'True', isCorrect: false, order: 1 },
      ],
    },
    {
      text: 'What gas makes up approximately 78% of Earth\'s atmosphere?',
      explanation: 'Nitrogen (N2) comprises approximately 78% of dry atmosphere by volume, followed by Oxygen at ~21%.',
      type: 'SHORT_ANSWER',
      difficulty: 'EASY',
      category: 'Science & Technology',
      tags: JSON.stringify(['Chemistry', 'Earth Science']),
      createdById: teacher1.id,
      options: [
        { text: 'Nitrogen', isCorrect: true, order: 0 },
        { text: 'nitrogen', isCorrect: true, order: 1 },
        { text: 'N2', isCorrect: true, order: 2 },
      ],
    },
    {
      text: 'Which discovery enabled the development of atomic energy and nuclear power?',
      explanation: 'Nuclear fission was discovered by Otto Hahn and Fritz Strassmann in 1938 and theoretically explained by Lise Meitner and Otto Frisch.',
      type: 'SINGLE_CHOICE',
      difficulty: 'HARD',
      category: 'Science & Technology',
      tags: JSON.stringify(['Physics', 'Nuclear']),
      createdById: teacher1.id,
      options: [
        { text: 'Nuclear Fission', isCorrect: true, order: 0 },
        { text: 'Cold Fusion', isCorrect: false, order: 1 },
        { text: 'Dark Matter Decay', isCorrect: false, order: 2 },
        { text: 'Thermonuclear Catalysis', isCorrect: false, order: 3 },
      ],
    },
    {
      text: 'Which protocols and standards form the backbone of the decentralized World Wide Web?',
      explanation: 'HTTP, DNS, and IP (along with TCP) enable decentralized routing and document hyperlinking across the globe.',
      type: 'MULTI_SELECT',
      difficulty: 'MEDIUM',
      category: 'Science & Technology',
      tags: JSON.stringify(['Internet', 'Networking']),
      createdById: teacher2.id,
      options: [
        { text: 'HTTP / HTTPS', isCorrect: true, order: 0 },
        { text: 'Domain Name System (DNS)', isCorrect: true, order: 1 },
        { text: 'Internet Protocol (IP)', isCorrect: true, order: 2 },
        { text: 'SNA Proprietary Protocol', isCorrect: false, order: 3 },
      ],
    },
  ];

  const createdQuestions = [];
  for (const q of rawQuestions) {
    const { options, ...qData } = q;
    const question = await prisma.question.create({
      data: {
        ...qData,
        options: {
          create: options,
        },
      },
    });
    createdQuestions.push(question);
  }

  console.log(`❓ Created ${createdQuestions.length} Questions with Options.`);

  // 5. Create 3 Quizzes
  // Quiz 1: Full-Stack Web Development Mastery (10 questions, 15 min, 70% pass, published)
  const webQuestions = createdQuestions.filter((q) => q.category === 'Web Development');
  const quiz1 = await prisma.quiz.create({
    data: {
      title: 'Full-Stack Web Development Essentials',
      description: 'Test your understanding of modern HTML5, React, Node.js, REST APIs, and web security principles.',
      timeLimitMinutes: 15,
      passPercentage: 70.0,
      shuffleQuestions: true,
      shuffleOptions: true,
      isPublished: true,
      maxAttempts: 3,
      createdById: teacher1.id,
      quizQuestions: {
        create: webQuestions.map((q, idx) => ({
          questionId: q.id,
          order: idx,
          points: 1.0,
        })),
      },
    },
  });

  // Quiz 2: Computer Science Fundamentals & Algorithms (10 questions, 20 min, 60% pass, published, access code "CS2026")
  const csQuestions = createdQuestions.filter((q) => q.category === 'Computer Science');
  const quiz2 = await prisma.quiz.create({
    data: {
      title: 'Computer Science Fundamentals & Algorithms',
      description: 'Comprehensive challenge covering sorting algorithms, Big-O complexities, data structures, and operating system concepts.',
      timeLimitMinutes: 20,
      passPercentage: 60.0,
      shuffleQuestions: false,
      shuffleOptions: false,
      isPublished: true,
      accessCode: 'CS2026',
      maxAttempts: 2,
      createdById: teacher2.id,
      quizQuestions: {
        create: csQuestions.map((q, idx) => ({
          questionId: q.id,
          order: idx,
          points: 1.0,
        })),
      },
    },
  });

  // Quiz 3: Science & Technology Rapid Trivia (10 questions, 10 min, 50% pass, draft/scheduled)
  const sciQuestions = createdQuestions.filter((q) => q.category === 'Science & Technology');
  const quiz3 = await prisma.quiz.create({
    data: {
      title: 'Science & Emerging Tech Rapid Trivia',
      description: 'Explore quantum computing, neural networks, space exploration missions, and iconic scientific discoveries.',
      timeLimitMinutes: 10,
      passPercentage: 50.0,
      shuffleQuestions: true,
      shuffleOptions: true,
      isPublished: false,
      maxAttempts: 1,
      createdById: teacher1.id,
      quizQuestions: {
        create: sciQuestions.map((q, idx) => ({
          questionId: q.id,
          order: idx,
          points: 1.0,
        })),
      },
    },
  });

  console.log(`📝 Created 3 Quizzes: "${quiz1.title}", "${quiz2.title}", "${quiz3.title}".`);

  // 6. Create some sample historical attempts for analytics demonstration
  // Student 1 took Quiz 1 and passed (score 8/10)
  const attempt1 = await prisma.attempt.create({
    data: {
      quizId: quiz1.id,
      studentId: students[0].id,
      startTime: new Date(Date.now() - 3600000),
      submittedAt: new Date(Date.now() - 3000000),
      score: 8.0,
      totalPoints: 10.0,
      percentage: 80.0,
      isPassed: true,
      status: 'SUBMITTED',
      proctorEvents: {
        create: [
          { type: 'TAB_SWITCH', metadata: JSON.stringify({ count: 1 }) },
        ],
      },
    },
  });

  // Student 2 took Quiz 1 and failed (score 5/10)
  const attempt2 = await prisma.attempt.create({
    data: {
      quizId: quiz1.id,
      studentId: students[1].id,
      startTime: new Date(Date.now() - 7200000),
      submittedAt: new Date(Date.now() - 6500000),
      score: 5.0,
      totalPoints: 10.0,
      percentage: 50.0,
      isPassed: false,
      status: 'SUBMITTED',
      proctorEvents: {
        create: [
          { type: 'TAB_SWITCH', metadata: JSON.stringify({ count: 3 }) },
          { type: 'WINDOW_BLUR', metadata: JSON.stringify({ count: 2 }) },
        ],
      },
    },
  });

  // Student 3 took Quiz 1 and passed with flying colors (score 10/10)
  const attempt3 = await prisma.attempt.create({
    data: {
      quizId: quiz1.id,
      studentId: students[2].id,
      startTime: new Date(Date.now() - 10800000),
      submittedAt: new Date(Date.now() - 10200000),
      score: 10.0,
      totalPoints: 10.0,
      percentage: 100.0,
      isPassed: true,
      status: 'SUBMITTED',
    },
  });

  console.log(`📊 Generated ${[attempt1, attempt2, attempt3].length} Initial Attempts with proctor event logs for live analytics.`);
  console.log('✅ QuizPulse Database Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
