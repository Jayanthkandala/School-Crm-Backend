const axios = require('axios');

async function testSchoolsAPI() {
    try {
        console.log('🔍 Testing /platform/schools API...\n');

        // You'll need to replace this with an actual token
        // For now, let's just test without auth to see the error
        const response = await axios.get('http://localhost:5002/api/v1/platform/schools', {
            headers: {
                'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
            }
        });

        console.log('✅ Response Status:', response.status);
        console.log('📊 Schools:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
    }
}

testSchoolsAPI();
