# PromptQL Complex Query Examples

Advanced queries demonstrating joins, aggregations, and analytics.

## Join Queries

### Members with claims
```
Show me members who have claims with status DENIED
```

### Provider claim counts
```
How many claims does each provider have?
```

### Member claim totals
```
Show me the total claim amount for each member
```

## Aggregation Queries

### Claim statistics
```
What's the average claim amount by status?
```

### Denial analysis
```
Show me denial reasons with their counts, ordered by frequency
```

### Monthly trends
```
How many claims were submitted each month this year?
```

## Multi-table Analytics

### High-cost members
```
Find members with total claims over $50,000
```

### Provider performance
```
List providers with denied claim rate above 20%
```

### Plan analysis
```
Compare average claim amounts across different plan types
```

## Advanced Filters

### Date ranges
```
Show me claims between January 1 and March 31, 2024
```

### Multiple conditions
```
Find denied claims over $10,000 for members on HMO plans
```

### Nested conditions
```
Show me providers who have members with pending prior authorization claims
```

## Business Intelligence

### Cost analysis
```
What percentage of claims are denied?
```

### Provider analysis
```
Which providers have the highest approval rates?
```

### Member patterns
```
Show me members with more than 10 claims in the last 6 months
```

---

**💡 Advanced Tips:**
- The AI understands business context (PA = Prior Authorization)
- You can ask for percentages, averages, and other calculations
- Complex joins are handled automatically
- Always includes LIMIT clause for safety
