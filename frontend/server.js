const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve dashboard for /dashboard route
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard', 'index.html'));
});


// Catch all other routes and serve index.html (for SPA behavior)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log('🌐 University Course Scheduling Frontend');
  console.log('==========================================');
  console.log(`📂 Serving files from: ${path.join(__dirname, 'public')}`);
  console.log(`🔗 Frontend URL: http://localhost:${PORT}`);
  console.log(`🔗 Dashboard URL: http://localhost:${PORT}/dashboard`);
  console.log('🔗 Backend API: http://127.0.0.1:5000/api');
  console.log('');
  console.log('💡 Make sure the backend API is running:');
  console.log('   cd ../api && npm run start:dev');
  console.log('');
  console.log('🚀 Frontend server is ready!');
});
