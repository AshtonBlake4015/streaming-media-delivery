import { strict as assert } from "node:assert";
import { chooseDeliveryLane, deliveryRequest } from "./media_stream_service.js";

const audio = deliveryRequest.parse({ creatorId: "c1", assetName: "podcast", assetType: "audio", audience: "listeners" });
const video = deliveryRequest.parse({ creatorId: "c1", assetName: "trailer", assetType: "video", audience: "viewers" });
assert.equal(chooseDeliveryLane(audio), "audio");
assert.equal(chooseDeliveryLane(video), "visual");
assert.throws(() => deliveryRequest.parse({ creatorId: "", assetName: "x", assetType: "video", audience: "a" }));
console.log("delivery lane decision passes");
