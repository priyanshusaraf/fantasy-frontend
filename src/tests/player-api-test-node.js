const fetch = require('node-fetch');

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
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('API created player:', data);
    
    // Fetch all players to verify our player was added
    const getAllResponse = await fetch('http://localhost:3000/api/players');
    
    if (!getAllResponse.ok) {
      throw new Error(`API error fetching players: ${getAllResponse.status} ${getAllResponse.statusText}`);
    }
    
    const allPlayers = await getAllResponse.json();
    console.log('All players count:', allPlayers.players.length);
    console.log('Sample player from list:', allPlayers.players[0]);
    
    console.log('API test completed successfully!');
  } catch (error) {
    console.error('API test failed:', error);
  }
};

// Run the test
testPlayerAPI(); 