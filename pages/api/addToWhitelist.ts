import { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '../../lib/authMiddleware'
import { createAdminClient } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { user, authorized } = await requireAdmin(req, res)
        if (!authorized || !user?.admin) {
            return res.status(403).json({ error: 'Super admin access required' })
        }

        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''

        if (!email) {
            return res.status(400).json({ error: 'Email is required' })
        }

        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('email_whitelist')
            .insert({
                email,
                added_by: user.id,
            })
            .select()
            .single()

        if (error) {
            console.error('Add whitelist error:', error)
            return res.status(500).json({ error: error.message })
        }

        return res.status(200).json({ whitelistEntry: data })
    } catch (error) {
        console.error('Add whitelist error:', error)
        return res.status(500).json({ error: 'Unexpected server error' })
    }
}
