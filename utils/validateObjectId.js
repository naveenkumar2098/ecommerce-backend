const mongoose = require('mongoose');

// Route-param guard: respond 400 for values that are not valid ObjectIds
module.exports = (param = 'id') => (req, res, next) =>
  mongoose.isValidObjectId(req.params[param])
    ? next()
    : res.status(400).json({ message: `Invalid ${param}` });
