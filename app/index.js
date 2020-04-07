const superagent = require('superagent');
const {
  DownloaderHelper
} = require('node-downloader-helper');
const path = require('path');
const fs = require('fs');

const getByID = id => document.getElementById(id);

const elements = {
  inputLink: getByID('inputLink'),
  inputFolder: getByID('inputFolder'),
  download: getByID('download'),
  errorMessage: getByID('errorMessage')
}

elements.download.addEventListener('click', (e) => {
  const {
    inputLink,
    inputFolder,
    errorMessage
  } = elements;
  const baseUrl = 'localhost:3000/videos/';
  if (inputLink.value.trim() === '' || inputFolder.value.trim() === '' || inputLink.value.slice(0, 20) !== 'https://v.douyin.com') {
    errorMessage.classList.add('visible');
    return;
  }
  if (inputLink.value && inputFolder.value) {
    errorMessage.classList.remove('visible');
    return superagent.get(baseUrl)
      .send({
        "url": inputLink.value
      })
      .set('Content-Type', 'application/json')
      .then((res) => {
        return res.body.forEach(link => basicUrl(link, __dirname))
      })
      .then(() => alert('Giờ đợi video thôi, 5p nhá'));
  }
})


const basicUrl = (url, name = '12312111.mp4') => {
  fs.existsSync(path.join(__dirname, `/${elements.inputFolder.value}`)) || fs.mkdirSync(path.join(__dirname, `/${elements.inputFolder.value}`));
  return superagent.get(url)
    .set('user-agent', 'Mozilla/5.0 (Linux; U; Android 5.1.1; zh-cn; MI 4S Build/LMY47V) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.146 Mobile Safari/537.36 XiaoMi/MiuiBrowser/9.1.3')
    .then(response => response.redirects[0])
    .then(a => {
      const b = new DownloaderHelper(a, path.join(__dirname, `/${elements.inputFolder.value}`), {
        headers: {
          'user-agent': 'Mozilla/5.0 (Linux; U; Android 5.1.1; zh-cn; MI 4S Build/LMY47V) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.146 Mobile Safari/537.36 XiaoMi/MiuiBrowser/9.1.3'
        },
        fileName: name
      });
      b.on('end', () => {})
      b.start();
    });
}