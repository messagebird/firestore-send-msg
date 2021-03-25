### See it in action

You can test out this extension right away!
Add a new document to the Firestore messages collection and we will deliver it for you:

1. Go to your [Cloud Firestore dashboard](https://console.firebase.google.com/project/${param:PROJECT_ID}/firestore/data) in the Firebase console.
1. Click **Start Collection** (the name of the collection should be the same as the one used in the extension configuration).
1. And add your first document:

```js
{
  channelId: 'YOUR_CHANNEL_ID',
  to: 'RECIPIENT_OF_THE_MESSAGE',
  type: 'text',
  content: {
    text: 'YOUR_MESSAGE_CONTENT'
  }
}
```

**Note:** Different documents can be delivered on different channels by changing the channel IDs. You can get the channel ID from your [Channels page](https://dashboard.messagebird.com/en/channels/)
To send a WhatsApp Template Message:

```js
{
  channelId: 'YOUR_WHATSAPP_CHANNEL_ID',
  to: 'RECIPIENT_OF_THE_MESSAGE(PHONE_NUMBER)',
  type: 'hsm',
  content: {
    hsm: {
      namespace: 'YOUR_NAMESPACE_ID',
      templateName: 'YOUR_TEMPLATE_NAME',
      language: {
        policy: 'deterministic', 
        code: 'YOUR_LANG_CODE', 
      },
      params: [
        { default: 'YOUR_PARAM' }
      ]
    }
  }
}
```

You can find full list of supported message types and required content fields in our [Conversations API docs](https://developers.messagebird.com/api/conversations/#send-message)

### Using the extension

When triggered by writing a new document to a specific Firestore collection, this extension will then automatically use MessageBird's Conversations API to deliver your message.
To learn more about how you can write data to Firestore collections read the [firestore documentation](https://firebase.google.com/docs/firestore/manage-data/add-data).

### Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
