var http = require('http'),
  querystring = require('querystring'),
  fs = require('fs'),
  path = require('path'),
  url = require('url');

var directory = './documents';
var invalidFileRegex = /^[.\/\\]|\.\./;

var server = http.createServer(function(req, res) {
  if (req.method === "POST") {
    handlePost(req, res);
    return;
  }


  var query = url.parse(req.url, true).query;
  if (query.file) {
    writeFile(req, res, query);
    return;
  }
  writeIndex(req, res);
});

function writeIndex(req, res) {
  res.writeHead(200, {
    'Content-type': 'text/html'
  });

  fs.readdir(directory, function(err, files) {
    if (err) {
      res.end(err);
      return;
    }

    var fileListHtml = "";
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      fileListHtml += `<li><a href = "?file=${file}">${file}</a></li>`;
    }

    res.end(
      `
      <ul>
        ${fileListHtml}
      </ul>
      <form method="POST">
          <input type="text" name="file" />
          <textarea name="text"></textarea>
          <input type="submit" />
      </form>
    `
    );
  });
}

function writeFile(req, res, query) {
  if (invalidFileRegex.test(query.file)) {
    writeText(res, 400, "Error: Invalid file name");
    return;
  }

  var filename = path.join(directory, query.file);
  fs.readFile(filename, function(err, buffer) {
    if (err) {
      writeText(res, 400, err)
    }
    writeText(res, 200, buffer.toString());
  });
}

function handlePost(req, res) {
  var body = "";
  req.on("data", function(data) {
    body += data;
  });

  req.on("end", function() {
    var form = querystring.parse(body);

    if (!form.file || invalidFileRegex.test(form.file)) {
      writeText(res, 400, "Error: Invalid Path");
      return;
    }

    try {
      fs.writeFileSync(path.join(directory, form.file), form.text);
      writeIndex(req, res);
    } catch (e) {
      writeText(res, 400, "Error: Could not save file.");
      console.log(e);
    }
  });
}

function writeText(res, status, text) {
  res.writeHead(status, {
    "Content-Type": "text/plain"
  });
  res.end(text);
}

server.listen(3000);
console.log('Server is running on port 3000');
