// Test Exa with livecrawl: always
import Exa from "exa-js";

const exa = new Exa(process.env.EXA_API_KEY);

async function test() {
  console.log("Testing with livecrawl: always...\n");
  
  const contents = await exa.getContents(
    ["https://nyconnects.ny.gov/"],
    {
      text: { maxCharacters: 500 },
      subpages: 10,
      subpageTarget: ["services", "programs", "resources", "caregiver"],
      livecrawl: "always"
    }
  );
  
  console.log("Main pages:", contents.results.length);
  contents.results.forEach((result, i) => {
    console.log(`\n${i+1}. Main page: ${result.url}`);
    const subpageCount = result.subpages ? result.subpages.length : 0;
    console.log(`   Subpages found: ${subpageCount}`);
    if (result.subpages && result.subpages.length > 0) {
      result.subpages.forEach((sub, j) => {
        console.log(`   ${j+1}. ${sub.url}`);
      });
    }
  });
}

test().catch(console.error);
