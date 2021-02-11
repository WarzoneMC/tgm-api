const timeUntil = require('time-until');
const { Webhook, MessageBuilder } = require("webhook-discord");
const { punishments } = require("../config.json").webhooks;

let punishmentsHook;
if (punishments) {
    punishmentsHook = new Webhook(punishments);
}

function webhookIssuePunishment(punishment, punished, punisher) {
    if (!punishments) return;    
    let type = punishment.isBan() && punishment.ip_ban ? "IP BAN" : punishment.type;
    let punishedName = punished ? punished.name : punishment.ip;
    let punisherName = punisher ? punisher.name : "Console";
    let icon = punisher ? "https://crafatar.com/avatars/" + punisher.uuid + "?helm&size=50": undefined;
    let thumbnail = punished ? "https://crafatar.com/avatars/" + punished.uuid + "?helm&size=50" : undefined;
    console.log(thumbnail);
    let time = punishment.expires < 0 ? "Never" : timeUntil(new Date(punishment.expires + 1000)).string;
    const msg = new MessageBuilder()
            .setName("Punishment")
            .setColor("#3492eb")
            .setTitle("New punishment")
            .setFooter("Issued by: " + punisherName, icon)
            .setThumbnail(thumbnail)
            .addField("ID", '`' + punishment._id + '`', true)
            .addField("Type", '`' + type + '`', true)
            .addField("Punished Player", punishedName, false)
    if (punishment.isTimed()) {
        msg.addField("Expires", time, false)
    }
    msg.addField("Reason", punishment.reason, false);
    punishmentsHook.send(msg);
}

function webhookRevertPunishment(punishment, loadedUsers) {
    if (!punishments) return;
    let punished = loadedUsers.find(user => user.id.equals(punishment.punished));

    let type = punishment.isBan() && punishment.ip_ban ? "IP BAN" : punishment.type;
    let punishedName = punished ? punished.name : punishment.ip;
    let thumbnail = punished ? "https://crafatar.com/avatars/" + punished.uuid + "?helm&size=50" : undefined;
    const msg = new MessageBuilder()
            .setName("Punishment")
            .setColor("#fae632")
            .setTitle("Punishment reverted")
            .setThumbnail(thumbnail)
            .addField("ID", '`' + punishment._id + '`', true)
            .addField("Type", '`'+ type + '`', true)
            .addField("Punished " + (punished ? "Player" : "IP"), punishedName, false)
            .addField("Reason", punishment.reason, false);
    punishmentsHook.send(msg);
}

module.exports = {
    webhookIssuePunishment,
    webhookRevertPunishment
}