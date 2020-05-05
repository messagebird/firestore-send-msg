# Trigger Omnichannel Message

**Description**: Sends Omnichannel message based on the contents of a document written to a specified Cloud Firestore collection.



**Configuration Parameters:**

* Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

* MessageBird Access Key: A MessageBird's REST api access key

* Collection name that will be used to store messages that should be sent: What is the path to the collection that contains the documents used to build and send the messages?

* Log level: Log level, can be one of "info"/"warn", default is "warn"



**Cloud Functions:**

* **processQueue:** Processes document changes in the specified Cloud Firestore collection, delivers messages, and updates the document with delivery status information.



**Access Required**:



This extension will operate with the following project IAM roles:

* datastore.user (Reason: Allows this extension to access Cloud Firestore to read and process added documents.)
