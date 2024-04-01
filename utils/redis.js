import { createClient } from 'redis';

class RedisClient {
    constructor() {
        this.client = createClient();
        this.client.connect().catch(error => {
            console.log(`Redis client not connected to the server: ${error.message}`);
        });

        this.client.on('connect', () => {
            console.log('Redis client connected to the server');
        });

        this.client.on('error', (error) => {
            console.log(`Redis client not connected to the server: ${error}`);
        });
    }

    isAlive() {
        return this.client.isOpen;
    }

    async get(key) {
        return await this.client.get(key);
    }

    async set(key, value, duration) {
        await this.client.set(key, value, { EX: duration });
    }

    async del(key) {
        await this.client.del(key);
    }
}


const redisClient = new RedisClient();
export default redisClient;
