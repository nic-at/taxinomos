# Taxinomos
*Taxinomos* is a Chrome Extension designed to be the front-end for the classification of domains. 
By communicating with a REST Server, it let's the user fetch and then classify domains.
The REST Server API specification that is expected by the extension can be found under **/docs/REST_server_specification.md**.
<br><br>
This document includes three sections:
1. [Getting Taxinomos](#getting-taxinomos)
2. [Configuring Taxinomos](#configuring-taxinomos)
3. [Other](#other)

<br>
## Getting Taxinomos

Currently, there are three ways to add the Taxinomos Extension to your Chrome browser:
1. Adding it through the Chrome Web Store
2. Build it from it's Github repository
3. Add it manually via a Chrome Extension (.crx) file
<br><br>

### Way 1: Adding *Taxinomos* through the Chrome Web Store
To add the Plugin to Chrome through the Chrome Web Store perform the following steps:

 1. Open https://chrome.google.com/webstore/detail/taxinomos/jfohlnahaeiaoahaggjehcfalnkojiik
 2. Click **ADD TO CHROME** in the top right corner.

**NOTE:** This is the **recommended way** if you simply want to use Taxinomos.
<br><br>

### Way 2: Building *Taxinomos* from it's Github repository
To build *Taxinomos* from it's Github repository you have to perform the following steps:

1. Download the Github repository to your machine
2. Open Google Chrome and go to the **extensions page**:
   * Either enter chrome://extensions into the address bar
   * Or open the menu in the right upper corner --> Settings --> Extensions
3. Enable the **Developer mode** checkbox
4. Now click the **Load unpacked extension...** button. This will open a dialog, which allows you to select a file.
5. Select **/pathToDownloadedGitRepo/taxinomos/src** and press **OK**.

The Plugin icon should appear in the upper right corner extensions bar.
<br><br>

### Way 3: Adding *Taxinomos* via .crx file manually
To add the Plugin to Chrome via .crx file you have to perform the following steps:

1. Open Google Chrome and go to the **extensions page** as described above
2. Drag and drop the .crx file into the extension page --> Now Chrome should ask you if you want to add the extension.

The Plugin icon should appear in the upper right corner extensions bar.<br>
You can get the .crx file either by copying taxinomos.crx from **/dist** or by building your own (**see next section!**).
<br><br>

### Pack the unpacked Taxinomos extension into a .crx file

First you will have to **download** Taxinomos from it's **Github repository**.

To pack Taxinomos into a .crx file you have to perform the following steps:

1. Open Chrome and go to the **extensions page** as described above
2. The **developer mode** checkbox should be enabled. If that is not the case enable it.
3. Now click the button **Pack extensions...** This will open a dialog, which allows you to select a file.
4. Select **/pathToDownloadedGitRepo/taxinomos/src** and press **OK**

Now you should be prompted to download a .crx and a .pem file. Keep the .pem file in a safe place as you will need it
to update the extension.

<br><br><br>
## Configuring *Taxinomos*
Before *Taxinomos* is ready for use, a simple configuration has to be done: Upon the initial start-up of *Taxinomos* you will find yourself at the **Credentials** form, which prompts you to:
1.  Provide a valid **REST-Server address**:<br>
	The specification for an expected REST-Server can be found at **/docs/REST_server_specification.md**.
	<br> 


2.  Provide a **Bearer-Token** that is accepted by the specified REST-Server:<br>
	**NOTE**: The Bearer-Token begins with "Bearer ".

Upon proceeding, you will be navigated to the **Languages** form, which shows Chrome's detected UI language. This language will be used as a working language for the Plug-in. If you want to change this language you have to enter **Chrome's settings page** and change the current language.<br>
On the Languages form you will also be asked to add any language that you are able to comprehend.<br><br>

When you are done, the Plug-in will start to load categories and other data from the server. This data will then be **cached within the Plug-in**. Using a reasonable internet connection and server infrastructure, this process should take only **a few seconds**. There will be a **time out after 20 seconds**, resulting in an error message.<br>
On loading this data successfully, the **configuration process is finished** and *Taxinomos* will be ready for use.

<br><br><br>
## Other

### *Postman*
The Chrome App *Postman* (https://chrome.google.com/webstore/detail/postman/fhbjgbiflinjbdggehcddcbncdddomop) lets you perform REST-Server calls manually. It has been extremely helpful in creating *Taxinomos* and might also prove to be a helpful tool in implementing the REST-Server, that is required for *Taxinomos*.