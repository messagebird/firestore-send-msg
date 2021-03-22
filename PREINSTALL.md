Use this extension to send notifications and messages on SMS and social channels (WhatsApp, Telegram, Line, Viber, etc.)

When triggered, by adding a document to a specific Firestore collection, this extension will automatically use the MessageBird Conversations API to deliver your message.

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

## Additional setup

Before installing this extension, set up the following Firebase services in your Firebase project:

- [Cloud Firestore](https://firebase.google.com/docs/firestore) to store message documents.
  - Follow the steps in the [documentation](https://firebase.google.com/docs/firestore/quickstart#create) to create a Cloud Firestore database.

You must have a [MessageBird account](https://messagebird.com/en/) and a [MessageBird API access key](https://support.messagebird.com/hc/en-us/articles/360001853998-Creating-access-keys) before installing this extension.

You will also need to create the appropriate channels (an SMS channel, a WhatsApp channel, a Facebook Messenger channel, a Telegram channel, etc.) that you'd like to use to send out messages as you will need to specify the channel when sending messages.

### Step by step MessageBird account setup

- Create a MessageBird account on the [MessageBird page](https://messagebird.com/en/), and when asked, choose the "I am an API user" path
- Once the account is created, you will see your API key either on the [dashboard](https://dashboard.messagebird.com/) or on the [Developer settings](https://dashboard.messagebird.com/en/developers/access) page.
- You can set up the channels you would like to use on the [Channels page](https://dashboard.messagebird.com/en/channels)
  - for SMS you will need to [acquire a sending number](https://support.messagebird.com/hc/en-us/articles/208011689-Buy-a-Virtual-Mobile-Number-VMN-)
  - for WhatsApp you will need to create a WhatsApp for business account by following the [WhatsApp installation wizard](https://dashboard.messagebird.com/en/onboarding/wa-api/install-whatsapp). You might also need to create an [WhatsApp message template](https://dashboard.messagebird.com/en/whatsapp-template-manager/) if you want to send [out-of-session WhatsApp messages](https://support.messagebird.com/hc/en-us/articles/360004817257-What-is-the-difference-between-Message-Template-and-Template-Message-).
  - for other channels, follow the instructions on the [Channels page](https://dashboard.messagebird.com/en/channels)

**Note:** MessageBird also has a [test mode](https://support.messagebird.com/hc/en-us/articles/360000670709-What-is-the-difference-between-a-live-key-and-a-test-key-) that lets you make API calls without sending actual messages. You can use it for testing purposes to avoid extra cost during development.

## Billing

This extensions is using the MessageBird Conversation API to deliver your messages, so [transactional fees](https://messagebird.com/en/pricing/api) will be applied once the test credits run out.

This extension also uses other Firebase or Google Cloud Platform services which may have associated charges:

1. Cloud Functions
2. FireStore

When you use Firebase Extensions, you're only charged for the underlying resources that you use.
A paid-tier billing plan is only required if the extension uses a service that requires a paid-tier plan, for example calling to a Google Cloud Platform API or making outbound network requests to non-Google services. All Firebase services offer a free tier of usage. [Learn more about Firebase billing.](https://firebase.google.com/pricing)
