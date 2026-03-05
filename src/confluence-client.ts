import axios, { AxiosInstance } from 'axios';
import { Cache, RateLimiter, retryWithBackoff } from './utils/cache-and-rate-limit.js';
import type { JiraConfig } from './types/jira.js';

export class ConfluenceClient {
    private client: AxiosInstance;
    private config: JiraConfig;
    private cache: Cache;
    private rateLimiter: RateLimiter;

    constructor(config: JiraConfig) {
        this.config = config;
        this.cache = new Cache(5 * 60 * 1000); // 5 minutes TTL
        this.rateLimiter = new RateLimiter(10, 2); // 10 tokens, refill 2/second

        this.client = axios.create({
            baseURL: config.baseUrl,
            auth: {
                username: config.email,
                password: config.apiToken
            },
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 30000
        });
    }

    /**
     * Search Confluence using CQL
     */
    async search(cql: string, limit: number = 25) {
        const cacheKey = `conf_search:${cql}:${limit}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        await this.rateLimiter.consume();

        const result = await retryWithBackoff(async () => {
            const response = await this.client.get('/wiki/rest/api/content/search', {
                params: {
                    cql,
                    limit,
                    expand: 'space,metadata.labels,version'
                }
            });
            return response.data;
        });

        this.cache.set(cacheKey, result);
        return result;
    }

    /**
     * Get a page by ID
     */
    async getPage(pageId: string, expand: string = 'space,body.storage,version,metadata.labels') {
        const cacheKey = `conf_page:${pageId}:${expand}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        await this.rateLimiter.consume();

        const result = await retryWithBackoff(async () => {
            const response = await this.client.get(`/wiki/rest/api/content/${pageId}`, {
                params: { expand }
            });
            return response.data;
        });

        this.cache.set(cacheKey, result);
        return result;
    }

    /**
     * Create a new page
     */
    async createPage(params: {
        spaceKey: string;
        title: string;
        body: string;
        parentId?: string;
    }) {
        await this.rateLimiter.consume();

        const payload: any = {
            type: 'page',
            title: params.title,
            space: { key: params.spaceKey },
            body: {
                storage: {
                    value: params.body,
                    representation: 'storage'
                }
            }
        };

        if (params.parentId) {
            payload.ancestors = [{ id: params.parentId }];
        }

        const response = await this.client.post('/wiki/rest/api/content', payload);
        return response.data;
    }

    /**
     * Update an existing page
     */
    async updatePage(params: {
        pageId: string;
        title: string;
        body: string;
        versionNumber: number;
    }) {
        await this.rateLimiter.consume();

        const payload = {
            version: { number: params.versionNumber },
            title: params.title,
            type: 'page',
            body: {
                storage: {
                    value: params.body,
                    representation: 'storage'
                }
            }
        };

        const response = await this.client.put(`/wiki/rest/api/content/${params.pageId}`, payload);
        return response.data;
    }

    /**
     * Get full space details
     */
    async getSpace(spaceKey: string) {
        await this.rateLimiter.consume();
        const response = await this.client.get(`/wiki/rest/api/space/${spaceKey}`);
        return response.data;
    }

    /**
     * Get page URL for linking
     */
    getPageUrl(spacesUrlPath: string): string {
        return `${this.config.baseUrl}${spacesUrlPath}`;
    }
}
