import Redis from 'ioredis';

const client = new Redis({
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD,
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || 14613),
});

client.on('connect', () => console.log('Redis connected'));
client.on('error', err => console.log('Redis Client Error', err));

export default client;