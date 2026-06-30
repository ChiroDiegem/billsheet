import { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''

        if (!email) {
            return res.status(400).json({ error: 'Email is required' })
        }

        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('email_whitelist')
            .select('id')
            .eq('email', email)
            .limit(1)

        if (error) {
            console.error('Whitelist check error:', error)
            return res.status(500).json({ error: error.message })
        }

        return res.status(200).json({ whitelisted: Boolean(data && data.length > 0) })
    } catch (error) {
        console.error('Check whitelist error:', error)
        return res.status(500).json({ error: 'Unexpected server error' })
    }
}
