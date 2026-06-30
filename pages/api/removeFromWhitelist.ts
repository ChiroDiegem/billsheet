import { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '../../lib/authMiddleware'
import { createAdminClient } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { user, authorized } = await requireAdmin(req, res)
        if (!authorized || !user?.admin) {
            return res.status(403).json({ error: 'Super admin access required' })
        }

        const bodyEmail = typeof req.body?.email === 'string' ? req.body.email : ''
        const queryEmail = typeof req.query.email === 'string' ? req.query.email : ''
        const email = (bodyEmail || queryEmail).trim().toLowerCase()

        if (!email) {
            return res.status(400).json({ error: 'Email is required' })
        }

        const supabase = createAdminClient()
        const { error } = await supabase
            .from('email_whitelist')
            .delete()
            .eq('email', email)

        if (error) {
            console.error('Remove whitelist error:', error)
            return res.status(500).json({ error: error.message })
        }

        return res.status(200).json({ message: 'Email removed from whitelist' })
    } catch (error) {
        console.error('Remove whitelist error:', error)
        return res.status(500).json({ error: 'Unexpected server error' })
    }
}
