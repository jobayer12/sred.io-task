import { Octokit } from "@octokit/rest"; // Use @octokit/rest for full REST support
import { throttling } from "@octokit/plugin-throttling";

const MyOctokit = Octokit.plugin(throttling);

export const createOctokitInstance = (accessToken) => {
    return new MyOctokit({
        auth: accessToken,
        throttle: {
            onRateLimit: (retryAfter, options, octokit, retryCount) => {
                octokit.log.warn(
                    `Request quota exhausted for request ${options.method} ${options.url}`,
                );
                // only retries once
                if (retryCount < 1) {
                    octokit.log.info(`Retrying after ${retryAfter} seconds!`);
                    return true;
                }
            },
            onSecondaryRateLimit: (retryAfter, options, octokit) => {
                // does not retry, only logs a warning
                octokit.log.warn(
                    `SecondaryRateLimit detected for request ${options.method} ${options.url}`,
                );
            },
        },
    });
};