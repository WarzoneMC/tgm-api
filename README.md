# API
Warzone's http backend implementation.

### Environment Variables
| Variable | Description | Default |
| --- | --- | --- |
| PORT | Binding port of http server. | 3000 |
| MONGO_URL | MongoDB connect uri | mongodb://localhost/teamgg |
| AUTH_SERVER_TOKEN | Authentication token for internal servers | dummy |
| SAVE_CHAT | Determines if the API should store match chat to Mongo | false |