import assert from "node:assert/strict";
import { publishCase } from "./publish_case.js";

const originalFetch = globalThis.fetch;
globalThis.fetch = async (_input, init) => {
  const body = JSON.parse(String(init?.body));
  assert.equal(body.image, "source-img");
  assert.deepEqual(body.ops, [{type: "watermark", text: "© Ava Chen | matter-42", position: "bottom_right", opacity: 0.65}]);
  assert.equal(body.idempotency_key, "matter-42");
  return new Response(JSON.stringify({ok:true, data:{image:"watermarked-img"}, metadata:{}}), {status:200});
};

const result = await publishCase({matterId:"matter-42", creatorName:"Ava Chen", image:"source-img", signedDocumentId:"doc-9", deadline:"2099-12-31"});
assert.deepEqual(result, {matterId:"matter-42", watermarkedImage:"watermarked-img", followUp:"scheduled"});
globalThis.fetch = originalFetch;
console.log("publish decision test passed");
