const requestTracker = new Map();

export const bloodRequestRateLimiter = (req, res, next) => {
  const hospitalId = req.user._id.toString();
  const currentTime = Date.now();
  const TWO_MINUTES = 2 * 60 * 1000; // CHANGED: 2 minutes instead of 1

  if (!requestTracker.has(hospitalId)) {
    requestTracker.set(hospitalId, { timestamps: [] });
  }

  const tracker = requestTracker.get(hospitalId);
  
  // Remove timestamps older than 2 minutes
  tracker.timestamps = tracker.timestamps.filter(
    timestamp => currentTime - timestamp < TWO_MINUTES // CHANGED
  );

  // Check if rate limit exceeded (5 requests already made)
  if (tracker.timestamps.length >= 5) {
    const timeUntilReset = TWO_MINUTES - (currentTime - tracker.timestamps[0]); // CHANGED
    return res.status(429).json({
      success: false,
      message: "Rate limit exceeded. Maximum 5 requests per 2 minutes.", // CHANGED MESSAGE
      rateLimitExceeded: true,
      requestsInLastMinute: tracker.timestamps.length,
      retryAfter: Math.ceil(timeUntilReset / 1000)
    });
  }

  // Add current request timestamp
  tracker.timestamps.push(currentTime);

  // Warn starting from 2nd request
  if (tracker.timestamps.length >= 2) {
    req.rateLimitWarning = {
      message: `${5 - tracker.timestamps.length} request(s) remaining before rate limit`,
      requestsRemaining: 5 - tracker.timestamps.length,
      totalRequests: tracker.timestamps.length
    };
  }

  next();
};