require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('./models/Role');

// The initial data that used to be in data.js
const initialRoles = [
  {
    id: "swe",
    title: "Software Engineer",
    jd: "We are looking for a Software Engineer with experience in JavaScript, React, and Node.js. The ideal candidate should have strong problem-solving skills, experience with RESTful APIs, and familiarity with Git. Experience with Chrome Extensions is a plus.",
    requirements: ["JavaScript", "React", "Node.js", "REST APIs", "Git"]
  },
  {
    id: "pm",
    title: "Product Manager",
    jd: "Seeking a Product Manager to lead cross-functional teams. You should have excellent communication skills, experience with Agile methodologies, and a strong understanding of user-centered design. Technical background is preferred.",
    requirements: ["Agile", "Communication", "User-Centered Design", "Leadership"]
  },
  {
    id: "designer",
    title: "UX/UI Designer",
    jd: "We need a UX/UI Designer proficient in Figma or Sketch. You should have a strong portfolio demonstrating user research, wireframing, and high-fidelity prototyping. Understanding of HTML/CSS is a plus.",
    requirements: ["Figma", "Sketch", "User Research", "Wireframing", "Prototyping"]
  }
];

async function seedDB() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing in .env file.");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log("Clearing existing roles...");
    await Role.deleteMany({});
    
    console.log("Inserting initial roles...");
    await Role.insertMany(initialRoles);
    
    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDB();
