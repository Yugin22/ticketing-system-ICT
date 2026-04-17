const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = 'https://wvgiftuncziulcjcqbps.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2Z2lmdHVuY3ppdWxjamNxYnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDEyNTgsImV4cCI6MjA5MTM3NzI1OH0.BAXl--DOyPqg4GBoCzGRhcuC3Tqi3mujnt4FpgkWl9Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { error: insertError } = await supabase.from('tickets').insert([{
    title: "Test",
    description: "test",
    status: "Open",
    user_id: "e44d1830-ec48-4fd6-9aa9-c8c366ff1ec8", // Random valid uuid maybe?
    assigned_to: "123"
  }]);

  if (insertError) {
    if (insertError.message.includes('foreign key constraint') || insertError.message.includes('uuid')) {
      console.log('Column exists but validation failed:', insertError);
    } else {
      console.log('Insert error:', insertError);
    }
  } else {
    console.log('Success - column exists');
  }
}

test();
