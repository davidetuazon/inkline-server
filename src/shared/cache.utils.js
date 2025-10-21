import redis from '../config/redis.js';

const DEFAULT_TTL = 60 * 5;

export async function setCache(key, data, ttl = DEFAULT_TTL) {
    try {
        const val = JSON.stringify(data);
        await redis.setEx(key, ttl, val);

        const match = key.match(/^user:([^:]+):/);
        if (match) {
            const username = match[1];
            await redis.sAdd(`userCacheKeys:${username}`, key);
        }
    } catch (e) {
        console.error('Redis setCache error: ', e);
    }
}

export async function getCache(key) {
    try {
        const cached = await redis.get(key);
        if (!cached) return null;
        return JSON.parse(cached);
    } catch (e) {
        console.error('Redis getCache error: ', e);
        return null;
    }
}

export async function delCache(key) {
    try {
        await redis.del(key);
    } catch (e) {
        console.error('Redis delCache error: ', e);
    }
}

export async function invalidateUserCache(username) {
    try {
        const userKey = await redis.sMember(`userCacheKeys:${username}`);
        if (userKey.length > 0) {
            const pipeline = redis.pipeline();
            userKey.forEach(key => pipeline.del(key));
            pipeline.del(`userCacheKeys:${username}`);
            await pipeline.exec();
        }
    } catch (e) {
        console.error('Redis invalidateUserCache error: ', e);
    }
}