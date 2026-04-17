const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = 'https://wvgiftuncziulcjcqbps.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2Z2lmdHVuY3ppdWxjamNxYnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDEyNTgsImV4cCI6MjA5MTM3NzI1OH0.BAXl--DOyPqg4GBoCzGRhcuC3Tqi3mujnt4FpgkWl9Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@test.com',
    password: 'password' // Trying common password, assume dev environment
  });

  if (authError) {
    console.error('Auth error:', authError);
    return;
  }

  const { data, error } = await supabase.from('tickets').select('*').limit(1);
  if (error) {
    console.error('Fetch error:', error);
  } else if (data && data.length > 0) {
    console.log('Success! Ticket columns:', Object.keys(data[0]));
  } else {
    console.log('No tickets found even after auth.');
  }
}

test();
