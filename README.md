# API
Warzone's HTTP backend implementation.


## Example configuration file (`config.json`):
```JSON
{
    "server":{
        "token": "YOUR_TOKEN"
    },
    "webhooks":{
        "punishments": "PUNISHMENTS_URL",
        "reports": "REPORTS_URL"
    },
    "port": 3000,
    "mongo": "mongodb://127.0.0.1:27017/tgm",
    "hash": false
} 
```
