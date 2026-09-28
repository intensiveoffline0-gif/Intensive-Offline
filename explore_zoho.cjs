async function exploreZoho() {
  const privateLink = "CFJq3KyZ7QMmMa2a5tU0e8Artb5F9qTeU79eaWB4Te28b9DXGP60vg46uyJJVyRpOfxXG9MfpSUh2Gsq0RG9hbERxRORC2J4MWY0";
  const appLink = "intensive-offline";
  const viewLink = "Student_Profiles_AI_Studio";

  // Let's test various candidate endpoints on creatorapp.zohopublic.in:
  const testEndpoints = [
    // Zoho Creator v2 public report API
    `https://creatorapp.zohopublic.in/api/v2/nxtwave/${appLink}/report/${viewLink}?privatelink=${privateLink}`,
    `https://creatorapp.zohopublic.in/api/v2/nxtwave/${appLink}/report/${viewLink}?privatelink=${privateLink}&from=1&limit=200`,
    `https://creatorapp.zohopublic.in/api/v2/nxtwave/${appLink}/report/${viewLink}`,
    // Zoho Creator C5 view pagination endpoints
    `https://creatorapp.zohopublic.in/nxtwave/${appLink}/${viewLink}/record/viewMore/${privateLink}?from=1&to=100`,
    `https://creatorapp.zohopublic.in/nxtwave/${appLink}/view-perma/${viewLink}/CFJq3KyZ7QMmMa2a5tU0e8Artb5F9qTeU79eaWB4Te28b9DXGP60vg46uyJJVyRpOfxXG9MfpSUh2Gsq0RG9hbERxRORC2J4MWY0`,
    // Internal Zoho Creator report data call
    `https://creatorapp.zohopublic.in/nxtwave/${appLink}/report-perma/${viewLink}/${privateLink}/showRecords?fromIDX=1&toIDX=100`,
    `https://creatorapp.zohopublic.in/nxtwave/${appLink}/report-perma/${viewLink}/${privateLink}/records?fromIDX=1&toIDX=100`,
    `https://creatorapp.zohopublic.in/nxtwave/${appLink}/report-perma/${viewLink}/${privateLink}?fromIDX=1&toIDX=100`,
    // CSV export endpoints
    `https://creatorapp.zohopublic.in/nxtwave/${appLink}/report-perma/${viewLink}/csv/${privateLink}`,
    `https://creatorapp.zohopublic.in/nxtwave/${appLink}/export/${viewLink}/csv/${privateLink}`,
    `https://creatorapp.zohopublic.in/nxtwave/${appLink}/report-perma/${viewLink}/${privateLink}/download-csv`,
    `https://creatorapp.zohopublic.in/nxtwave/${appLink}/report-perma/${viewLink}/${privateLink}/export/csv`,
    `https://creatorapp.zohopublic.in/nxtwave/${appLink}/report-perma/${viewLink}/${privateLink}/export?format=csv`
  ];

  for (const ep of testEndpoints) {
    try {
      const res = await fetch(ep, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "*/*"
        },
        redirect: "manual"
      });
      console.log(`[${res.status}] ${ep.substring(0, 100)} -> Type: ${res.headers.get("content-type") || "none"}, Location: ${res.headers.get("location") || "none"}`);
      if (res.status === 200) {
        const text = await res.text();
        console.log(`   Sample: ${text.substring(0, 150).replace(/\n/g, " ")}`);
      }
    } catch (e) {
      console.log(`Error on ${ep.substring(0, 80)}:`, e.message);
    }
  }
}

exploreZoho();
