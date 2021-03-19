Use this extension to send a messages to different channels like WhatsApp, Telegram, SMS, etc

When triggered by write to specific firestore collection, this extension will then automatically use MessageBird API to deliver your message.

## Additional setup

Before installing this extension, set up the following Firebase services in your Firebase project:

- [Cloud Firestore](https://firebase.google.com/docs/firestore) to store invoice information and optionally invoice status.
  - Follow the steps in the [documentation](https://firebase.google.com/docs/firestore/quickstart#create) to create a Cloud Firestore database.

You must also have a MessageBird account and a [MessageBird API access key](https://support.messagebird.com/hc/en-us/articles/360001853998-Creating-access-keys) before installing this extension.

### To get api access key

1. Create MessageBird account on [MessageBird dashboard page](https://dashboard.messagebird.com/)
1. Get your API key on [Developer settings page](https://dashboard.messagebird.com/en/developers/access)
1. Setup channels that you plan to use on [Channels page](https://dashboard.messagebird.com/en/channels)

**Note:** MessageBird has a test mode that lets you make API calls without sending actual messages. You can use it for testing purposes to avoid paying extra cost during development.

## Billing

This extensions is using MessageBird API to deliver your messages,
so you might need to deposit funds there if you plan to use paid channels like SMS.

This extension uses other Firebase or Google Cloud Platform services which may have associated charges:

1. Cloud Functions
1. FireStore

When you use Firebase Extensions, you're only charged for the underlying resources that you use.
A paid-tier billing plan is only required if the extension uses a service that requires a paid-tier plan, for example calling to a Google Cloud Platform API or making outbound network requests to non-Google services. All Firebase services offer a free tier of usage. [Learn more about Firebase billing.](https://firebase.google.com/pricing)
