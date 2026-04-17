import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://wvgiftuncziulcjcqbps.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2Z2lmdHVuY3ppdWxjamNxYnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDEyNTgsImV4cCI6MjA5MTM3NzI1OH0.BAXl--DOyPqg4GBoCzGRhcuC3Tqi3mujnt4FpgkWl9Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('tickets').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('Ticket columns:', Object.keys(data[0]));
  } else {
    console.log('No tickets found. Going to force an insert error to reveal schema cache.');
    const { error: insertError } = await supabase.from('tickets').insert([{ id: 'bogus', definitely_not_a_column: 1 }]);
    console.log('Insert error:', insertError);
  }
}

test();
