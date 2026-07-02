/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    async redirects() {
        return [
            { source: '/my-bills', destination: '/bills', permanent: true },
            { source: '/open-kassa', destination: '/kassa/new', permanent: true },
            { source: '/close-kassa', destination: '/kassa', permanent: true },
            { source: '/edit-bill', destination: '/admin/bills', permanent: true },
            { source: '/edit-contract', destination: '/contracts', permanent: true },
            { source: '/edit-kassa', destination: '/kassa', permanent: true },
            { source: '/edit-user', destination: '/users', permanent: true },
            { source: '/admin', destination: '/admin/bills', permanent: true },
            { source: '/contract', destination: '/contracts', permanent: true },
            { source: '/contract/new', destination: '/contracts/new', permanent: true },
        ];
    },
}

module.exports = nextConfig
