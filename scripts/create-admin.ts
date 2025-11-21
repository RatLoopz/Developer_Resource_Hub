import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminUser() {
  try {
    console.log("Creating admin user...")

    // Create the user with auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: "admin@gmail.com",
      password: "adminPASS22@",
      email_confirm: true,
    })

    if (authError) {
      console.error("Error creating auth user:", authError)
      return
    }

    console.log("Auth user created:", authData.user?.id)

    // Update the profile to set role as admin
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", authData.user?.id)

    if (profileError) {
      console.error("Error updating profile:", profileError)
      return
    }

    console.log("✅ Admin user created successfully!")
    console.log("Email: admin@gmail.com")
    console.log("Password: adminPASS22@")
  } catch (error) {
    console.error("Error:", error)
  }
}

createAdminUser()
