'use strict'

const http = require('got')
const mailer = require('@sendgrid/mail')
const env = require('env-var')
const log = require('barelog')
const timestring = require('timestring')

const SENDGRID_API_KEY = env.get('SENDGRID_API_KEY').asString()
const SENDGRID_SENDER = env.get('SENDGRID_SENDER').asString()
const SENDGRID_RECIPIENT = env.get('SENDGRID_RECIPIENT').asString()
const SENDGRID_RECIPIENTS = env.get('SENDGRID_RECIPIENTS').asArray()

const FILE_URL = env.get('FILE_URL').required().asUrlObject()
const TIME_PERIOD = timestring(env.get('TIME_PERIOD', '24 hours').asString(), 'ms')
const INVOCATION_TIME = new Date()

/**
 * When this function is called it will check new commit occurred within the
 * past N milliseconds, when N is 24 hours or the config TIME_PERIOD variable.
 *
 * If a new commit has occurred then an email notification will be sent to those
 * defined in SENDGRID_RECIPIENT or SENDGRID_RECIPIENTS
 */
module.exports.checkForNewCommits = async (event) => {
  log(`Checking for changes in file: ${FILE_URL.toString()}`)

  const { ownerAndRepo, filepath } = getRepoAndFileDetails()
  const response = await http.get(getResolvedApiUrl(), {
    timeout: 15000,
    json: true
  })
  const commitsArray = response.body

  log('Received API response from GitHub')

  if (commitsArray.length === 0) {
    // This occurs if the filepath is invalid (or perhaps if an API error occurs)
    log('No file changes detected, or GitHub API is borked')
    await sendEmail(
      'File Lookup Error',
      `No commits were found for the file at ${filepath} in the repository https://github.com/${ownerAndRepo}`
    )
  } else {
    const newCommits = commitsArray.filter(commitTimeFilter)

    if (newCommits.length > 0) {
      log(`${newCommits.length} new commits to ${filepath} since yesterday`)

      const emailHtml = newCommits.reduce((result, commit, idx) => {
        if (idx === 0) {
          result += `
          <br/>
          <p>The file, ${filepath}, at ${ownerAndRepo} has been updated. Please review the following commits:</p>
          <ul>
          `
        }

        result += `<li>${commit.html_url}</li>`

        if (idx === newCommits.length - 1) {
          result += '</ul>'
        }

        return result
      }, '')

      await sendEmail(
        'Commits Detected',
        undefined,
        emailHtml
      )

      return { message: 'Commits detected, and email sent!', event }
    } else {
      log('No new commits detected')
      await sendEmail(
        'No Commits Detected',
        `Nothing to report today for ${filepath} in ${ownerAndRepo}.`
      )

      return { message: 'Nothing to report today!', event }
    }
  }
}

function getRepoAndFileDetails () {
  // Given a url such as https://github.com/evanshortiss/env-var/blob/master/lib/variable.js
  // This will return a tuple [ '/evanshortiss/env-var/', 'lib/variable.js' ]
  const parts = FILE_URL.pathname.split(/\/blob\/*.+?\//gi)

  return {
    ownerAndRepo: parts[0].replace('/', ''), // remove the leading slash
    filepath: parts[1]
  }
}

function getResolvedApiUrl () {
  const parts = getRepoAndFileDetails()

  return `https://api.github.com/repos/${parts.ownerAndRepo}/commits?path=${parts.filepath}`
}

function commitTimeFilter (commit) {
  const commitDate = new Date(commit.commit.author.date)
  const timeDifference = INVOCATION_TIME.getTime() - commitDate.getTime()

  const isNewCommit = timeDifference < TIME_PERIOD

  log(`Commit ${commit.sha.substring(0, 7)} time was ${commitDate.toJSON()}, current time is ${INVOCATION_TIME.toJSON()}. Is this a new commit? ${isNewCommit}`)

  return isNewCommit
}

function sendEmail (subject, text, html) {
  if (!SENDGRID_API_KEY) {
    log('Not sending email notififcations. Reason: SENDGRID_API_KEY is not set.')
  } else if (!SENDGRID_RECIPIENT && !SENDGRID_RECIPIENTS) {
    log('Not sending email notififcations. Reason: SENDGRID_RECIPIENT/SENDGRID_RECIPIENTS is not set.')
  } else if (!SENDGRID_SENDER) {
    log('Not sending email notififcations. Reason: SENDGRID_SENDER is not set.')
  } else {
    log(`Sending email with subject "${subject}"`)

    mailer.setApiKey(SENDGRID_API_KEY)

    return mailer.send({
      to: getEmailRecipients(),
      from: SENDGRID_SENDER,
      subject: `GitHub File Watcher: ${subject}`,
      text,
      html
    })
      .then(() => log('Email sent successfully to: ', getEmailRecipients()))
      .catch((e) => {
        log('Error sending email')
        log(e)
      })
  }
}

function getEmailRecipients () {
  return SENDGRID_RECIPIENT || SENDGRID_RECIPIENTS.map(email => { return { email } })
}
