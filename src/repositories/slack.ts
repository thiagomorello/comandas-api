import axios from 'axios'

const slackApi = axios.create({
  baseURL: 'https://hooks.slack.com/services',
})

export { slackApi }
