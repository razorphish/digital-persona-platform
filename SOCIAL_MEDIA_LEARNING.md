# Social Media Learning Integration

## Overview

The Digital Persona Platform now includes automatic learning from social media posts, allowing personas to learn and adapt based on the user's social media activity.

## Features Implemented

### 1. Automatic Learning During Sync

- **Default Behavior**: When syncing social media posts, the system automatically updates the user's "self" persona
- **Location**: `app/routers/integrations.py` - `/integrations/{integration_id}/sync` endpoint
- **Trigger**: Every time new posts are synced from Twitter or Facebook

### 2. Self Persona Updates

- **Target**: The user's "self" persona (relation_type = "self")
- **Content**: Aggregated social media posts with hashtags, mentions, and engagement metrics
- **Storage**: Added to the persona's `memory_context` field
- **Format**: Structured with timestamps and metadata

### 3. Backend-Only Advanced Learning

- **Endpoint**: `POST /integrations/{integration_id}/learn-advanced`
- **Purpose**: Advanced control over which personas are updated
- **Not Exposed**: This endpoint is not available in the frontend UI
- **Configuration**: Supports targeting specific personas or groups of personas

## How It Works

### Content Aggregation

Social media posts are processed and aggregated into a learning-friendly format:

```
[Social Media Learning - 2024-01-15 14:30:00]
Working on a new digital persona platform. The possibilities are endless!
Engagement: 25 likes, 5 comments, 1 shares

---

Just finished an amazing coding session! #programming #python #AI
Hashtags: programming, python, AI
Engagement: 15 likes, 3 comments, 2 shares
```

### Learning Process

1. **Sync Trigger**: User syncs social media integration
2. **Post Processing**: New posts are filtered and stored
3. **Content Aggregation**: Posts are formatted for learning
4. **Persona Update**: Self persona's memory context is updated
5. **Interaction Count**: Persona interaction count is incremented

## API Endpoints

### Standard Sync (Frontend Available)

```http
POST /integrations/{integration_id}/sync
```

**Response includes learning results:**

```json
{
  "message": "Sync completed successfully",
  "new_posts_count": 5,
  "total_posts_synced": 20,
  "learning_results": {
    "updated_personas": [1],
    "learning_count": 1,
    "total_posts_processed": 5
  }
}
```

### Advanced Learning (Backend Only)

```http
POST /integrations/{integration_id}/learn-advanced
```

**Request Body:**

```json
{
  "target_personas": [1, 2, 3],
  "update_self_persona": true,
  "include_analytics": true,
  "sentiment_weight": 1.0
}
```

## Database Schema

### Social Media Posts

- `social_media_posts` table stores imported posts
- Includes content, hashtags, mentions, engagement metrics
- Linked to `social_media_integrations` via `integration_id`

### Persona Learning

- `personas` table includes learning-related fields:
  - `memory_context`: Accumulated learning data
  - `learning_enabled`: Whether learning is active
  - `interaction_count`: Number of learning interactions
  - `last_interaction`: Timestamp of last learning update

## Configuration

### Environment Variables

- `TWITTER_API_KEY`: Twitter API key for syncing
- `TWITTER_API_SECRET`: Twitter API secret
- `FACEBOOK_APP_ID`: Facebook app ID (if using Facebook integration)

### Learning Settings

- **Default**: Self persona is updated automatically
- **Advanced**: Can target specific personas via backend API
- **Error Handling**: Failed learning doesn't break sync process

## Usage Examples

### Frontend Integration

The frontend automatically benefits from this feature:

1. User connects social media account
2. User syncs posts
3. Self persona is automatically updated
4. Persona becomes more personalized over time

### Backend API Usage

```python
# Update specific personas
learning_config = {
    "target_personas": [1, 2],
    "update_self_persona": False
}

response = await client.post(
    f"/integrations/{integration_id}/learn-advanced",
    json=learning_config
)
```

## Security Considerations

- **Authentication**: All endpoints require user authentication
- **Authorization**: Users can only access their own integrations and personas
- **Data Privacy**: Social media data is stored securely and only used for persona learning
- **API Limits**: Respects social media platform rate limits

## Future Enhancements

1. **Sentiment Analysis**: Integrate with OpenAI for sentiment analysis
2. **Topic Modeling**: Extract topics and interests from posts
3. **Temporal Patterns**: Learn from posting patterns and timing
4. **Cross-Platform Learning**: Combine data from multiple platforms
5. **Selective Learning**: Allow users to choose which posts to learn from

## Troubleshooting

### Common Issues

1. **No Learning Results**: Check if persona has `learning_enabled = true`
2. **Missing Posts**: Verify social media integration is properly connected
3. **API Errors**: Check social media platform API credentials and rate limits

### Logs

Learning activities are logged with INFO level:

```
INFO: Updated persona 1 (My Digital Self) with social media learning data
```

## Dependencies

- `tweepy`: Twitter API integration
- `facebook-sdk`: Facebook API integration
- `sqlalchemy`: Database operations
- `fastapi`: API framework
