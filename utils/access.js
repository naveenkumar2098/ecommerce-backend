// True when the requester owns the resource or has one of the given roles
exports.isOwnerOrRole = (req, ownerId, ...roles) =>
  roles.includes(req.user.role) || String(ownerId) === String(req.user._id);
