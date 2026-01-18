
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findPublicPortfolio() {
  const { data, error } = await supabase
    .from('portfolios')
    .select('slug')
    .eq('is_public', true)
    .limit(1);

  if (error) {
    console.error('Error fetching portfolios:', error);
    process.exit(1);
  }

  if (data && data.length > 0) {
    console.log(`PUBLIC_PORTFOLIO_SLUG:${data[0].slug}`);
  } else {
    console.log('No public portfolios found');
  }
}

findPublicPortfolio();
