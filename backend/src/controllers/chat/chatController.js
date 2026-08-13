const Trip = require('../../models/Trip');
const ChatMessage = require('../../models/ChatMessage');
const ChatRead = require('../../models/ChatRead');
const { asyncHandler } = require('../../middleware/errorHandler');

const findParticipantTrip = async (tripId, userId) => {
  const trip = await Trip.findById(tripId).populate('driver', 'user').lean();
  if (!trip) return null;

  const driverUserId = trip.driver?.user?.toString();
  const isPassenger = trip.passenger?.toString() === userId;
  const isDriver = driverUserId === userId;

  return isPassenger || isDriver ? trip : null;
};

exports.getMessages = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const limit = Math.min(parseInt(req.query.limit, 10) || 200, 500);

  const trip = await findParticipantTrip(tripId, req.user._id.toString());
  if (!trip) {
    return res.status(403).json({ error: 'Not authorized for this trip chat' });
  }

  const messages = await ChatMessage.find({ trip: tripId })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();

  res.json({
    messages: messages.map((m) => ({
      id: m._id,
      tripId: m.trip,
      senderId: m.sender,
      senderRole: m.senderRole,
      text: m.text,
      timestamp: m.createdAt
    }))
  });
});

exports.markRead = asyncHandler(async (req, res) => {
  const { tripId } = req.params;

  const trip = await findParticipantTrip(tripId, req.user._id.toString());
  if (!trip) {
    return res.status(403).json({ error: 'Not authorized for this trip chat' });
  }

  await ChatRead.updateOne(
    { trip: tripId, user: req.user._id },
    { $set: { lastReadAt: new Date() } },
    { upsert: true }
  );

  res.json({ success: true });
});

exports.getUnread = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();

  const driver = req.user.role === 'driver'
    ? await require('../../models/Driver').findOne({ user: req.user._id }).lean()
    : null;

  const tripQuery = req.user.role === 'driver'
    ? { driver: driver?._id }
    : { passenger: req.user._id };

  const trips = await Trip.find(tripQuery).select('_id status').lean();

  const readRecords = await ChatRead.find({ user: req.user._id, trip: { $in: trips.map((t) => t._id) } }).lean();
  const readByTrip = new Map(readRecords.map((r) => [r.trip.toString(), r.lastReadAt]));

  const result = [];
  for (const trip of trips) {
    const tripId = trip._id.toString();
    const lastReadAt = readByTrip.get(tripId);

    const match = { trip: trip._id, sender: { $ne: req.user._id } };
    if (lastReadAt) match.createdAt = { $gt: lastReadAt };

    const unread = await ChatMessage.countDocuments(match);
    result.push({ tripId, status: trip.status, unread });
  }

  res.json({ trips: result });
});
