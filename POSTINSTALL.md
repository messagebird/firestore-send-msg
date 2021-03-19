# Post-installation configuration

Before you can use this extension, follow these steps to set required parameters:

1. Go to the Extensions dashboard for your project in the [Google Cloud console](https://console.firebase.google.com/project/${PROJECT_ID}/extensions).
1. Click Manage Extension.
1. On the "Extension Configuration" please click "Reconfigure Extension".
1. Set your "MessageBird Access Key" that you can get [here](https://dashboard.messagebird.com/en/developers/access).
1. Set your "Collection Name" that you plan to use for writing messages or leave it with default name.
1. Click **Save**.

## See it in action

You can test out this extension right away!

Add new document to FireStore messages collection and we will deliver it for you:

1. Go to Database for your project in the [Google Cloud console](https://console.firebase.google.com/project/${PROJECT_ID}/database/).
1. Click Start Collection.
1. And add first document:

```json
{
  channelId: 'YOUR_CHANNEL_ID',
  type: 'text',
  content: {
    text: 'YOUR_MESSAGE_CONTENT'
  },
  to: 'RECIPIENT_OF_THE_MESSAGE',
}
```

## Using the extension

When triggered by write to specific firestore collection, this extension will then automatically use MessageBird API to deliver your message.

To learn more about how you can write data to Firestore collections read [firestore documentation](https://firebase.google.com/docs/firestore/manage-data/add-data).

```typescript
 db.collection('msg').add({
  channelId: 'YOUR_CHANNEL_ID',
  type: 'text',
  content: {
    text: 'YOUR_MESSAGE_CONTENT'
  },
  to: 'RECIPIENT_OF_THE_MESSAGE',
});
```

## Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
