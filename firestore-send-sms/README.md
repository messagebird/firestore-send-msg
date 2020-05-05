# Trigger SMS

**Description**: Sends an SMS based on the contents of a document written to a specified Cloud Firestore collection.



**Configuration Parameters:**

* Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

* MessageBird Access Key: A MessageBird's REST api access key

* SMS documents collection: What is the path to the collection that contains the documents used to build and send the SMSs?

* Default Originator: An originator is the name or number from which the message is sent. .  When you receive a text message, your phone always tells you something about where the SMS comes from, either it says: * The name of a company or product * A number from which it has been sent * If you saved the number in your phone contacts, your phone replaces the number with the contact name.

* Log level: Log level, can be one of "info"/"warn", default is "warn"



**Cloud Functions:**

* **processQueue:** Processes document changes in the specified Cloud Firestore collection, delivers SMSs, and updates the document with delivery status information.



**Access Required**:



This extension will operate with the following project IAM roles:

* datastore.user (Reason: Allows this extension to access Cloud Firestore to read and process added documents.)
