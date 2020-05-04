# `firestore-send-msg`

```
Here's a basic example document write that would trigger this extension:

admin.firestore().collection('messages').add({
	originator: "FunFacts",
  channelId: "asdfasdfsd123213",
  body: "Fun Fact of the day: Dolly Parton lost in a Dolly Parton look-alike contest",
  recipients: [
    "+3161234567",
  ],
})
```
