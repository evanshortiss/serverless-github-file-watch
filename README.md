# Stateless GitHub File Watcher

[![Docker Repository on Quay](https://quay.io/repository/evanshortiss/stateless-github-file-watch/status "Docker Repository on Quay")](https://quay.io/repository/evanshortiss/stateless-github-file-watch)

A serverless/stateless function that will determine if a file on the master
branch of a Git repository on GitHub has been updated recently. It can be
configured to send an email if an update is detected.

## How does it work?

The function is invoked at a given frequency to check if the file specified
in the `FILE_URL` environment variable has changed in the given `TIME_PERIOD`.
Note that `TIME_PERIOD` is correlated to the frequency you run the function at.
For example using the Cron Tab of `0 0 * * *` means `TIME_PERIOD` must be set
to `24 hours` since they function is run every 24 hours. Using a Cron Tab
of `* * * * *` would require a `TIME_PERIOD` value of `1 minute` since the job
is executed every minute.

See the *Configuration* section at the bottom of the README for more details.

## Deployment on Kubernetes/OpenShift (Container Platform)

### Quick and Easy

Create a Cron Job on Kubernetes or OpenShift using the included `cronjob.yml`
file by running either `kubectl create -f cronjob.yml` or
`oc create -f cronjob.yml` - just remember to update the environment variables!

### Still Pretty Quick and Easy

_Note: You need Docker installed to do this._

1. Create a container image using the included `Dockerfile` - run
`npm run container:build` for a shortcut to do this.
2. Tag it using `IMAGE_USER=evanshortiss npm run container:tag` or using the
equivalent Docker command - remember to set `IMAGE_USER` to your DockerHub
or quay.io username.
3. Push it to a registry
4. Update the `cronjob.yml` file to point to your image
5. Run `kubectl create -f cronjob.yml` or `oc create -f cronjob.yml`

## Deployment as Lambdas (Serverless Framework)

1. Deploy to your cloud of choice using `serverless` (the repo includes a
`serverless.yml` template)
2. Configure target file, watch frequency, and email settings (see below
for an overview of these environment variables)
3. Get notified of changes that occur between each invocation via email

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

Most configuration is performed via environment variables. In AWS this is done
via the Lambda *Configuration* screen for your function. For Kubernetes and
OpenShift this is done via the `cronjob.yml`, and can be changed afterwards
using `kubectl edit cronjobs/$JOB_ID`.

* TIME_PERIOD - This should be the time between invocations. For example, if you invoke the function every hour, set this to "1 hour". It defaults to "24 hours" to match the default crontab of `0 0 * * ? *`.
* FILE_URL - The file to watch. For example [my env-var file](https://github.com/evanshortiss/env-var/blob/master/env-var.js).
* SENDGRID_API_KEY - Your API key for SendGrid.
* SENDGRID_SENDER - The email that should be displayed as the sender.
* SENDGRID_RECIPIENT - Single recipient email address.
* SENDGRID_RECIPIENTS - Comma separated list of multiple recipients. This is ignored if `SENDGRID_RECIPIENT` is set.
