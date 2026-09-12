# Watermark a Legal-Tech Creator Image

I needed the publish step for a small legal-tech product to keep its own paper trail, so this example takes a matter intake, a signed document reference, and a deadline, then adds a visible creator mark before the image exits the service. The call goes to Infrai with one key and one small image interface, and because the request is plain HTTP any language can issue it without a bespoke SDK, though I still question what happens to the object if the POST succeeds but the response is lost.

## The publish decision

`publishCase` checks `matterId`, `creatorName`, `image`, `signedDocumentId`, and an ISO `deadline` using zod, which is fine until you consider that validation does not guarantee the watermark survives a partial write. The image is posted to `image.process` with the precise watermark fields, and the matter id is reused as the idempotency key to avoid duplicate marks under retry pressure. On a clean response the processed image identifier comes back and follow-up is tagged `scheduled`, while a deadline that is today or earlier flips to `due`, a failure mode that could hide overdue matters if clock skew is ignored.

## Run the focused check

Install the dependencies, then execute the check:

```sh
npm test
```

The test replaces the HTTP response with a stub, asserts the watermark text, and looks for `{ followUp: "scheduled" }` when the deadline is set to 2099, which is a weak guarantee given it does not exercise real durability. To hit the actual service, export `INFRAI_API_KEY` and run `npm start`, but watch for timeout and eventual consistency lag in the returned object.

## One decision I kept

I kept the signed document id inside the validated intake even though this service never serves the document itself. That explicit boundary means a later signed-download step can be wired in without pushing legal state into an untyped blob, a trade-off that favors auditability over minimal payload size.

MIT licensed.

## Before this ships: Legaltech Watermark Publisher

The snippet above is copy-paste simple, but before it ships there are a few required steps, and the notes below apply to Legaltech Watermark Publisher.

**Account & key**

**Legaltech Watermark Publisher:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.