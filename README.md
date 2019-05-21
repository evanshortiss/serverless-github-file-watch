# Serverless GitHub File Watcher

A serverless function that will determine, and optionally send an email
notification, if a file on the master branch of a Git repository on GitHub
has been updated recently.

## How it works

The serverless function is invoked at midnight each night to check if the file
specified in the `FILE_URL` environment variable has changed.

1. Deploy to your cloud of choice using `serverless` (the repo includes a
`serverless.yml` template)
2. Configure target repository, watch frequency, and email
3. Get notified of changes that occur between each invocation via email

### Deployment

For deployment configurations, update the `serverless.yml`. Deploy using the
scripts in `package.json` via `npm run`. Use `npm run deploy` for the initial
deployment, and `npm run update` to deploy code changes in `handler.js`.

By default AWS is the target. You'll need to configure credentials following
instructions [here](https://serverless.com/framework/docs/providers/aws/guide/credentials/). 
Make sure to update the `profile` in `serverless.yml` once finished.

The main fields in the `serverless.yml` you'll probably want to update are:

* schedule - Uses crontab to set a schedule. If you change this read about the `TIME_PERIOD` configuration in the next section.
* region - Defaults to North California

### Configuration

Most configuration is performed via environment variables. You can set these
using the web UI or CLI tools for your chosen cloud host. In AWS this is done
via the Lambda *Configuration* screen for your function.

* TIME_PERIOD - This should be the time between invocations. For example, if you invoke the function every hour, set this to "1 hour". It defaults to "24 hours" to match the default crontab of `0 0 * * ? *`.
* FILE_URL - The file to watch. For example [https://github.com/evanshortiss/env-var/blob/master/env-var.js](https://github.com/evanshortiss/env-var/blob/master/env-var.js).
* SENDGRID_API_KEY - Your API key for SendGrid.
* SENDGRID_SENDER - The email that should be displayed as the sender.
* SENDGRID_RECIPIENT - Single recipient email address.
* SENDGRID_RECIPIENTS - Comma separated list of multiple recipients. This is ignored if `SENDGRID_RECIPIENT` is set.
