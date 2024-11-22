import * as githubApi from '../helpers/githubApi.js';
import * as githubService from '../services/githubService.js';

export const RunGithubCorn = async () => {
    githubService.fetchIntegrationList().then(integrationList => {
        integrationList.forEach(integration => {
            githubApi.fetchOrganizations(integration.token, integration._id).then(() => {
                githubService.fetchOrganizationsByIntegrationId(integration._id).then((organiationList) => {
                    githubApi.fetchRepositories(integration.token, integration._id, organiationList).then(() => {
                        githubService.fetchRepositories({integrationId: integration._id}).then(repositoryList => {
                            repositoryList.forEach(repository => {
                                githubApi.repoistoryActivity(repository.slug, integration._id, repository._id, integration.token).catch(error => console.log(error));
                            })
                        });
                    })
                    .catch(error => console.log('failed to fetch repositories'))
                }).catch(error  => console.log('failed to load organization list from database due to', error));
            }).catch(error  => console.log('failed to load organization list from github api due to', error));
        })
    }).catch(error => console.log('failed to load organizationList due to: ', error));
}