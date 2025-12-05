/**
 * Create Admin Users Script
 * Run with: npx tsx scripts/create-admin.ts
 * 
 * Make sure you have SUPABASE_SERVICE_ROLE_KEY in your .env.local
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables!");
  console.error("   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface UserToCreate {
  email: string;
  password: string;
  full_name: string;
  role: string;
}

const usersToCreate: UserToCreate[] = [
  {
    email: "wilson@mutant.ae",
    password: "MutantAdmin2024!", // Change this!
    full_name: "Wilson Admin",
    role: "super_admin",
  },
  {
    email: "test@mamalukitchen.com",
    password: "TestUser2024!", // Change this!
    full_name: "Test Customer",
    role: "customer",
  },
];

async function createUsers() {
  console.log("🚀 Starting user creation...\n");

  for (const user of usersToCreate) {
    console.log(`Creating user: ${user.email}`);

    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", user.email)
        .single();

      if (existingUsers) {
        console.log(`   ⚠️  User ${user.email} already exists, updating role...`);
        
        await supabase
          .from("profiles")
          .update({ role: user.role, full_name: user.full_name })
          .eq("email", user.email);
        
        console.log(`   ✅ Updated to ${user.role}\n`);
        continue;
      }

      // Create user in Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
        },
      });

      if (authError) {
        // If user exists in auth but not in profiles
        if (authError.message.includes("already been registered")) {
          console.log(`   ⚠️  Auth user exists, checking profile...`);
          
          // Try to update existing profile by email
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ role: user.role, full_name: user.full_name })
            .eq("email", user.email);

          if (updateError) {
            console.log(`   ❌ Failed to update: ${updateError.message}\n`);
          } else {
            console.log(`   ✅ Profile updated\n`);
          }
          continue;
        }
        
        throw authError;
      }

      if (!authData.user) {
        throw new Error("No user data returned");
      }

      // Update profile with role
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: user.full_name,
          role: user.role,
        })
        .eq("id", authData.user.id);

      if (profileError) {
        console.log(`   ⚠️  Profile update warning: ${profileError.message}`);
      }

      console.log(`   ✅ Created successfully!`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Password: ${user.password}`);
      console.log(`   👤 Role: ${user.role}\n`);

    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log("✨ Done!\n");
  console.log("=".repeat(50));
  console.log("ADMIN LOGIN CREDENTIALS");
  console.log("=".repeat(50));
  console.log(`Email:    wilson@mutant.ae`);
  console.log(`Password: MutantAdmin2024!`);
  console.log(`URL:      http://localhost:3000/admin/login`);
  console.log("=".repeat(50));
  console.log("\n⚠️  IMPORTANT: Change these passwords after first login!\n");
}

createUsers().catch(console.error);
