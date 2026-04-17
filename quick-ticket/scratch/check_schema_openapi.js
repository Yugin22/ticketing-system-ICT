const SUPABASE_URL = 'https://wvgiftuncziulcjcqbps.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2Z2lmdHVuY3ppdWxjamNxYnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDEyNTgsImV4cCI6MjA5MTM3NzI1OH0.BAXl--DOyPqg4GBoCzGRhcuC3Tqi3mujnt4FpgkWl9Q';

async function checkSchema() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_KEY}`);

    if (!response.ok) {
      console.error("HTTP error", response.status);
      return;
    }

    const data = await response.json();
    const ticketsTable = data.definitions.tickets;
    if (ticketsTable) {
      console.log("Tickets Table Schema Properties:");
      console.log(Object.keys(ticketsTable.properties));
    } else {
      console.log("Could not find tickets definition");
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

checkSchema();
