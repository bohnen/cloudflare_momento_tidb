import { connect } from '@tidbcloud/serverless'


export interface Env {
   DATABASE_URL: string;
}

export default {
   async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
      const conn = connect({url:env.DATABASE_URL})
      const resp = await conn.execute("show databases")
      /* テーブル作成後、下記部分のコメントを解除して再デプロイ */
      // const resp = await conn.execute("select * from `bookshop`.`users`;")
      return new Response(JSON.stringify(resp));
   },
};