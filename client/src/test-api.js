// Simple API test
const testAPI = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/database/stats');
    const data = await response.json();
    console.log('API Test Success:', data);
    return data;
  } catch (error) {
    console.error('API Test Error:', error);
    return null;
  }
};

// Run test
testAPI();
