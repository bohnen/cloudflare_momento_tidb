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
		const conn = connect({ url: env.DATABASE_URL });

		const client = new MomentoFetcher(env.MOMENTO_AUTH_TOKEN, env.MOMENTO_REST_ENDPOINT);
		const cache = env.MOMENTO_CACHE_NAME;

		const url = new URL(request.url);
		const params = new URLSearchParams(url.search);

		const value = params.get('value');
		const key = params.get('key');
		let rest = params.get('opt');
		let result;

		if (rest == 'POST') {
			/* TiDB Serverless へのSELECTを実行。*/
			let sql = "select * from `bookshop`.`users` where nickname ='" + key + "';";
			let dbresp = await conn.execute(sql);
			result = JSON.stringify(dbresp);

			if (result.includes(key)) {
				/* 値があった場合、Updateを実行 */
				sql = "update bookshop.users set balance = '" + value + "' where nickname = '" + key + "';";
				console.log(sql);
				dbresp = await conn.execute(sql);
				result = "executed sql:" + sql;
			}
			else {
				/* 値がない場合、Insertを実行 */
				sql = "insert into bookshop.users (id,nickname,balance) values (" + value + ",'" + key + "'," + value + ");";
				console.log(sql)
				dbresp = await conn.execute(sql);
				result = "executed sql:" + sql;
			};
			/*DB処理が終わったらCacheを更新*/
			const setResp = await client.set(cache, key, value);

		} else if (rest == 'GET') {
			const getResp = await client.get(cache, key)
			let sql;
			if (getResp.includes('404')) { /* cache missの場合
				console.log("key was not found");
				/*
				TiDB ServerlessへのSELECTを挿入
				*/
				sql = "select * from bookshop.users where nickname = '" + key + "';";
				console.log(sql);
				let dbresp = await conn.execute(sql);
				console.log(dbresp)
				/*
				値があった場合、Cache Setを実行してリターン
				値がない場合、NULLをリターン
				*/
				if (dbresp.length !== 0) {
					await client.set(cache, key, value);
					result = sql + ": cache set"
				} else {
					result = sql + ":cache miss";
				}
			}
			else { /* cache hitの場合 */
				console.log(getResp);
				result = "Cache Hit; value is " + getResp;
			}
		} else {
			result = "operation error";
		}
		return new Response(JSON.stringify(result));
	},
};
