import * as http from 'http'
import * as querystring from 'querystring'
// import * as https from 'https'
import * as Koa from 'koa'
import * as bodyparser from 'koa-body'

const app = new Koa();
app.use(bodyparser({multipart:true}))

async function sendRequest({url, option, body}) {
  return new Promise((resolve, reject) => {
    let result = http.request(url, option, (res) => {
      let responseData = new Buffer(0)
      res.on('data', (chunk) => {
        console.log(`响应主体: ${chunk}`);
        responseData = Buffer.concat([responseData, chunk])
      });
      res.on('end', () => {
        console.log('响应中已无数据');
        resolve(responseData)
      });
    })
    result.write(body)
    result.end()
    result.on('error', (e) => {
      console.error(`请求遇到问题: ${e.message}`);
      reject(e)
    });
  })
  // console.log('testr', result)
}
// options请求处理
app.use(async (ctx, next) =>{
  if(ctx.method === 'OPTIONS') {
    ctx.status = 204
    ctx.set('Access-Control-Allow-Origin', `*`);
    ctx.set('Access-Control-Allow-Headers', `X-Requested-With, Content-Type, Accept, Authorization`);
    ctx.set('Access-Control-Allow-Methods', `GET,PUT,OPTIONS,DELETE,PATCH`);
    ctx.set('Access-Control-Max-Age', 3600);
    ctx.body = `sucess`
    return
  }
  await next();
})

app.use(async (ctx, next) => {
  await next();
  ctx.set('Access-Control-Allow-Origin', `${ctx.header.origin}`);
  console.log('http api', ctx.query.api)
  // const rt = ctx.response.get('X-Response-Time');
  // if(ctx.method === 'OPTIONS') {
  //   let allow = ctx.get('Allow');
  //   ctx.set('Allow', `${allow}, OPTIONS`);
  // }
  try {

    let result = await sendRequest({
      url: ctx.request.body.url,
      option: {
        method: ctx.request.body.method,
        headers: {
          'Content-Type': ctx.header['content-type']
        }
      },
      body: JSON.stringify(ctx.request.body.body)
    })
    console.log('sendRequest', result)
    ctx.body = result
  } catch(err) {
    console.log('err', err)
  }
  // console.log(`ctx - ${ctx}`);
  // http.request()
});
console.log('start redict')
http.createServer(app.callback()).listen(3001);