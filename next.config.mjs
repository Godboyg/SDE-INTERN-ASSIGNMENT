/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites(){
        return [
            {
                source: '/:path*',
                destination: "https://sde-backend.onrender.com/:path*",
            }
        ]
    }
};

export default nextConfig;
