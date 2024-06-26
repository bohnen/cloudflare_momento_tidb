/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run start` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

class MomentoFetcher {
	private readonly apiToken: string;
	private readonly baseurl: string;
	constructor(token: string, endpoint: string) {
		this.apiToken = token;
		this.baseurl = `${endpoint}/cache`;
	}

	async get(cacheName: string, key: string) {
		const resp = await fetch(`${this.baseurl}/${cacheName}?key=${key}&token=${this.apiToken}`);
		if (resp.status < 300) {
			console.log(`successfully retrieved ${key} from cache`)
		} else {
			throw new Error(`failed to retrieve item from cache: ${cacheName}`)
		}

		return await resp.text();
	}

	async set(cacheName: string, key: string, value: string, ttl_seconds: number = 30) {
		const resp = await fetch(`${this.baseurl}/${cacheName}?key=${key}&token=${this.apiToken}&&ttl_seconds=${ttl_seconds}`, {
			method: 'PUT',
			body: value
		});

		if (resp.status < 300) {
			console.log(`successfully set ${key} into cache`);
		} else {
			throw new Error(`failed to set item into cache message: ${resp.statusText} status: ${resp.status} cache: ${cacheName}`);
		}

		return;
	}

	async delete(cacheName: string, key: string) {
		const resp = await fetch(`${this.baseurl}/${cacheName}?key=${key}&token=${this.apiToken}`, {
			method: 'DELETE',
		});
		if (resp.status < 300) {
			console.log(`successfully deleted ${key} from cache`);
		} else {
			throw new Error(`failed to delete ${key} from cache. Message: ${resp.statusText}; Status: ${resp.status} cache: ${cacheName}`);
		}

		return resp;
	}
}

export interface Env {
	MOMENTO_AUTH_TOKEN: string;
	MOMENTO_REST_ENDPOINT: string;
	MOMENTO_CACHE_NAME: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const client = new MomentoFetcher(env.MOMENTO_AUTH_TOKEN, env.MOMENTO_REST_ENDPOINT);
		const cache = env.MOMENTO_CACHE_NAME;

		const url = new URL(request.url);
		const params = new URLSearchParams(url.search);

		const makeRandomString = (length: number) => Math.random().toString(36).substring(2, length + 2);
		const key = makeRandomString(10);
		console.log(key);
		const value = params.get('value') || '';
		console.log(value);

		// setting a value into cache
		const setResp = await client.set(cache, key, value);
		console.log("setResp", setResp);

		// getting a value from cache
		const getResp = await client.get(cache, key)
		console.log("getResp", getResp);

		//const deleteResp = await client.delete(cache, key);
		//console.log("deleteResp", deleteResp);

		// deleting a value from cache
		return new Response(key);
	},
};
