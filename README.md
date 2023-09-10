// Generate an ID that can be used both as a secure token and a random ID
// Compact (24 characters + prefix)
// Readable / Writable
// Verifiable offline
// Secure (2.8e+14 randomness per microsecond)
// Clear intent

// 56 bits for timestamp (microseconds)
// 48 bits randomness
// 16 bits CRC-16
// output: 24 characters + prefix