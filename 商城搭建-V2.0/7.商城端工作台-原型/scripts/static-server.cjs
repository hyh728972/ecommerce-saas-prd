'use strict';

var http = require('http');
var fs = require('fs');
var path = require('path');
var net = require('net');
var childProcess = require('child_process');

var root = path.join(__dirname, '..');

/** @type {Object.<string, string>} */
var MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

/**
 * 检测本机端口是否可以监听（未被占用）。
 * @param {number} port 端口号
 * @returns {Promise<boolean>} 为 true 表示可用
 */
function isPortFree(port) {
  return new Promise(function (resolve, reject) {
    var server = net.createServer();
    server.once('error', function (err) {
      if (err && err.code === 'EADDRINUSE') resolve(false);
      else reject(err);
    });
    server.listen(port, '0.0.0.0', function () {
      server.close(function () {
        resolve(true);
      });
    });
  });
}

/**
 * 从起始端口起顺序查找第一个可用端口。
 * @param {number} startPort 起始端口
 * @param {number} maxAttempts 最多尝试次数
 * @returns {Promise<number>} 可用端口
 */
function findFreePort(startPort, maxAttempts) {
  return (async function () {
    var p;
    for (p = startPort; p < startPort + maxAttempts; p += 1) {
      if (await isPortFree(p)) return p;
    }
    throw new Error('未找到可用端口（' + startPort + '–' + (startPort + maxAttempts - 1) + '）');
  })();
}

/**
 * 将请求路径解析为安全、位于站点根目录内的绝对路径。
 * @param {string} urlPath 以 / 开头的 URL 路径
 * @returns {string|null} 合法则返回 fs 路径，否则 null
 */
function safeResolvedPath(urlPath) {
  var rel = urlPath.split('?')[0].replace(/^\/+/, '');
  var decoded = decodeURIComponent(rel);
  if (decoded.indexOf('..') !== -1) return null;
  var resolved = path.resolve(root, decoded);
  var rootNorm = path.resolve(root);
  if (resolved !== rootNorm && resolved.indexOf(rootNorm + path.sep) !== 0) return null;
  return resolved;
}

/**
 * 响应静态文件或目录下的 index.html。
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @returns {void}
 */
function onRequest(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
    return;
  }
  var urlPath = req.url || '/';
  var filePath = safeResolvedPath(urlPath);
  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }
  fs.stat(filePath, function (err, st) {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    if (st.isDirectory()) {
      var indexPath = path.join(filePath, 'index.html');
      fs.stat(indexPath, function (err2, st2) {
        if (err2 || !st2.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Not found');
          return;
        }
        sendFile(indexPath, req, res);
      });
      return;
    }
    sendFile(filePath, req, res);
  });
}

/**
 * 读取并输出文件内容。
 * @param {string} filePath
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @returns {void}
 */
function sendFile(filePath, req, res) {
  fs.readFile(filePath, function (err, buf) {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Server error');
      return;
    }
    var ext = path.extname(filePath).toLowerCase();
    var type = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': type,
      'Cache-Control': 'no-cache',
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    res.end(buf);
  });
}

/**
 * Windows 下尝试用默认浏览器打开本地 URL。
 * @param {string} url
 * @returns {void}
 */
function openBrowser(url) {
  if (process.platform !== 'win32') return;
  try {
    childProcess.exec('cmd /c start "" "' + url.replace(/"/g, '') + '"');
  } catch (e) {
    /* ignore */
  }
}

/**
 * 启动静态站点服务。
 * @returns {Promise<void>}
 */
function main() {
  var preferred = Number(process.env.PORT || 8780);
  return findFreePort(preferred, 40).then(function (port) {
    if (port !== preferred) {
      console.log('提示：端口 ' + preferred + ' 已被占用，已改用 ' + port);
    }
    var server = http.createServer(onRequest);
    server.on('error', function (err) {
      console.error(err);
      process.exit(1);
    });
    return new Promise(function (resolve) {
      server.listen(port, '0.0.0.0', function () {
        var host = '127.0.0.1';
        var url = 'http://' + host + ':' + port + '/';
        console.log('');
        console.log('  mall-prototype 已启动（纯 Node，无需 http-server）');
        console.log('  在浏览器打开: ' + url);
        console.log('  按 Ctrl+C 停止');
        console.log('');
        if (process.env.OPEN_BROWSER !== '0') {
          openBrowser(url);
        }
        resolve();
      });
    });
  });
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
