# Firestore Send SMS

```
Here's a basic example document write that would trigger this extension:

admin.firestore().collection('messages').add({
	originator: "FunFacts",
        body: "Fun Fact of the day: Dolly Parton lost in a Dolly Parton look-alike contest",
        recipients: [
        	"+3161234567",
        ],
})
```
