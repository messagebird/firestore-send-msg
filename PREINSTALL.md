Use this extension to send omnichannel messages (SMS, WhatsApp, Google's Business Messages, Messenger, Telegram, Line, Viber, etc.) with [MessageBird](https://messagebird.com/).
When adding a document to a specific Firestore collection, this extension will use the MessageBird Conversations API to deliver convert that document to a message and it will update the document with the delivery status.

```js
 db.collection('YOUR_DOCUMENT_COLLECTION').add({
  channelId: 'YOUR_CHANNEL_ID',
  type: 'text',
  content: {
    text: 'YOUR_MESSAGE_CONTENT'
  },
  to: 'RECIPIENT_OF_THE_MESSAGE',
});
```

**Note:** You can find full list of supported message types and required content fields in the [Conversations API docs](https://developers.messagebird.com/api/conversations/#send-message).

#### Additional setup

Before installing this extension, set up the following Firebase services in your Firebase project:

- [Cloud Firestore](https://firebase.google.com/docs/firestore) to store message documents.
  - Follow the steps in the [documentation](https://firebase.google.com/docs/firestore/quickstart#create) to create a Cloud Firestore database.
You must have a [MessageBird account](https://messagebird.com/en/) and a [MessageBird API access key](https://support.messagebird.com/hc/en-us/articles/360001853998-Creating-access-keys) before installing this extension.
You will also need to create the appropriate channels (an SMS channel, a WhatsApp channel, a Facebook Messenger channel, a Telegram channel, etc.) that you'd like to use to send out messages as you will need to specify the channel when sending messages.

#### Step by step MessageBird account setup

- Create a MessageBird account on the [MessageBird page](https://dashboard.messagebird.com/en/sign-up?), and when asked, choose the "APIs" path
- Once your account is created, you can see your API key either on the [dashboard](https://dashboard.messagebird.com/) or in the [Developer settings](https://dashboard.messagebird.com/en/developers/access) page.

You can set up the channels you would like to use on the [Channels page](https://dashboard.messagebird.com/en/channels)
 - for SMS you will need to [acquire a sending number](https://support.messagebird.com/hc/en-us/articles/208011689-Buy-a-Virtual-Mobile-Number-VMN-)
 - for WhatsApp you will need to create a WhatsApp for Business Account by following the [WhatsApp installation wizard](https://dashboard.messagebird.com/en/onboarding/wa-api/install-whatsapp). You might also need to create an [WhatsApp message template](https://dashboard.messagebird.com/en/whatsapp-template-manager) if you want to send [out-of-session WhatsApp messages](https://support.messagebird.com/hc/en-us/articles/360004817257-What-is-the-difference-between-Message-Template-and-Template-Message-).
 - for other channels, follow the instructions on the [Channels page](https://dashboard.messagebird.com/en/channels)

**Note:** MessageBird also has a [test mode](https://support.messagebird.com/hc/en-us/articles/360000670709-What-is-the-difference-between-a-live-key-and-a-test-key-) that lets you make API calls without sending actual messages. You can use it for testing purposes to avoid extra cost during development.

#### Billing

This extension uses the following Firebase services which may have associated charges:

- Cloud Firestore
- Cloud Functions

This extension also uses the following third-party services:

- MessageBird Billing ([pricing information](https://www.messagebird.com/pricing))

You are responsible for any costs associated with your use of these services.

#### Note from Firebase

To install this extension, your Firebase project must be on the Blaze (pay-as-you-go) plan. You will only be charged for the resources you use. Most Firebase services offer a free tier for low-volume use. [Learn more about Firebase billing.](https://firebase.google.com/pricing)

You will be billed a small amount (typically less than $0.10) when you install or reconfigure this extension. See Cloud Functions under [Firebase Pricing](https://firebase.google.com/pricing) for a detailed explanation.
