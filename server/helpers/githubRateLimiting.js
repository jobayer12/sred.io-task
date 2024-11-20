// Check if the rate limit is hit by inspecting the headers
export const isRateLimited = (headers) => {
    const remainingRequests = headers['x-ratelimit-remaining'];
    return remainingRequests && remainingRequests <= 1; // Rate limit is low
};

// Helper function to wait until rate limit resets
export const waitForRateLimit = async (headers) => {
    const resetTime = headers['x-ratelimit-reset'];
    const currentTime = Math.floor(Date.now() / 1000);
    const waitTime = resetTime - currentTime + 1; // Adding 1 second buffer

    if (waitTime > 0) {
        console.log(`Waiting for ${waitTime} seconds until rate limit resets...`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    }
};