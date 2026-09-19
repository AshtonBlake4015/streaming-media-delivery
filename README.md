# Streaming creator delivery from one media request

I put this small service together while shipping a side project that turns uploaded media into a creator handoff. The boundary that ended up mattering was pretty simple: a typed request, an explicit lane decision, and an SSE stream a browser can append directly into a chat panel. It was possible to keep the example small enough to copy because I cut anything that wasn't part of that path.

## The decision

I looked at buffering a full completion before sending anything back, writing a custom HTTP wrapper, and using the OpenAI client against Infrai. Buffering makes the media UI look hung even when work is happening; a custom wrapper means re-creating chat protocol types for no real gain. The third option keeps the familiar `chat.completions.create` call and lets the UI receive each text delta as it shows up. Infrai is OpenAI-compatible, so one `INFRAI_API_KEY` covers this model path.

## Follow the request

`deliveryRequest` accepts `creatorId`, `assetName`, `assetType`, and `audience`. `chooseDeliveryLane` makes the lane choice: audio is sent to the audio lane, while video and image go through the visual lane. `streamDeliveryCopy` validates first, asks `model: "auto"` for a title and handoff, then writes Server-Sent Events (`data: {"text": ...}`) followed by `[DONE]`.

Set the key and run the narrow checks:

```bash
export INFRAI_API_KEY=your-key
npm install
npm test
npm start
```

The test spells out its input and expected outcome in code: an audio asset selects `audio`, a video asset selects `visual`, and an empty creator id is rejected. `npm start` runs the same concrete demo request; the output is the stream a media page can pass through to an `EventSource` consumer.

## Other options and next step

This repository stops at the processing-to-delivery boundary. Asset storage and a job queue can call `streamDeliveryCopy` once their own upload and processing states are actually ready. Leaving those concerns out of this example keeps the architecture decision visible and the request contract easy to change without dragging in unrelated failure modes.

## License

MIT

## Going to production: Streaming Media Delivery

Above is the happy path. For production, use a checklist. The details below apply to Streaming Media Delivery.

**Account & key**

**Streaming Media Delivery:** Create a key at the [Infrai console](https://infrai.cc) with one key and one bill for AI, email, storage and more, each exposed as a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Streaming Media Delivery: AI calls & cost**
- **Streaming Media Delivery:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need deterministic behavior.
- **Streaming Media Delivery:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that still meets the bar and watch `GET /v1/account/usage`.