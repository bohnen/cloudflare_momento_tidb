# Cloudflare Workers + TiDB Serverless 接続ワークショップ

このリポジトリでは、github codespacesを利用して、[Cloudflare Workers から TiDB Serverlessに接続する](https://zenn.dev/kameoncloud/articles/99d3ed9d5ce4fd) の内容をためすことが出来ます。

`wrangler init` を実施してソースコードを書き換え済みの状態となっています。下記の手順の通りに実施することで、
Cloudflare WorkersからTiDB Serverlessへの接続が実行できます。

自分で作りたい場合は、 `tidb-cloud-cloudflare` ディレクトリを削除して、`wrangler login`のステップを実行した後、
ブログの流れを追ってください。

## 1. wranglerを使ってcloudflareにログインする

`wrangler login` コマンドを使ってcloudflareにログインします。codespacesではOAuthを使ったログインを行いますが、
codespaces上ではコールバックを受け付けられないため、次のようなステップで実行します。

1. `wrangler login` コマンドを実行する。
  `Failed to open` というエラーが表示されますが、表示されたURLを使ってブラウザでアクセスします。
  cloudflareのサイトが開きますので、アクセスを許可します。
2. コールバックURL文字列を取得
  コールバックに失敗して、ブラウザでエラーになります。このとき表示されているURL文字列(`http://localhost:8976/...`)をコピーします。
3. ホスト名部分の書き換えと実行
  Visual Studioの`ポート`タブを開くと、「転送されたアドレス」という欄があると思います。このアドレスをコピーし、先のステップでコピーしたURL文字列の
  `http://locahost:8976` 部分を置き換えます。
  この新しいURLをブラウザから実行します。

これでログインは完了です。

## 2. 必要なライブラリをインストールする

```bash
cd tidb-cloud-cloudflare
npm install 
```

## 3. デプロイする

```bash
npx wrangler deploy
```

デプロイが完了したら、表示されたURLにアクセスすると、データベースの一覧が表示されます。

## 4. テーブルを作成する

`CREATE_TABLE.sql` に必要なDDLが含まれているので、TiDB ServerlessのChat2Queryで実行します。
また、codespacesにはSQL Tools拡張がインストールされているので、TiDBへの接続を作成してそこから実行しても構いません。

## 5. コードを修正して再度デプロイする

ソースコード中のコメントになっている部分のコメントを外して、再度デプロイします。
デプロイ後に表示されるURLにアクセスすると、テーブルの中身が表示されます。


