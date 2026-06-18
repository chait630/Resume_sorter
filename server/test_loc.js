const { extractLocation } = require('./utils/parseResume');

const resumes = [
  "I am a developer from Mumbai. I previously worked in Bangalore.",
  "Worked in Bengaluru, Karnataka. Lives in Pune.", // This should pick Bengaluru if it's first? Wait, Bengaluru is index 10, Pune is index 41. It should pick Bengaluru.
  "Address: Chennai. Experience: Bangalore.",
];

resumes.forEach(text => {
  console.log(`Text: "${text}"`);
  console.log(`Result:`, extractLocation(text));
  console.log('---');
});
