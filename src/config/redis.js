import { createClient } from 'redis';

const client = createClient({
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_SOCKET_HOST,
        port: parseInt(process.env.REDIS_SOCKET_PORT || 14613),
    }
});

client.on('connect', () => console.log('Redis connected'));
client.on('error', err => console.log('Redis Client Error', err));

(async () => {
    await client.connect();
})();

export default client;