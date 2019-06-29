# BestFit Bot for Discord

#### Created for Discord Hack Week 2019

BestFit Bot is a bot that helps users decide what games to play with their friends. It works by creating and internally maintaining groups of users that have certain games, then when called upon, determining which games the users have.

---
## Install!

If you want to add the bot to your server, you can just use this url to add it:

[Add the BestFit Bot to your server!](https://discordapp.com/api/oauth2/authorize?client_id=593298843777630208&permissions=8&redirect_uri=http%3A%2F%2F127.0.0.1%3A3000&scope=bot)

Or you can join our server to test the bot out for yourself:
[The BestFit Bot Test Server](https://discord.gg/qzusR3R)

---
## Commands
- `.initialize`
    - Automatically creates a new text channel for use with the bot. This is where you will interact with emoji reactions to tell the bot what games you own.
- `.bestfit`
    - Finds the game that is the best fit for the people currently in your voice channel.
- `.list`
    - Outputs a list of the different groups into the chat.
- `.help [command]`
    - Tell you to what each command the bot has to offer does and how to use them.  
- `.syntax [command]`
    - Tells you how to use certain commands by telling the parameters and if they are optional or not.
- `.add [@person] to [groupname]`
    - Adds a person to a group manually.
- `.add group [groupname]`
    - Creates a new group.
- `.remove [@person] from [groupname]`
    - Removes a person from a group manually.
- `.remove group [groupname]`
    - Removes a group.
    
## Future Changes

The bot is currently in working fashion but in the future we would like to add compatibility with more game platforms so that users don't have to manually add themselves to groups they have the games for. Also group consistency across servers where the user's groups are the same in every server is another goal we are pursuing.
