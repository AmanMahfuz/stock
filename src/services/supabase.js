import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase Environment Variables! Check .env file.")
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true, // Automatically persist session to localStorage
        autoRefreshToken: true, // Automatically refresh the token before expiry
        detectSessionInUrl: true // Automatically detect auth redirects
    }
})

// Initialize session restoration
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
        // Optional: you could sync user data here
    }
})
