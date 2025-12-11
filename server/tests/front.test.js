// tests/front.test.js
import fs from "fs";
import path from "path";

test("index.html should contain login and register forms", () => {
  const htmlPath = path.join(process.cwd(), "..", "index.html");
  const html = fs.readFileSync(htmlPath, "utf8");

  expect(html).toMatch(/id="loginForm"/);
  expect(html).toMatch(/id="regForm"/);
});
