# ReID

*The* most useful, developer friendly ID or token generation tool.

## Key Features

- [x] Random enough to be used both as a random ID or a secure token
- [x] Compact, just 24 characters (plus optional prefix, if you wish)
- [x] Supports prefixes, providing clear context to developers and users alike
- [x] Tamper-proof, with checksum embedded in the ReID that can be checked offline, without hitting a database
- [x] Secure, with 2.8e+14 unique ReIDs per microsecond
- [x] Human readable, by avoiding ambiguous characters
- [x] Auto-lints inputs

## Installation
```
npm install reid
```
## Usage
```typescript
import { reid } from "reid";

// Get a new ReID, without prefix
console.log(reid());
// Output: 0R2FWCHN822NKS5XGED6P5BC

// Get a new ReID, with prefix
console.log(reid("user"));
// Output: user_0R2FWCHN822NKS5XGED6P5BC

// Initialize a valid ReID
const validId = reid("user_0R2FWCHN822NKS5XGED6P5BC");
console.log(validId);
// Output: user_0R2FWCHN822NKS5XGED6P5BC

// Initialize a valid, dirty ReID
const validDirtyId = reid("user_or2fwndvlrk897784eotpz3k");
console.log(validDirtyId);
// Output: user_0R2FWNDV1RK897784E0TPZ3K
// Note that linting replaced o's with 0's and l with 1

// Initialize a ReID with bad checksum
const tamperedId = reid("user_0R2FWCHN822NKS5XGED6P5BD");
// throws a ChecksumError

// Initialize a ReID with bad format
const invalidId = reid("user_0R2FWCHN822NKS5XGED6P5BCBCJE");
// throws a FormatError
```
## Technical Details
### Prefix
The prefix must be less than 24 characters long. Anything beyond it will throw a `FormatError`.
### Delimiter
The default delimiter is the underscore `_`, however you can change it to any of the following characters: `_ - / \ .`.

To do so, use `setDelimiter`:
```typescript
import { reid, setDelimiter } from "reid";

setDelimiter("-");

console.log(reid("user"));
// Output: user-0R2FWCHN822NKS5XGED6P5BD
```

Make sure you set it also when importing the module just to parse ReIDs.

### ReID Format and Implementation
ReIDs are 15 bytes long.

The implementation of ReIDs includes:
- 7 bytes to store the generation timestamp, in microseconds
- 6 random bytes to introduce randomness within the microseconds
- 2 bytes for checksum, using CRC-16 (CCITT)

While a timestamp in microseconds would require 8 bytes to be stored, the first byte is dropped. This means that timestamps will reset to zero and duplication might occur approximately every 2,284 years.

The resulting 15 byte buffer is encoded to 24 characters using Crockford's Base 32 encoding, which allows to avoid ambiguous and special characters. The character space of Crockford's Base 32 is `0123456789ABCDEFGHJKMNPQRSTVWXYZ`.

Based on the convention above, the first 11 characters of a ReID represent the timestamp and can be used to easily sort ReIDs.
Note: Base 32 means that every character encodes 5 bits, so in reality the least significant bit of the timestamp is encoded in the 12th character of the ReID. However, given that the 12th character also encodes randomness, it cannot be used for sorting.

Sorting for the entire ReID cannot be guaranteed, however, due to the random bits used after the timestamp.

Here is an example of the process of generating a ReID:
1. Generation time: `2023-09-10T10:19:36.295761Z`
2. Convert to timestamp in microseconds: `1694341176295761`
3. Represent as a BigInt (Big Endian): `0x604FE8BF10151`, or `00 06 04 fe 8b f1 10 f1`
4. Drop the first byte: `06 04 fe 8b f1 10 f1`
5. Generate 6 random bytes: `0x2ce2cc6e3fe3`
6. Calculate the CRC-16 checksum of the 13 bytes obtained so far: `0x6438`

```
############################################################################
#            Timestamp             #         Random Bytes        #  CRC-16 #
############################################################################
#                                   Bytes                                  #
# 06 | 04 | fe | 8b | f1 | 10 | f1 | 2c | e2 | cc | 6e | 3f | e3 | 64 | 38 #
############################################################################
#                           Crockford's Base 32                            #
#  0  R  2  F  X  2  Z  H  2  3  R  J  S  R  P  C  D  R  Z  Y  6  S  1  R  #
############################################################################
```
