const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = 'https://wvgiftuncziulcjcqbps.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2Z2lmdHVuY3ppdWxjamNxYnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDEyNTgsImV4cCI6MjA5MTM3NzI1OH0.BAXl--DOyPqg4GBoCzGRhcuC3Tqi3mujnt4FpgkWl9Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testColumns() {
  const possibleNames = ['assignee_id', 'agent_id', 'staff_id', 'technician_id', 'assigned_user_id', 'tech_id'];

  for (const col of possibleNames) {
    const { error: insertError } = await supabase.from('tickets').insert([{
      title: "Test",
      [col]: "123"
    }]);

    if (insertError) {
      if (insertError.code === 'PGRST204') {
        // Column does not exist
      } else {
        console.log(`Column ${col} exists! It gave error:`, insertError.message);
      }
    } else {
      console.log(`Column ${col} exists! Success!`);
    }
  }
  console.log('Finished testing.');
}

testColumns();
