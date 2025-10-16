// Test Exa subpages feature with detailed logging
import Exa from "exa-js";

const exa = new Exa(process.env.EXA_API_KEY);

async function test() {
  console.log("Step 1: Search for directory pages...");
  const searchResults = await exa.search(
    "NY state caregiver support services directory",
    {
      type: "neural",
      numResults: 1,  // Just 1 page to test subpages
      category: "health"
    }
  );
  
  console.log("Found pages:", searchResults.results.map(r => r.url));
  
  console.log("\nStep 2: Get contents with subpages...");
  console.log("Requesting:", {
    urls: searchResults.results.map(r => r.url),
    subpages: 10,
    subpageTarget: ["services", "programs", "resources", "caregiver"]
  });
  
  const contents = await exa.getContents(
    searchResults.results.map(r => r.url),
    {
      text: { maxCharacters: 500 },
      subpages: 10,
      subpageTarget: ["services", "programs", "resources", "caregiver"]
    }
  );
  
  console.log("\n=== Full Response ===");
  console.log(JSON.stringify(contents, null, 2));
  
  console.log("\n=== Summary ===");
  console.log("Total results:", contents.results.length);
  console.log("URLs:");
  contents.results.forEach((result, i) => {
    console.log(`${i+1}. ${result.url}`);
    if (result.isSubpage) console.log("   ^ SUBPAGE!");
  });
}

test().catch(console.error);
