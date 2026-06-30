import { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '../../lib/supabase'
import { isEmailAllowed } from '../../utils/emailValidation'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        // Create admin client with service role key for admin operations
        const supabaseAdmin = createAdminClient()
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''

        if (!email) {
            return res.status(400).json({ error: "Email is required" })
        }
        
        // Email domain or whitelist validation
        let emailAllowed = isEmailAllowed(email)
        if (!emailAllowed) {
            const { data: whitelistEntry, error: whitelistError } = await supabaseAdmin
                .from('email_whitelist')
                .select('id')
                .eq('email', email)
                .limit(1)

            if (whitelistError) {
                console.error("Whitelist check error:", whitelistError)
                return res.status(500).json({ error: whitelistError.message })
            }

            emailAllowed = Boolean(whitelistEntry && whitelistEntry.length > 0)
        }

        if (!emailAllowed) {
            return res.status(403).json({ error: "Email domain not allowed" })
        }

        // Create the user with admin privileges
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: req.body.password,
            email_confirm: true, // Auto-confirm the email
            user_metadata: {
                full_name: req.body.name,
            }
        })
        
        if (userError) {
            return res.status(500).json({ error: userError.message })
        }
        
        // Create the profile record
        if (userData.user) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: userData.user.id,
                    name: req.body.name,
                    post: req.body.post,
                    iban: req.body.iban,
                })

            if (profileError) {
                console.error("Profile creation error:", profileError)
                return res.status(500).json({ error: profileError.message })
            }
        }

        return res.status(200).json({ message: "User created" })
    } catch (error) {
        console.error("Registration error:", error)
        return res.status(500).json({ error: "Unexpected server error" })
    }
}
