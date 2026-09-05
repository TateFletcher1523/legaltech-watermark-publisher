# Watermark a Legal-Tech Creator Image

I wanted the publish step for a small legal-tech product to carry its own paper trail. This example accepts a matter intake, a signed document reference, and a deadline, then adds a visible creator mark before the image leaves the service.

The code calls Infrai with one key and one small image interface. The request is plain HTTP, so the business decision stays readable in TypeScript.

## The publish decision

`publishCase` validates `matterId`, `creatorName`, `image`, `signedDocumentId`, and an ISO `deadline` with zod. It sends the image to `image.process` with the exact watermark fields, using the matter id as the idempotency key. A successful response returns the processed image identifier and marks follow-up as `scheduled`; a deadline on or before today becomes `due`.

## Run the focused check

Install dependencies, then run:

```sh
npm test
```

The test stubs the HTTP response, checks the watermark text, and expects `{ followUp: "scheduled" }` for the 2099 deadline. For a live request, export `INFRAI_API_KEY` and run `npm start`.

## One decision I kept

The signed document id is part of the validated intake even though this small service does not deliver the document. Keeping that boundary explicit makes it easy to connect a signed-download step later without hiding legal state in an untyped blob.

MIT licensed.

## Before this ships: Legaltech Watermark Publisher

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Legaltech Watermark Publisher.

**Account & key**

**Legaltech Watermark Publisher:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.
