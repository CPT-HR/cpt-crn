
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

        // STEP 1: Check if user with this email already exists in auth.users
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (listError) {
          console.error(`Error listing users: ${listError.message}`)
          results.push({
            email: employee.email,
            success: false,
            error: `Error checking existing users: ${listError.message}`
          })
          continue
        }

        console.log('ALL AUTH USERS:', existingUsers ? existingUsers.users.map(u => `${u.email} (ID: ${u.id})`) : [])
        console.log('TRYING TO CREATE EMAIL:', employee.email)

        const existingAuthUser = existingUsers && existingUsers.users.find(user => user.email === employee.email)
        if (existingAuthUser) {
            console.log(`User already exists in auth.users for ${employee.email} (ID: ${existingAuthUser.id})`)
            results.push({
                email: employee.email,
                success: false,
                error: 'Korisnik već postoji (auth.users)',
                isDuplicate: true
            })
            continue
        }

        // STEP 2: Generate unique temporary password and create auth user
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8) + "Aa1!"
        console.log(`Attempting to create NEW auth user for ${employee.email} with password length: ${tempPassword.length}`)
        
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

        console.log(`Auth creation result for ${employee.email}:`)
        console.log('AuthData:', JSON.stringify(authData, null, 2))
        console.log('AuthError:', JSON.stringify(authError, null, 2))

        if (authError) {
            console.error(`Auth error for ${employee.email}:`, authError)
            results.push({ 
              email: employee.email, 
              success: false, 
              error: `Auth creation failed: ${authError.message}` 
            })
            continue
        }

        if (!authData.user) {
            console.error(`No user created for ${employee.email} - authData.user is null/undefined`)
            results.push({ 
              email: employee.email, 
              success: false, 
              error: 'No user created - auth response missing user data' 
            })
            continue
        }

        const newUserId = authData.user.id
        console.log(`✅ NEW USER CREATED successfully for ${employee.email} with ID: ${newUserId}`)

        // STEP 3: Check if employee_profile with this ID already exists
        const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
            .from('employee_profiles')
            .select('id, email')
            .eq('id', newUserId)
            .maybeSingle()

        if (profileCheckError) {
            console.error(`Error checking existing profile for ${employee.email}:`, profileCheckError)
            // Cleanup: delete auth user if profile check fails
            try {
                await supabaseAdmin.auth.admin.deleteUser(newUserId)
                console.log(`Cleaned up auth user for ${employee.email} due to profile check error`)
            } catch (cleanupError) {
                console.error(`Cleanup error for ${employee.email}:`, cleanupError)
            }
            results.push({ 
              email: employee.email, 
              success: false, 
              error: `Profile check failed: ${profileCheckError.message}` 
            })
            continue
        }

        if (existingProfile) {
            console.log(`Employee profile already exists for ID ${newUserId} (email: ${existingProfile.email})`)
            // Cleanup: delete auth user since profile already exists
            try {
                await supabaseAdmin.auth.admin.deleteUser(newUserId)
                console.log(`Cleaned up auth user for ${employee.email} due to existing profile`)
            } catch (cleanupError) {
                console.error(`Cleanup error for ${employee.email}:`, cleanupError)
            }
            results.push({
                email: employee.email,
                success: false,
                error: 'Employee profile već postoji',
                isDuplicate: true
            })
            continue
        }

        // STEP 4: Create employee_profile with the new auth user ID
        const employeeData = {
            id: newUserId,
            first_name: employee.first_name,
            last_name: employee.last_name,
            email: employee.email,
            phone: employee.phone || null,
            location_id: employee.location_id || null,
            user_role: employee.user_role,
            vehicle_id: employee.vehicle_id || null,
            active: true,
            // Initialize signature fields as null - can be set later
            signature_data: null,
            signature_created_at: null,
            signature_updated_at: null
        }

        console.log(`Creating employee profile for ${employee.email} with data:`, employeeData)
        const { error: profileError } = await supabaseAdmin
            .from('employee_profiles')
            .insert([employeeData])

        if (profileError) {
            console.error(`Profile creation error for ${employee.email}:`, profileError)
            // Cleanup: delete auth user if profile creation fails
            try {
                await supabaseAdmin.auth.admin.deleteUser(newUserId)
                console.log(`Cleaned up auth user for ${employee.email} due to profile creation error`)
            } catch (cleanupError) {
                console.error(`Cleanup error for ${employee.email}:`, cleanupError)
            }
            results.push({ 
              email: employee.email, 
              success: false, 
              error: `Profile creation failed: ${profileError.message}` 
            })
        } else {
            console.log(`✅ Employee profile created successfully for ${employee.email} with ID: ${newUserId}`)
            results.push({ 
              email: employee.email, 
              success: true, 
              userId: newUserId 
            })
        }

      } catch (error) {
        console.error(`Error processing employee ${employee.email}:`, error)
        results.push({ email: employee.email, success: false, error: error.message })
      }
    }

    console.log('Final results:', results)
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
