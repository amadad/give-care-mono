// Test Exa subpages feature
import Exa from "exa-js";

const exa = new Exa(process.env.EXA_API_KEY);

async function test() {
  console.log("Step 1: Search for directory pages...");
  const searchResults = await exa.search(
    "NY state caregiver support services directory",
    {
      type: "neural",
      numResults: 2,
      category: "health"
    }
  );
  
  console.log("Found pages:", searchResults.results.map(r => r.url));
  
  console.log("\nStep 2: Get contents with subpages...");
  const contents = await exa.getContents(
    searchResults.results.map(r => r.url),
    {
      text: { maxCharacters: 500 },
      subpages: 5,
      subpageTarget: ["services", "programs", "resources"]
    }
  );
  
  console.log("\nTotal results (should include main pages + subpages):", contents.results.length);
  contents.results.forEach((result, i) => {
    console.log(`${i+1}. ${result.url}`);
  });
}

test().catch(console.error);
