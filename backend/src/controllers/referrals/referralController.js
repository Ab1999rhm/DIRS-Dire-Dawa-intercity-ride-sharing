const User = require('../../models/User');
const Referral = require('../../models/Referral');
const { asyncHandler } = require('../../middleware/errorHandler');
const logger = require('../../config/logger');

const REFERRAL_BONUS = 50;
const FRIEND_BONUS = 30;

function generateReferralCode(firstName) {
  const prefix = (firstName || 'USER').toUpperCase().slice(0, 4);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const year = new Date().getFullYear();
  return `DIRS-${prefix}${random}${year}`;
}

exports.getMyReferralCode = asyncHandler(async (req, res) => {
  let user = await User.findById(req.user._id);

  if (!user.referralCode) {
    user.referralCode = generateReferralCode(user.firstName);
    await user.save();
  }

  res.json({
    referralCode: user.referralCode,
    credits: user.credits,
    totalCreditsEarned: user.totalCreditsEarned
  });
});

exports.getMyReferrals = asyncHandler(async (req, res) => {
  const referrals = await Referral.find({ referrer: req.user._id })
    .populate('referredUser', 'firstName lastName phoneNumber createdAt')
    .sort({ createdAt: -1 });

  const totalReferred = referrals.length;
  const completedReferrals = referrals.filter(r => r.status === 'completed').length;
  const pendingReferrals = referrals.filter(r => r.status === 'pending').length;

  const user = await User.findById(req.user._id);

  res.json({
    referrals,
    stats: {
      totalReferred,
      completedReferrals,
      pendingReferrals,
      credits: user.credits,
      totalCreditsEarned: user.totalCreditsEarned
    }
  });
});

exports.applyReferralCode = asyncHandler(async (req, res) => {
  const { referralCode } = req.body;

  if (!referralCode) {
    return res.status(400).json({ error: 'Referral code is required' });
  }

  const referrer = await User.findOne({ referralCode });
  if (!referrer) {
    return res.status(404).json({ error: 'Invalid referral code' });
  }

  if (referrer._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ error: 'You cannot use your own referral code' });
  }

  const existingReferral = await Referral.findOne({
    referredUser: req.user._id
  });
  if (existingReferral) {
    return res.status(400).json({ error: 'You have already been referred by someone' });
  }

  const referral = await Referral.create({
    referrer: referrer._id,
    referredUser: req.user._id,
    referralCode,
    bonusAwarded: REFERRAL_BONUS,
    friendBonusAwarded: FRIEND_BONUS,
    status: 'pending'
  });

  await User.findByIdAndUpdate(req.user._id, {
    referredBy: referrer._id
  });

  logger.info('Referral code applied', {
    referrerId: referrer._id,
    referredUserId: req.user._id,
    referralCode
  });

  res.json({
    message: `Referral code applied! Your friend ${referrer.firstName} will earn ${REFERRAL_BONUS} ETB when you complete your first trip.`,
    referral
  });
});

exports.completeReferral = asyncHandler(async (userId) => {
  const referral = await Referral.findOne({
    referredUser: userId,
    status: 'pending'
  });

  if (!referral || referral.referredUserCompletedFirstTrip) return;

  referral.referredUserCompletedFirstTrip = true;
  referral.status = 'completed';
  referral.completedAt = new Date();
  await referral.save();

  await User.findByIdAndUpdate(referral.referrer, {
    $inc: { credits: REFERRAL_BONUS, totalCreditsEarned: REFERRAL_BONUS }
  });

  await User.findByIdAndUpdate(userId, {
    $inc: { credits: FRIEND_BONUS, totalCreditsEarned: FRIEND_BONUS }
  });

  logger.info('Referral completed', {
    referrerId: referral.referrer,
    referredUserId: userId,
    referrerBonus: REFERRAL_BONUS,
    friendBonus: FRIEND_BONUS
  });

  return referral;
});

exports.applyReferralCodeDuringRegistration = async (userId, referralCode) => {
  if (!referralCode) return null;

  const referrer = await User.findOne({ referralCode });
  if (!referrer) return null;

  if (referrer._id.toString() === userId.toString()) return null;

  const referral = await Referral.create({
    referrer: referrer._id,
    referredUser: userId,
    referralCode,
    bonusAwarded: REFERRAL_BONUS,
    friendBonusAwarded: FRIEND_BONUS,
    status: 'pending'
  });

  await User.findByIdAndUpdate(userId, {
    referredBy: referrer._id
  });

  logger.info('Referral applied during registration', {
    referrerId: referrer._id,
    referredUserId: userId,
    referralCode
  });

  return referral;
};

exports.validateReferralCode = asyncHandler(async (req, res) => {
  const { referralCode } = req.params;

  const referrer = await User.findOne({ referralCode }).select('firstName lastName');
  if (!referrer) {
    return res.status(404).json({ valid: false, error: 'Invalid referral code' });
  }

  res.json({
    valid: true,
    referrerName: `${referrer.firstName} ${referrer.lastName.charAt(0)}.`,
    friendBonus: FRIEND_BONUS
  });
});
