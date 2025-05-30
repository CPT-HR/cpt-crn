
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { employees } = await req.json()
    console.log('Creating employees:', employees)

    const results = []

    for (const employee of employees) {
      try {
        console.log(`Processing employee: ${employee.email}`)

        // STEP 1: Check if auth user already exists
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (listError) {
          console.error(`Error listing users for ${employee.email}:`, listError)
          results.push({ email: employee.email, success: false, error: 'Failed to check existing users' })
          continue
        }

        const existingAuthUser = existingUsers.users.find(user => user.email === employee.email)
        
        if (existingAuthUser) {
          console.log(`Auth user already exists for ${employee.email}`)
          
          // Check if employee profile also exists
          const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
            .from('employee_profiles')
            .select('id')
            .eq('id', existingAuthUser.id)
            .single()

          if (profileCheckError && profileCheckError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error(`Error checking existing profile for ${employee.email}:`, profileCheckError)
            results.push({ email: employee.email, success: false, error: 'Failed to check existing profile' })
            continue
          }

          if (existingProfile) {
            console.log(`Employee profile already exists for ${employee.email}`)
            results.push({ email: employee.email, success: false, error: 'Korisnik već postoji' })
          } else {
            console.log(`Creating missing employee profile for existing user ${employee.email}`)
            
            // Create employee profile for existing auth user
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

            const { error: profileError } = await supabaseAdmin
              .from('employee_profiles')
              .insert([employeeData])

            if (profileError) {
              console.error(`Profile creation error for existing user ${employee.email}:`, profileError)
              results.push({ email: employee.email, success: false, error: profileError.message })
            } else {
              console.log(`Employee profile created for existing user ${employee.email}`)
              results.push({ email: employee.email, success: true, userId: existingAuthUser.id })
            }
          }
          continue
        }

        // STEP 2: Create new auth user (only if doesn't exist)
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
          console.error(`Auth error for ${employee.email}:`, authError)
          results.push({ email: employee.email, success: false, error: authError.message })
          continue
        }

        if (!authData.user) {
          console.error(`No user created for ${employee.email}`)
          results.push({ email: employee.email, success: false, error: 'No user created' })
          continue
        }

        console.log(`Auth user created for ${employee.email} with ID: ${authData.user.id}`)

        // STEP 3: Create employee profile with auth user ID
        const employeeData = {
          id: authData.user.id, // Use auth user ID
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          phone: employee.phone || null,
          location_id: employee.location_id || null,
          user_role: employee.user_role,
          vehicle_id: employee.vehicle_id || null,
          active: true
        }

        const { error: profileError } = await supabaseAdmin
          .from('employee_profiles')
          .insert([employeeData])

        if (profileError) {
          console.error(`Profile error for ${employee.email}:`, profileError)
          // Cleanup: delete auth user if profile creation fails
          try {
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
          } catch (cleanupError) {
            console.error(`Cleanup error for ${employee.email}:`, cleanupError)
          }
          results.push({ email: employee.email, success: false, error: profileError.message })
        } else {
          console.log(`Employee profile created successfully for ${employee.email}`)
          results.push({ email: employee.email, success: true, userId: authData.user.id })
        }

      } catch (error) {
        console.error(`Error processing employee ${employee.email}:`, error)
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
    console.error('Error in create-employee function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
