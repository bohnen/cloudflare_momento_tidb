import { connect } from '@tidbcloud/serverless';

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
			console.log(`failed to retrieve item from cache: ${cacheName}`)
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
			console.log(`failed to set item into cache message: ${resp.statusText} status: ${resp.status} cache: ${cacheName}`);
		}
		return;
	}
}

export interface Env {
	DATABASE_URL: string;
 }

export interface Env {
	MOMENTO_AUTH_TOKEN: string;
	MOMENTO_REST_ENDPOINT: string;
	MOMENTO_CACHE_NAME: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const conn = connect({url:env.DATABASE_URL})
		const resp = await conn.execute("show databases")
		console.log(JSON.stringify(resp));

		const client = new MomentoFetcher(env.MOMENTO_AUTH_TOKEN, env.MOMENTO_REST_ENDPOINT);
		const cache = env.MOMENTO_CACHE_NAME;

		const url = new URL(request.url);
		const params = new URLSearchParams(url.search);

		const value = params.get('value');
		const key = params.get('key');
		let rest = params.get('opt');

		if (rest == 'POST') {
			// setting a value into cache
			/* TiDB Serverless へのSELECTを実行。
			値があった場合、Updateを実行
			値がない場合、Insertを実行
			*/
			const setResp = await client.set(cache, key, value);
		} else if (rest == 'GET') {
			// getting a value from cache
			const getResp = await client.get(cache, key)
			if (getResp.includes('404')) {
				console.log("key was not found");
				rest = "key was not found at both DB/Cache";
				/*
				TiDB ServerlessへのSELECTを挿入
				*/
				/*
				値があった場合、Cache Getを実行してリターン
				値がない場合、NULLをリターン
				*/
			}
			else {
				console.log(getResp);
				rest = getResp;
			}
		} else {
			rest = "operation error";
		}
		return new Response(JSON.stringify(resp));
	},
};
