const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = 'https://wvgiftuncziulcjcqbps.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2Z2lmdHVuY3ppdWxjamNxYnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDEyNTgsImV4cCI6MjA5MTM3NzI1OH0.BAXl--DOyPqg4GBoCzGRhcuC3Tqi3mujnt4FpgkWl9Q';

async function introspect() {
  const query = `
    query {
      __type(name: "tickets") {
        name
        fields {
          name
        }
      }
    }
  `;

  try {
    const response = await fetch(`${SUPABASE_URL}/graphql/v1`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      console.error("HTTP error", response.status);
      return;
    }

    const data = await response.json();
    console.log("Column names:");
    data.data.__type.fields.forEach(f => console.log(f.name));
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

introspect();
