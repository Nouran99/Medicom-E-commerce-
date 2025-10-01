#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Medicum Egypt - Supabase Setup\n');
console.log('Please provide your Supabase credentials:');
console.log('(You can find these in your Supabase Dashboard > Settings > API)\n');

const questions = [
  {
    key: 'SUPABASE_URL',
    question: 'Supabase Project URL (e.g., https://xxxxx.supabase.co): ',
    validate: (value) => value.startsWith('https://') && value.includes('supabase.co')
  },
  {
    key: 'SUPABASE_ANON_KEY',
    question: 'Supabase Anon/Public Key (starts with eyJ...): ',
    validate: (value) => value.startsWith('eyJ')
  },
  {
    key: 'SUPABASE_SERVICE_KEY',
    question: 'Supabase Service Role Key (starts with eyJ...): ',
    validate: (value) => value.startsWith('eyJ')
  }
];

const config = {};
let currentQuestion = 0;

function askQuestion() {
  if (currentQuestion >= questions.length) {
    updateEnvFile();
    return;
  }

  const q = questions[currentQuestion];
  rl.question(q.question, (answer) => {
    if (q.validate && !q.validate(answer)) {
      console.log('❌ Invalid format. Please try again.');
      askQuestion();
      return;
    }
    
    config[q.key] = answer;
    currentQuestion++;
    askQuestion();
  });
}

function updateEnvFile() {
  const envPath = '.dev.vars';
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update Supabase credentials
  envContent = envContent.replace(/SUPABASE_URL=.*/g, `SUPABASE_URL=${config.SUPABASE_URL}`);
  envContent = envContent.replace(/SUPABASE_ANON_KEY=.*/g, `SUPABASE_ANON_KEY=${config.SUPABASE_ANON_KEY}`);
  envContent = envContent.replace(/SUPABASE_SERVICE_KEY=.*/g, `SUPABASE_SERVICE_KEY=${config.SUPABASE_SERVICE_KEY}`);
  
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Supabase configuration updated successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Run the migrations in your Supabase SQL Editor');
  console.log('2. Restart the application: pm2 restart medicum-egypt');
  console.log('3. Your app should now connect to Supabase!');
  
  rl.close();
}

askQuestion();