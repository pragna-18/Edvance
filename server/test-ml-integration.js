import { predictHealthScoreWithFallback } from './utils/healthScorePredictor.js';

// Test lesson plan
const testLesson = {
  title: "Photosynthesis Basics",
  subject: "Biology",
  topic: "Plant Biology",
  grade: "10",
  duration: 45,
  content: {
    overview: "Understanding photosynthesis process",
    details: "Learn how plants convert sunlight to energy"
  },
  objectives: [
    "Understand photosynthesis process",
    "Identify key components",
    "Explain energy conversion"
  ],
  materials: [
    "Visual aids",
    "Lab equipment",
    "Microscopes"
  ],
  activities: [
    "Group discussion",
    "Laboratory experiment",
    "Video analysis"
  ],
  assessments: [
    "Quiz",
    "Lab report"
  ],
  differentiation: [
    "Extended learning for advanced students",
    "Visual aids for visual learners"
  ]
};

console.log("🧪 Testing ML Model Integration with Backend");
console.log("=" .repeat(50));
console.log("\n📚 Test Lesson Plan:");
console.log(`   Title: ${testLesson.title}`);
console.log(`   Subject: ${testLesson.subject}`);
console.log(`   Grade: ${testLesson.grade}`);
console.log(`   Duration: ${testLesson.duration} minutes`);

console.log("\n🚀 Calling ML Model...\n");

predictHealthScoreWithFallback(testLesson)
  .then(prediction => {
    console.log("✅ PREDICTION SUCCESSFUL!");
    console.log("=" .repeat(50));
    console.log(`\n📊 Health Score: ${prediction.score}/10`);
    console.log(`📌 Source: ${prediction.source}`);
    console.log(`\n📋 Features Extracted:`);
    if (prediction.features) {
      Object.entries(prediction.features).forEach(([key, value]) => {
        console.log(`   • ${key}: ${value}`);
      });
    }
    console.log(`\n💡 Reasoning:`);
    if (prediction.reasoning && Array.isArray(prediction.reasoning)) {
      prediction.reasoning.forEach((reason, i) => {
        console.log(`   ${i + 1}. ${reason}`);
      });
    }
    console.log("\n" + "=" .repeat(50));
    console.log("✅ ML Model Integration Verified!");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ ERROR:", error.message);
    process.exit(1);
  });
