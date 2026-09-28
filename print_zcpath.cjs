const fs = require("fs");
const html = fs.readFileSync("zoho_page.html", "utf8");

const zcpathBlock = html.match(/function ZCPath\(config\)[\s\S]*?var booter = new ZCReportBoot/);
if (zcpathBlock) {
  console.log(zcpathBlock[0].substring(0, 1500));
}
