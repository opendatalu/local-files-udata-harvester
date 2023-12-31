# local-files-udata-harvester
an harvester for local files.

This harvester will download files from a local folder and upload them as the resources of a dataset on an udata instance.

## Configuration

Copy the `.env.example` file into a file named `.env`. Adjust the following variales to your needs:

- odpURL: URL of the udata instance
- odpAPIKey: API key needed to access the udata API
- odpDatasetId: ID of the dataset where the files will be uploaded
- callRateNrCalls: this setting and the following are related to rate limiting. This is the max number of calls per period. By default 1.
- callRateDuration: this setting defines the duration of the period for rate limiting in milliseconds. By default 1000ms.
- docRoot: absolute path to the folder to be synced
- nameRegex: Optional. Define a regex to filter the filenames you want to be synced.
- mimeType: MIME type of the files which are synced.
- overwrite: true if the existing files should be overwritten
- debug: true to write normal log messages to the log file

## Proxy
If your network connection depends on a proxy, you must set the `https_proxy` environment variable. 
Example: `export https_proxy="http://myproxy:8080"`

## Run

You can launch the synchronization with the command `npm run main`. 
The script named `run-win.sh` launches the synchronization on Windows and creates a log file. Bash.exe is needed, it can be found in [git for Windows](https://git-scm.com/download/win). 

## License
This software is (c) [Information and press service](https://sip.gouvernement.lu/en.html) of the luxembourgish government and licensed under the MIT license.
