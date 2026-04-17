const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = 'https://wvgiftuncziulcjcqbps.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2Z2lmdHVuY3ppdWxjamNxYnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDEyNTgsImV4cCI6MjA5MTM3NzI1OH0.BAXl--DOyPqg4GBoCzGRhcuC3Tqi3mujnt4FpgkWl9Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testColumns() {
  const possibleNames = [
    'assignee', 'assign_to', 'assigned_tech', 'assigned_to_id', 'assignedUser',
    'agent', 'admin_id', 'handled_by', 'technician', 'operator_id', 'staff'
  ];

  let found = false;
  for (const col of possibleNames) {
    const { error: insertError } = await supabase.from('tickets').insert([{
      title: "Test",
      [col]: "3503b290-a7d1-4cb5-8bd3-70db6aeef46c"
    }]);

    if (insertError) {
      if (insertError.code !== 'PGRST204') {
        console.log(`Column ${col} exists! Error was:`, insertError.message);
        found = true;
      }
    } else {
      console.log(`Column ${col} exists! Success!`);
      found = true;
    }
  }

  if (!found) {
    console.log('Finished testing. NO column was found.');
  }
}

testColumns();
