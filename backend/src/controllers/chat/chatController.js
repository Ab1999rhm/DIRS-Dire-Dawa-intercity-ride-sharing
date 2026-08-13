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

exports.sendMessage = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const text = String(req.body?.text || '').trim();
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }

  const trip = await findParticipantTrip(tripId, req.user._id.toString());
  if (!trip || !trip._id) {
    return res.status(403).json({ error: 'Not authorized for this trip chat' });
  }

  const message = await ChatMessage.create({
    trip: trip._id,
    sender: req.user._id,
    senderRole: req.user.role,
    text
  });

  const payload = {
    id: message._id,
    tripId,
    senderId: req.user._id.toString(),
    senderRole: req.user.role,
    text,
    timestamp: message.createdAt ? new Date(message.createdAt).toISOString() : new Date().toISOString()
  };

  const driverUserId = trip.driver?.user?.toString();
  const passengerUserId = trip.passenger?.toString();
  const fromId = req.user._id.toString();
  const toDriver = driverUserId && driverUserId !== fromId;
  const toPassenger = passengerUserId && passengerUserId !== fromId;

  try {
    const { getIO } = require('../../sockets/socketManager');
    const io = getIO();
    if (toDriver) io.to(`user_${driverUserId}`).emit('trip_message', payload);
    if (toPassenger) io.to(`user_${passengerUserId}`).emit('chat_message', payload);
  } catch (socketError) {
    // Socket layer is optional; the message is already persisted for REST polling.
  }

  res.status(201).json({ message: payload });
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
