const SUPABASE_URL = 'https://wvgiftuncziulcjcqbps.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2Z2lmdHVuY3ppdWxjamNxYnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDEyNTgsImV4cCI6MjA5MTM3NzI1OH0.BAXl--DOyPqg4GBoCzGRhcuC3Tqi3mujnt4FpgkWl9Q';

async function checkColumns() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tickets?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!response.ok) {
      console.error("HTTP error", response.status);
      const text = await response.text();
      console.error(text);
      return;
    }

    const data = await response.json();
    if (data && data.length > 0) {
      console.log('Columns in tickets table:', Object.keys(data[0]));
    } else {
      console.log('No tickets returned. Trying an OPTIONS request to get schema.');
      // Fallback: doing OPTIONS request might return schema depending on setup
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

checkColumns();
