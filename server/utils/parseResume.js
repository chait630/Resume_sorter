const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
];

const CITIES_TO_STATE = {
  'Bangalore': 'Karnataka', 'Bengaluru': 'Karnataka', 'Mysore': 'Karnataka', 'Hubli': 'Karnataka', 'Mangalore': 'Karnataka', 'Belgaum': 'Karnataka',
  'Mumbai': 'Maharashtra', 'Pune': 'Maharashtra', 'Nagpur': 'Maharashtra', 'Nashik': 'Maharashtra', 'Thane': 'Maharashtra', 'Aurangabad': 'Maharashtra', 'Solapur': 'Maharashtra',
  'Chennai': 'Tamil Nadu', 'Coimbatore': 'Tamil Nadu', 'Madurai': 'Tamil Nadu', 'Trichy': 'Tamil Nadu', 'Salem': 'Tamil Nadu', 'Tiruppur': 'Tamil Nadu',
  'Hyderabad': 'Telangana', 'Warangal': 'Telangana', 'Nizamabad': 'Telangana',
  'Kochi': 'Kerala', 'Trivandrum': 'Kerala', 'Calicut': 'Kerala', 'Thrissur': 'Kerala', 'Malappuram': 'Kerala', 'Wayanad': 'Kerala', 'Kozhikode': 'Kerala', 'Kannur': 'Kerala', 'Palakkad': 'Kerala', 'Kottayam': 'Kerala', 'Alappuzha': 'Kerala', 'Idukki': 'Kerala', 'Pathanamthitta': 'Kerala', 'Kasaragod': 'Kerala',
  'Delhi': 'Delhi', 'New Delhi': 'Delhi',
  'Noida': 'Uttar Pradesh', 'Lucknow': 'Uttar Pradesh', 'Kanpur': 'Uttar Pradesh', 'Agra': 'Uttar Pradesh', 'Ghaziabad': 'Uttar Pradesh', 'Varanasi': 'Uttar Pradesh', 'Meerut': 'Uttar Pradesh', 'Prayagraj': 'Uttar Pradesh',
  'Gurgaon': 'Haryana', 'Faridabad': 'Haryana', 'Ambala': 'Haryana', 'Panipat': 'Haryana',
  'Kolkata': 'West Bengal', 'Durgapur': 'West Bengal', 'Siliguri': 'West Bengal', 'Asansol': 'West Bengal',
  'Ahmedabad': 'Gujarat', 'Surat': 'Gujarat', 'Vadodara': 'Gujarat', 'Rajkot': 'Gujarat', 'Bhavnagar': 'Gujarat',
  'Jaipur': 'Rajasthan', 'Jodhpur': 'Rajasthan', 'Udaipur': 'Rajasthan', 'Kota': 'Rajasthan', 'Ajmer': 'Rajasthan',
  'Bhubaneswar': 'Odisha', 'Cuttack': 'Odisha', 'Rourkela': 'Odisha',
  'Patna': 'Bihar', 'Gaya': 'Bihar', 'Bhagalpur': 'Bihar',
  'Bhopal': 'Madhya Pradesh', 'Indore': 'Madhya Pradesh', 'Gwalior': 'Madhya Pradesh', 'Jabalpur': 'Madhya Pradesh', 'Ujjain': 'Madhya Pradesh',
  'Chandigarh': 'Punjab', 'Ludhiana': 'Punjab', 'Amritsar': 'Punjab', 'Jalandhar': 'Punjab', 'Patiala': 'Punjab',
  'Guwahati': 'Assam', 'Silchar': 'Assam', 'Dibrugarh': 'Assam',
  'Ranchi': 'Jharkhand', 'Jamshedpur': 'Jharkhand', 'Dhanbad': 'Jharkhand',
  'Raipur': 'Chhattisgarh', 'Bhilai': 'Chhattisgarh', 'Bilaspur': 'Chhattisgarh',
  'Dehradun': 'Uttarakhand', 'Haridwar': 'Uttarakhand',
  'Shimla': 'Himachal Pradesh',
  'Srinagar': 'Jammu and Kashmir', 'Jammu': 'Jammu and Kashmir',
  'Vijayawada': 'Andhra Pradesh', 'Visakhapatnam': 'Andhra Pradesh', 'Guntur': 'Andhra Pradesh', 'Nellore': 'Andhra Pradesh'
};

async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  try {
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
  }
  return '';
}

function extractLocation(text) {
  if (!text) return { state: 'Unknown', district: 'Unknown' };
  
  const normalizedText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ');
  const headerText = normalizedText.slice(0, 2000); // Scrutinize the first 2000 characters
  
  let matches = [];

  // 1. Find all City matches
  for (const city of Object.keys(CITIES_TO_STATE)) {
    const regex = new RegExp(`\\b${city}\\b`, 'gi');
    let m;
    while ((m = regex.exec(headerText)) !== null) {
      matches.push({ 
        type: 'city', 
        name: city, 
        state: CITIES_TO_STATE[city], 
        index: m.index 
      });
    }
  }

  // 2. Find all State matches
  for (const state of STATES) {
    const regex = new RegExp(`\\b${state}\\b`, 'gi');
    let m;
    while ((m = regex.exec(headerText)) !== null) {
      matches.push({ 
        type: 'state', 
        name: state, 
        state: state, 
        index: m.index 
      });
    }
  }

  // 3. Sort by index to find the EARLIEST mention
  matches.sort((a, b) => a.index - b.index);

  if (matches.length > 0) {
    const best = matches[0];
    return { 
      state: best.state, 
      district: best.type === 'city' ? best.name : 'Unknown' 
    };
  }

  // Fallback to full text search if header is empty of locations
  let fullMatches = [];
  for (const city of Object.keys(CITIES_TO_STATE)) {
    const regex = new RegExp(`\\b${city}\\b`, 'gi');
    const match = regex.exec(normalizedText);
    if (match) fullMatches.push({ type: 'city', name: city, state: CITIES_TO_STATE[city], index: match.index });
  }
  for (const state of STATES) {
    const regex = new RegExp(`\\b${state}\\b`, 'gi');
    const match = regex.exec(normalizedText);
    if (match) fullMatches.push({ type: 'state', name: state, state: state, index: match.index });
  }

  fullMatches.sort((a, b) => a.index - b.index);
  if (fullMatches.length > 0) {
    const best = fullMatches[0];
    return { state: best.state, district: best.type === 'city' ? best.name : 'Unknown' };
  }

  return { state: 'Unknown', district: 'Unknown' };
}

function extractEmail(text) {
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
  const match = text.match(emailRegex);
  return match ? match[0] : '';
}

function extractPhone(text) {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const match = text.match(phoneRegex);
  return match ? match[0] : '';
}

function extractSkills(text) {
  const commonSkills = [
    'React', 'Node.js', 'Python', 'Java', 'Javascript', 'C++', 'AWS', 'Docker',
    'SQL', 'MongoDB', 'React Native', 'Flutter', 'Angular', 'Vue', 'Next.js',
    'HTML', 'CSS', 'Tailwind', 'Typescript', 'Go', 'Ruby', 'PHP'
  ];
  const foundSkills = [];
  const normalizedText = text.toLowerCase();
  
  commonSkills.forEach(skill => {
    if (normalizedText.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  });
  
  return foundSkills.join(', ');
}

const { extractStructuredData } = require('./aiService');

async function parseResumeFull(filePath) {
  const text = await extractText(filePath);
  if (!text) return { 
    state: 'Unknown', district: 'Unknown', 
    email: '', phone: '', skills: '', name: 'Candidate',
    rawText: ''
  };

  try {
    // Attempt AI Extraction
    const aiData = await extractStructuredData(text);
    return {
      name: aiData.name || 'Candidate',
      email: aiData.email || extractEmail(text),
      phone: aiData.phone || extractPhone(text),
      skills: aiData.skills || extractSkills(text),
      state: aiData.state && aiData.state !== 'Unknown' ? aiData.state : extractLocation(text).state,
      district: aiData.district && aiData.district !== 'Unknown' ? aiData.district : extractLocation(text).district,
      rawText: text
    };
  } catch (err) {
    console.error('AI Parsing failed, using local heuristics:', err);
    const location = extractLocation(text);
    return {
      name: 'Candidate',
      ...location,
      email: extractEmail(text),
      phone: extractPhone(text),
      skills: extractSkills(text),
      rawText: text
    };
  }
}

module.exports = {
  parseResumeFull,
  extractText,
  extractLocation,
  extractEmail,
  extractPhone,
  extractSkills
};
