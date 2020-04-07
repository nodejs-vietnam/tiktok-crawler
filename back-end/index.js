const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const superagent = require('superagent');
const cheerio = require('cheerio');
const app = express();

app.use(bodyParser.json());
app.use(helmet())

const userAgentDefault = 'Mozilla/5.0 (Linux; U; Android 5.1.1; zh-cn; MI 4S Build/LMY47V) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.146 Mobile Safari/537.36 XiaoMi/MiuiBrowser/9.1.3';
const getPosts = ({
  sec_uid,
  signature,
  dytk,
  max_cursor
}) => `https://www.iesdouyin.com/web/api/v2/aweme/post/?sec_uid=${sec_uid}&count=21&max_cursor=${max_cursor}&aid=1128&_signature=${signature}&dytk=${dytk}`;

async function superagentT(url, cb) {
  const data = await superagent.get(url)
    .set('user-agent', userAgentDefault);
  return cb(data);
}

async function getAllVideo(url) {
  const obj = {};
  const urls = [];
  return await superagentT(url, urlAgent => {
    let temp1 = urlAgent.redirects[0].split('?')[0].split('/');
    obj['userId'] = temp1[temp1.length - 1];
    obj['sec_uid'] = urlAgent.redirects[0].split('&').find(x => x.slice(0, 7) === 'sec_uid').split('=')[1];
    const $ = cheerio.load(urlAgent.text, {
      xmlMode: true
    });
    let scriptDytk = Array.from($('script')).filter(b => b.attribs.type === "text/javascript").map(c => c.children[0].data).filter(x => x.match(/dytk/))[0];
    let scriptSplitDytk = scriptDytk.split('init({')[scriptDytk.split('init({').length - 1].split('});')[0].split(',')[scriptDytk.split('init({')[1].split('});')[0].split(',').length - 1].trim('');
    obj['dytk'] = scriptSplitDytk.trim('').split(':')[1].trim().replace(/[']/gi, '');
    return superagentT(`http://49.233.200.77:5001/sign/${obj.userId}/`, dataSignature => {
      obj['signature'] = dataSignature.body.signature;
      obj['userAgent'] = dataSignature.body['user-agent'];

      obj['has_more'] = true;
      obj['max_cursor'] = 0;
      return getMore(obj, urls);
    });

  })
}

function getMore(obj, callbackData) {
  return superagent.get(getPosts({
      ...obj
    }))
    .set('user-agent', obj['userAgent'])
    .then(data => {
      const parse = JSON.parse(data.text);
      if (parse.aweme_list.length !== 0) {
        const lstVideo = parse.aweme_list.map(item => item.video.play_addr.url_list[0]);
        lstVideo.forEach(v => callbackData.push(v))
      }
      obj['max_cursor'] = parse.max_cursor;
      obj['has_more'] = parse.has_more;
      return obj['has_more'] ? getMore(obj, callbackData) : callbackData;
    });
}

// app.get('/videos', (req, res) => {

// })



app.get('/', (req, res) => {
//   return res.send(generateSignature(60543483207));
})

app.get('/videos', async (req, res) => {
  const data = await getAllVideo(req.body.url).then(d => d);
  return res.send(data);
})

app.listen(3000, () => {
  console.log(`Server is running at port 3000`);
})