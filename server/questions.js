const ROUNDS = [
  {
    name: "Round 1 · Warm-Up",
    key: "warm-up",
    questions: [
      "Paint a picture — if I could magically see you right now, what are you wearing?",
      "Are you easily flustered, or do you have a really good poker face?",
      "What's the first thing you usually notice about someone when you meet them in person?",
      "What's a weird little thing someone can do that instantly makes them 10× more attractive to you?",
    ]
  },
  {
    name: "Round 2 · Chemistry",
    key: "chemistry",
    questions: [
      "If we skipped the small talk and were hanging out on a couch right now, who makes the first move?",
      "If we went on a late-night drive with no destination, what's the vibe in the car?",
      "If we were in a crowded room right now, how would you secretly let me know you were interested?",
      "Who do you think would break eye contact first if we were just staring at each other right now?",
    ]
  },
  {
    name: "Round 3 · The Heat",
    key: "heat",
    questions: [
      "When we finally meet up — polite hug, or skipping straight to something else?",
      "Describe your ideal first kiss — slow and romantic, or pulling me in close?",
      "What's one surefire way I could make you blush if I took you out this weekend?",
      "What's a physical boundary you love having pushed when you're getting to know someone?",
    ]
  },
  {
    name: "Round 4 · Lightning ⚡",
    key: "lightning",
    questions: [
      "Lights on or lights off?",
      "Morning or late night?",
      "Neck kisses or back tracing?",
      "Taking control or letting them take charge?",
      "Loud and vocal, or biting your lip?",
      "Pinned against the wall or pulled by the waist?",
      "Slow and teasing or fast and intense?",
    ]
  },
  {
    name: "Round 5 · Dares 🔥",
    key: "dares",
    questions: [
      "Show me the exact look you'd give from across the room if you wanted me to come over.",
      "Close your eyes and describe exactly where you want my hands to go right now.",
      "Dim your lights and set the mood — what song do you put on?",
    ]
  }
];

// Build ALL_QUESTIONS and shuffle per-round
function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Shuffle questions within each round at build time
const ALL_QUESTIONS = [];
ROUNDS.forEach((r, roundIndex) => {
  const shuffledQuestions = shuffleArray(r.questions);
  shuffledQuestions.forEach((text, qIndex) => {
    ALL_QUESTIONS.push({
      text,
      round: r.name,
      roundKey: r.key,
      roundIndex: roundIndex,
      questionIndex: qIndex
    });
  });
});

module.exports = { ROUNDS, ALL_QUESTIONS };