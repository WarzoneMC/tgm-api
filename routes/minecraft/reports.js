var verifyServer = require('./verifyServer');
const { webhookNewReport } = require('../../util/webhooks');

module.exports = function (app) {
  /* JSON body
      reporterName: string,
      reportedName: string,
      reporterUuid: string,
      reportedUuid: string,
      reason: string,
      timestamp: number, (SECONDS)
      amount: number
      onlineStaff: string[]
    */
  app.post('/mc/report/create', verifyServer, function (req, res) {
    const {
      reporterName,
      reportedName,
      reporterUuid,
      reportedUuid,
      reason,
      timestamp,
      amount,
      onlineStaff,
    } = req.body;
    if (
      !reporterName ||
      !reportedName ||
      !reporterUuid ||
      !reportedUuid ||
      !reason ||
      !timestamp ||
      !amount ||
      !onlineStaff
    )
      return res.json({
        error:
          'All properties required: reporterName, reportedName, reporterUuid, reportedUuid reason, timestamp, amount, onlineStaff',
      });

    webhookNewReport(
      reporterName,
      reportedName,
      reporterUuid,
      reportedUuid,
      reason,
      timestamp,
      amount,
      onlineStaff
    );
    res.status(201).json({});
  });
};
