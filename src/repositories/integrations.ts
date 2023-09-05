import { database } from './database'

async function getIntegrations() {
  const integrations = database.integrations
    .findMany({
      where: {
        status: 1,
      },
    })
    .then((response) => {
      const integrations: any = response.map((integration) => {
        // check if integration.params is a valid json string
        // if not, return null
        // if yes, return the parsed json

        if (integration.params) {
          try {
            const params = JSON.parse(integration.params)
            return {
              ...integration,
              params,
            }
          } catch (error) {
            return {
              ...integration,
              params: null,
              error: true,
            }
          }
        }
        return {
          ...integration,
          params: null,
          error: true,
        }
      })
      return integrations
    })

  return integrations
}

const integrations = getIntegrations().then((res) => res)
export { integrations }
