const SUPABASE_URL = 'https://pknenhrslavkmslgwktk.supabase.co'
const SUPABASE_KEY = 'sb_publishable_T6-ODWSx8BM-SUIWLJ4g8Q_YveoLTm9'

try {
  if (!window.supabaseClient) {
    if (!window.supabase || !window.supabase.createClient) {
      console.error('Supabase SDK not loaded');
    } else {
      window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
      console.log('Supabase client initialized')
    }
  }
} catch(e) {
  console.error('Failed to initialize Supabase client:', e)
  window.supabaseClient = null
}
