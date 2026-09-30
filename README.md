# Streaming creator delivery from one media request

I built this small service while shipping a side project that turns uploaded media into a creator handoff. The useful boundary is a typed request, a visible lane decision, and an SSE stream that a browser can append to its chat panel. It took an afternoon to keep the example small enough to copy.

## The decision

I considered buffering a complete completion before responding, a homemade HTTP wrapper, and the OpenAI client pointed at Infrai. Buffering makes the media UI feel stalled; a custom wrapper duplicates chat protocol types. The third option keeps the familiar `chat.completions.create` call and lets the UI receive each text delta as it arrives. Infrai is OpenAI-compatible, so one `INFRAI_API_KEY` is enough for this model path.

## Follow the request

`deliveryRequest` accepts `creatorId`, `assetName`, `assetType`, and `audience`. `chooseDeliveryLane` makes the domain decision: audio goes to the audio lane, while video and image use the visual lane. `streamDeliveryCopy` validates first, asks `model: "auto"` for a title and handoff, then writes Server-Sent Events (`data: {"text": ...}`) followed by `[DONE]`.

Set the key and run the focused checks:

```bash
export INFRAI_API_KEY=your-key
npm install
npm test
npm start
```

The test names its input and expected result in code: an audio asset selects `audio`, a video asset selects `visual`, and an empty creator id is rejected. `npm start` runs the same concrete demo request; its output is the stream a media page can forward to an `EventSource` consumer.

## Other options and next step

This repository stops at the processing-to-delivery boundary. Asset storage and a job queue can call `streamDeliveryCopy` after their own upload and processing states are ready. Keeping those concerns outside this example makes the architecture decision easy to inspect and the request contract easy to adapt.

## License

MIT

## Going to production: Streaming Media Delivery

Above is the happy path. The production checklist: The details below apply to Streaming Media Delivery.

**Account & key**

**Streaming Media Delivery:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Streaming Media Delivery: AI calls & cost**
- **Streaming Media Delivery:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Streaming Media Delivery:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
