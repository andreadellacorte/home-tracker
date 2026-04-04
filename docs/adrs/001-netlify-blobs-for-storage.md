# ADR 001: Use Netlify Blobs for storage

**Status:** Accepted (with known trade-offs)

## Decision

Store `known_items` and `shopping_list` as JSON blobs in Netlify Blobs.

## Alternatives considered

**Netlify DB** (SQLite via Turso) would be a better fit for this data model: two related entities, concurrent writes from multiple users, and atomic increments. It avoids the race condition where two simultaneous NFC taps can cause one write to silently overwrite the other.

## Why Blobs for now

MVP simplicity. No schema, no migrations, zero config on Netlify.

## Trade-offs accepted

- Concurrent writes from two users can race and lose data.
- Full list is loaded into memory on every read/write.
- No relational integrity between `known_items` and `shopping_list`.

## Revisit when

The race condition causes real data loss, or the list grows large enough to make full-blob reads slow. At that point, migrate to Netlify DB.
