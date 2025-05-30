
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    const { employees } = await req.json()
    console.log('--- DEBUG EMPLOYEE INSERT ---');
    console.log('Got employees:', employees);

    const results = []

    for (const employee of employees) {
      try {
        console.log('-----------------------------------');
        console.log(`[START] Obrada: ${employee.email}`);

        // STEP 1: Provjeri postoji li korisnik već u auth.users
        console.log(`[CHECK] listUsers for email: ${employee.email}`);
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
          console.error(`[ERROR] listUsers:`, listError);
          results.push({ email: employee.email, success: false, error: listError.message });
          continue;
        }
        const existingAuthUser = existingUsers.users.find(user => user.email === employee.email);
        if (existingAuthUser) {
          console.log(`[FOUND] User already exists in auth.users for: ${employee.email}, id: ${existingAuthUser.id}`);
          // Provjeri postoji li već profile
          const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
            .from('employee_profiles').select('id').eq('id', existingAuthUser.id).maybeSingle();
          if (profileCheckError) {
            console.error(`[ERROR] profileCheck for existing user:`, profileCheckError);
            results.push({ email: employee.email, success: false, error: profileCheckError.message });
            continue;
          }
          if (existingProfile) {
            console.log(`[DUPLICATE] employee_profile already exists for: ${employee.email}, id: ${existingAuthUser.id}`);
            results.push({ email: employee.email, success: false, error: 'Korisnik već postoji (profile)' });
            continue;
          }
          // Ako ne postoji profile, pokušaj ga kreirati
          const employeeData = {
            id: existingAuthUser.id,
            first_name: employee.first_name,
            last_name: employee.last_name,
            email: employee.email,
            phone: employee.phone || null,
            location_id: employee.location_id || null,
            user_role: employee.user_role,
            vehicle_id: employee.vehicle_id || null,
            active: true
          }
          console.log(`[INSERT] employee_profile za existing user:`, employeeData);
          const { error: profileError } = await supabaseAdmin.from('employee_profiles').insert([employeeData]);
          if (profileError) {
            console.error(`[ERROR] profile insert for existing user:`, profileError);
            results.push({ email: employee.email, success: false, error: profileError.message });
          } else {
            results.push({ email: employee.email, success: true, userId: existingAuthUser.id, info: 'Profile added to existing user' });
          }
          continue;
        }

        // STEP 2: Kreiraj auth usera
        const tempPassword = Math.random().toString(36).slice(-8) + "Aa1!";
        console.log(`[CREATE] createUser for: ${employee.email}, password: ${tempPassword}`);
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: employee.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            first_name: employee.first_name,
            last_name: employee.last_name,
            role: employee.user_role
          }
        })
        console.log(`[RESULT] createUser:`, { authData, authError });

        if (authError) {
          console.error(`[ERROR] createUser:`, authError);
          results.push({ email: employee.email, success: false, error: authError.message });
          continue;
        }
        if (!authData.user) {
          console.error(`[ERROR] createUser returned no user:`, authData);
          results.push({ email: employee.email, success: false, error: 'No user created' });
          continue;
        }

        console.log(`[SUCCESS] User created for ${employee.email}, id: ${authData.user.id}`);

        // STEP 3: Provjeri postoji li već employee_profile za taj id
        const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
          .from('employee_profiles').select('id').eq('id', authData.user.id).maybeSingle();
        if (profileCheckError) {
          console.error(`[ERROR] profileCheck after createUser:`, profileCheckError);
          // Cleanup: delete auth user if profile check fails
          try {
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
            console.log(`[CLEANUP] Deleted user after profileCheck fail for ${employee.email}`);
          } catch (cleanupError) {
            console.error(`[CLEANUP ERROR]`, cleanupError);
          }
          results.push({ email: employee.email, success: false, error: profileCheckError.message });
          continue;
        }
        if (existingProfile) {
          console.log(`[DUPLICATE] employee_profile already exists after createUser for: ${employee.email}`);
          // Cleanup: delete auth user since profile already exists
          try {
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
            console.log(`[CLEANUP] Deleted user after duplicate profile for ${employee.email}`);
          } catch (cleanupError) {
            console.error(`[CLEANUP ERROR]`, cleanupError);
          }
          results.push({ email: employee.email, success: false, error: 'Korisnik već postoji (profile after createUser)' });
          continue;
        }

        // STEP 4: Kreiraj employee profile
        const employeeData = {
          id: authData.user.id,
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          phone: employee.phone || null,
          location_id: employee.location_id || null,
          user_role: employee.user_role,
          vehicle_id: employee.vehicle_id || null,
          active: true
        }
        console.log(`[INSERT] employee_profile after createUser:`, employeeData);
        const { error: profileError } = await supabaseAdmin.from('employee_profiles').insert([employeeData]);
        if (profileError) {
          console.error(`[ERROR] profile insert after createUser:`, profileError);
          // Cleanup: delete auth user if profile creation fails
          try {
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
            console.log(`[CLEANUP] Deleted user after profile insert fail for ${employee.email}`);
          } catch (cleanupError) {
            console.error(`[CLEANUP ERROR]`, cleanupError);
          }
          results.push({ email: employee.email, success: false, error: profileError.message });
        } else {
          results.push({ email: employee.email, success: true, userId: authData.user.id, info: 'User and profile created' });
        }

      } catch (error) {
        console.error(`[CATCH ALL] Error for ${employee.email}:`, error);
        results.push({ email: employee.email, success: false, error: error.message });
      }
    }

    console.log('--- FINAL DEBUG RESULTS ---');
    console.log(JSON.stringify(results, null, 2));

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('[FATAL ERROR] in create-employee function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
