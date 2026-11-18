
const SUPABASE_URL = "https://xcrmkeiglylkbrpcvipf.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_NzDIwCbmicI4eic2TY5MXA_FtoEcqxL";

const { createClient } = window.supabase;

const supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

console.log("EduConnect Supabase connected!");
