import { Octokit } from "@octokit/rest"; // Use @octokit/rest for full REST support
import { throttling } from "@octokit/plugin-throttling";

const MyOctokit = Octokit.plugin(throttling);

export const createOctokitInstance = (accessToken) => {
    return new MyOctokit({
        auth: accessToken,
        throttle: {
            onRateLimit: (retryAfter, options) => {
                console.warn(`Rate limit hit for request ${options.method} ${options.url}`);
                if (options.request.retryCount === 0) {
                    console.log(`Retrying after ${retryAfter} seconds...`);
                    return true; // Retry once
                } else {
                    console.log(`Retry limit reached. Not retrying further.`);
                    return false; // Do not retry again
                }
            },
            onSecondaryRateLimit: (retryAfter, options) => {
                console.warn(`Secondary rate limit hit for ${options.method} ${options.url}`);
                
                // Check if the request has already been retried
                if (options.request.retryCount === 0) {
                    console.log(`Retrying after ${retryAfter} seconds...`);
                    return true; // Retry the request
                } else {
                    console.log(`Retry limit reached. Not retrying further.`);
                    return false; // Do not retry again
                }
            },
        },
    });
};