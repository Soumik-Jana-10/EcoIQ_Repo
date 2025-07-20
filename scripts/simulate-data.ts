import axios from 'axios';

const API_ENDPOINT = 'https://jzpl5g335a.execute-api.ap-south-1.amazonaws.com/prod/ingest';

const ROOM_IDS = ['A1', 'B2', 'C3'];

function getRandom(min: number, max: number, decimals = 0) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

async function sendSensorData() {
  const roomId = ROOM_IDS[Math.floor(Math.random() * ROOM_IDS.length)];
  const data = {
    room_id: roomId,
    temperature: getRandom(18, 35, 1),
    humidity: getRandom(30, 70),
    occupancy: getRandom(0, 10),
    aqi: getRandom(10, 200),
  };

  try {
    console.log(`Sending data for room ${data.room_id}:`, data);
    const response = await axios.post(API_ENDPOINT, data);
    console.log('Response:', response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error sending data:', error.response?.data || error.message);
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }
}

// Send data every 5 seconds
setInterval(sendSensorData, 5000);

console.log('Starting sensor data simulation...'); 