require('dotenv').config();
const mongoose = require('mongoose');
const Topic    = require('./models/Topic');

const SEED_TOPICS = [
  { title: 'Artificial Intelligence is more beneficial than dangerous to society', category: 'technology', difficulty: 'intermediate', trending: true, featured: true, totalDebates: 1240, tags: ['AI', 'technology', 'future'] },
  { title: 'Social media does more harm than good to mental health', category: 'technology', difficulty: 'beginner', trending: true, totalDebates: 980, tags: ['social media', 'mental health'] },
  { title: 'Nuclear energy is the best solution to climate change', category: 'climate', difficulty: 'intermediate', featured: true, totalDebates: 890, tags: ['nuclear', 'energy', 'climate'] },
  { title: 'Universal Basic Income should be implemented globally', category: 'economy', difficulty: 'expert', totalDebates: 445, tags: ['UBI', 'economy'] },
  { title: 'Online learning will replace traditional classrooms by 2035', category: 'education', difficulty: 'beginner', totalDebates: 654, tags: ['education', 'technology'] },
  { title: 'Cryptocurrency will replace traditional banking systems', category: 'economy', difficulty: 'intermediate', totalDebates: 320, tags: ['crypto', 'finance'] },
  { title: 'Governments should ban single-use plastics immediately', category: 'climate', difficulty: 'beginner', totalDebates: 560, tags: ['plastic', 'environment'] },
  { title: 'Genetic engineering of humans should be permitted for disease prevention', category: 'science', difficulty: 'expert', totalDebates: 210, tags: ['genetics', 'ethics', 'science'] },
  { title: 'Mandatory voting should be implemented in all democracies', category: 'politics', difficulty: 'intermediate', totalDebates: 330, tags: ['voting', 'democracy'] },
  { title: 'Space exploration is a better investment than solving Earth\'s problems', category: 'science', difficulty: 'intermediate', totalDebates: 400, tags: ['space', 'science', 'investment'] },
  { title: 'The death penalty should be abolished worldwide', category: 'politics', difficulty: 'intermediate', totalDebates: 780, tags: ['justice', 'human rights'] },
  { title: 'Meat consumption should be taxed to reduce environmental impact', category: 'climate', difficulty: 'expert', totalDebates: 290, tags: ['meat', 'tax', 'environment'] },
  { title: 'Standardised testing does more harm than good in education', category: 'education', difficulty: 'beginner', totalDebates: 510, tags: ['testing', 'school'] },
  { title: 'Remote work should become the permanent default for office jobs', category: 'economy', difficulty: 'beginner', totalDebates: 620, tags: ['remote work', 'office'] },
  { title: 'Billionaires should not be allowed to exist in a just society', category: 'economy', difficulty: 'expert', totalDebates: 890, tags: ['wealth', 'inequality'] },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  await Topic.deleteMany({});
  await Topic.insertMany(SEED_TOPICS);
  console.log(`✅ Seeded ${SEED_TOPICS.length} topics`);

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
