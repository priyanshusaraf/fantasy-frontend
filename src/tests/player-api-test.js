// src/tests/player-api-test.js

const testPlayerAPI = async () => {
  console.log('Starting player API test...');
  
  try {
    // Test creating a player with new fields through the API
    const response = await fetch('http://localhost:3000/api/players', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'API Test Player',
        country: 'Canada',
        skillLevel: 'A',
        age: 32,
        gender: 'FEMALE'
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('API created player:', data);
    
    // Fetch the created player to verify
    const getResponse = await fetch(`http://localhost:3000/api/players/${data.id}`);
    
    if (!getResponse.ok) {
      throw new Error(`API error fetching player: ${getResponse.status} ${getResponse.statusText}`);
    }
    
    const fetchedPlayer = await getResponse.json();
    console.log('API fetched player:', fetchedPlayer);
    
    console.log('API test completed successfully!');
  } catch (error) {
    console.error('API test failed:', error);
  }
};

// This file can be run in a browser console while the development server is running
// or you can uncomment the line below to run it with node-fetch if running with Node.js
// testPlayerAPI();

// Export the function for use in browser
module.exports = { testPlayerAPI }; 