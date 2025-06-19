import { createServer } from "node:http";
import path from "node:path";
import fs from "node:fs";

const port = process.env.PORT || 8080;
const hostname = "127.0.0.1";
// replacement for ./ for current directory
const publicDir = path.join(process.cwd());

const httpServer = createServer((req, res) => {
  // 0. map route to filename
  const route = {
    "/": "index.html",
    "/about": "about.html",
    "/contact-me": "contact-me.html",
  };

  // 1. extract pathname
  const baseURL = `${req.protocol || "http"}://${req.headers.host}`;
  let parsedUrl;

  try {
    parsedUrl = new URL(req.url, baseURL);
  } catch (urlError) {
    console.error("Invalid URL requested:", req.url, urlError.message);
    res.writeHead(400, { "Content-Type": "text/plain" });
    return res.end("400 Bad Request");
  }

  // 2. decide what file to serve depending on the pathname
  const routeFileName = route[parsedUrl.pathname];
  const fileToServe = routeFileName
    ? path.join(publicDir, routeFileName)
    : null;

  // 3. serve file & handle err
  // function to servefile
  const serveFile = (filePath, statusCode = 200) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error(`ERROR: Could not read file '${filePath}':`, err);
        res.writeHead(500, { "Content-type": "text/plain" });
        return res.end("500 Internal Server Error: File not readable");
      }
      const contentType = getContentType(filePath);
      res.writeHead(statusCode, { "Content-type": contentType });
      return res.end(data);
    });
  };
  //determine what file to serve
  if (fileToServe) {
    fs.access(fileToServe, fs.constants.F_OK, (err) => {
      if (err) {
        // requested file exists in route map but not on disk (2nd 404 Case)
        console.log(
          `File not found on disk for route '${parsedUrl.pathname}': ${fileToServe}. Serving 404.`
        );
        serveFile(path.join(publicDir, "404.html"), 404);
      } else {
        serveFile(fileToServe, 200);
      }
    });
  } else {
    // No specific route matched (1st 404 Case)
    console.log(`No route matched for '${parsedUrl.pathname}'. Serving 404.`);
    serveFile(path.join(publicDir, "404.html"), 404);
  }
});

httpServer.listen(port, hostname, () => {
  console.log(`Listening in http://${hostname}:${port}`);
});

function getContentType(fileToServe) {
  let contentType = "text/plain"; // Default
  const ext = path.extname(fileToServe).toLowerCase();

  switch (ext) {
    case ".html":
      contentType = "text/html";
      break;
    case ".css":
      contentType = "text/css";
      break;
    case ".js":
      contentType = "application/javascript";
      break;
  }

  return contentType;
}
