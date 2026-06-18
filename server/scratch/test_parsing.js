const { extractLocation } = require('../utils/parseResume');

const samples = [
  {
    name: 'Chennai Resume',
    text: 'Name: John Doe \n Address: 123 Street, Chennai, Tamil Nadu \n Experience: Worked in Bengaluru for 2 years.'
  },
  {
    name: 'Delhi Resume',
    text: 'Resume \n New Delhi, India \n Skills: React, Node'
  },
  {
    name: 'Mumbai Resume',
    text: 'Contact: 9876543210 \n Location: Mumbai, Maharashtra \n Education: IIT Bombay'
  },
  {
    name: 'Unknown Resume',
    text: 'Just some text without city names.'
  }
];

samples.forEach(s => {
  const loc = extractLocation(s.text);
  console.log(`Sample: ${s.name}`);
  console.log(`Result: State: ${loc.state}, District: ${loc.district}`);
  console.log('---');
});
