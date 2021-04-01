const timeUntil = require('time-until');
const { escapeMarkdown } = require('./common');
const { Webhook, MessageBuilder } = require('webhook-discord');
const { punishments, reports } = require('../config.json').webhooks;

let punishmentsHook;
if (punishments) punishmentsHook = new Webhook(punishments);

let reportsHook;
if (reports) reportsHook = new Webhook(reports);

function webhookNewReport(
  reportedName,
  reporterName,
  reporterUuid,
  reportedUuid,
  reason,
  timestamp,
  amount,
  onlineStaff
) {
  if (!reports) return;
  const msg = new MessageBuilder()
    .setName('In-Game Reports')
    .setColor('#aa00aa')
    .setTitle('New report')
    .addField('Reported', escapeMarkdown(reportedName), true)
    .addField('Reporter', escapeMarkdown(reporterName), true)
    .addField('\u200B', '\u200B', true)
    .addField('Reason', escapeMarkdown(reason.substr(0, 200)), true)
    .addField('Online staff', onlineStaff.map(s => escapeMarkdown(s)).join('\n'), true)
    .setTime(timestamp)
    .setFooter(
      `Reported ${amount} time${amount > 1 ? 's' : ''} (this session)`,
      `https://crafatar.com/avatars/${reporterUuid}?helm&size=50`
    )
    .setThumbnail(`https://crafatar.com/avatars/${reportedUuid}?helm&size=50`);
  reportsHook.send(msg);
}

function webhookIssuePunishment(punishment, punished, punisher) {
  if (!punishments) return;
  let type =
    punishment.isBan() && punishment.ip_ban ? 'IP BAN' : punishment.type;
  let punishedName = punished ? punished.name : punishment.ip;
  let punisherName = punisher ? punisher.name : 'Console';
  let icon = punisher
    ? 'https://crafatar.com/avatars/' + punisher.uuid + '?helm&size=50'
    : undefined;
  let thumbnail = punished
    ? 'https://crafatar.com/avatars/' + punished.uuid + '?helm&size=50'
    : undefined;
  let time =
    punishment.expires < 0
      ? 'Never'
      : timeUntil(new Date(punishment.expires + 1000)).string;
  const msg = new MessageBuilder()
    .setName('Punishment')
    .setColor('#3492eb')
    .setTitle('New punishment')
    .setFooter('Issued by: ' + punisherName, icon)
    .setThumbnail(thumbnail)
    .addField('ID', '`' + punishment._id + '`', true)
    .addField('Type', '`' + type + '`', true)
    .addField('Punished Player', '`' + punishedName + '`', false);
  if (punishment.isTimed()) msg.addField('Expires', time, false);
  msg.addField('Reason', punishment.reason, false);
  punishmentsHook.send(msg);
}

function webhookRevertPunishment(punishment, loadedUsers) {
  if (!punishments) return;
  let punished = loadedUsers.find(user => user.id.equals(punishment.punished));

  let type =
    punishment.isBan() && punishment.ip_ban ? 'IP BAN' : punishment.type;
  let punishedName = punished ? punished.name : punishment.ip;
  let thumbnail = punished
    ? 'https://crafatar.com/avatars/' + punished.uuid + '?helm&size=50'
    : undefined;
  const msg = new MessageBuilder()
    .setName('Punishment')
    .setColor('#fae632')
    .setTitle('Punishment reverted')
    .setThumbnail(thumbnail)
    .addField('ID', '`' + punishment._id + '`', true)
    .addField('Type', '`' + type + '`', true)
    .addField(
      'Punished ' + (punished ? 'Player' : 'IP'),
      '`' + punishedName + '`',
      false
    )
    .addField('Reason', punishment.reason, false);
  punishmentsHook.send(msg);
}

module.exports = {
  webhookIssuePunishment,
  webhookRevertPunishment,
  webhookNewReport,
};
