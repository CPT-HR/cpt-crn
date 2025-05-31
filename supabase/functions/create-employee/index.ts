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
    const results = []

    for (const employee of employees) {
      try {
        // 1. Provjeri postoji li user s tim emailom
        const { data: usersList, error: usersListError } = await supabaseAdmin.auth.admin.listUsers({ email: employee.email })
        if (usersListError) {
          results.push({ email: employee.email, success: false, error: usersListError.message })
          continue
        }

        let userId = null

        if (usersList && usersList.users && usersList.users.length > 0) {
          // User već postoji!
          userId = usersList.users[0].id

          // Provjeri postoji li profile za taj auth user id
          const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
            .from('employee_profiles').select('id').eq('id', userId).maybeSingle()
          if (profileCheckError) {
            results.push({ email: employee.email, success: false, error: profileCheckError.message })
            continue
          }
          if (existingProfile) {
            results.push({ email: employee.email, success: false, error: 'Korisnik već postoji (profile)' })
            continue
          }

          // Ako postoji user ali ne postoji profile – kreiraj profile
          const employeeData = {
            id: userId,
            first_name: employee.first_name,
            last_name: employee.last_name,
            email: employee.email,
            phone: employee.phone || null,
            location_id: employee.location_id || null,
            user_role: employee.user_role,
            vehicle_id: employee.vehicle_id || null,
            active: true
          }
          const { error: profileError } = await supabaseAdmin.from('employee_profiles').insert([employeeData])
          if (profileError) {
            results.push({ email: employee.email, success: false, error: profileError.message })
          } else {
            results.push({ email: employee.email, success: true, info: 'Profile dodan postojećem korisniku', userId })
          }
          continue
        }

        // 2. Ako user ne postoji – stvori auth usera
        const tempPassword = Math.random().toString(36).slice(-8) + "Aa1!"
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

        if (authError) {
          results.push({ email: employee.email, success: false, error: authError.message })
          continue
        }
        if (!authData.user) {
          results.push({ email: employee.email, success: false, error: 'Greška: Auth korisnik nije kreiran.' })
          continue
        }
        userId = authData.user.id

        // 3. Insert profile za novog korisnika
        const employeeData = {
          id: userId,
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          phone: employee.phone || null,
          location_id: employee.location_id || null,
          user_role: employee.user_role,
          vehicle_id: employee.vehicle_id || null,
          active: true
        }
        const { error: profileError } = await supabaseAdmin.from('employee_profiles').insert([employeeData])
        if (profileError) {
          // Cleanup, delete user if profile insert fails
          try { await supabaseAdmin.auth.admin.deleteUser(userId) } catch (e) {}
          results.push({ email: employee.email, success: false, error: profileError.message })
        } else {
          results.push({ email: employee.email, success: true, info: 'Korisnik i profil kreirani', userId })
        }

      } catch (error) {
        results.push({ email: employee.email, success: false, error: error.message })
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
