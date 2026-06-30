import { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '../../lib/authMiddleware'
import { createAdminClient } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { user, authorized } = await requireAdmin(req, res)
        if (!authorized || !user?.admin) {
            return res.status(403).json({ error: 'Super admin access required' })
        }

        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('email_whitelist')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Get whitelist error:', error)
            return res.status(500).json({ error: error.message })
        }

        return res.status(200).json({ whitelist: data })
    } catch (error) {
        console.error('Get whitelist error:', error)
        return res.status(500).json({ error: 'Unexpected server error' })
    }
}
