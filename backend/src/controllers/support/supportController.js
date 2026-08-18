const { asyncHandler } = require('../../middleware/errorHandler');
const FAQ = require('../../models/FAQ');

// @desc    Get published FAQs (public)
// @route   GET /api/support/faqs
// @access  Public
exports.getPublicFAQs = asyncHandler(async (req, res) => {
  const { category, language, search } = req.query;
  const filter = { isPublished: true };
  if (category) filter.category = category;
  if (language) filter.language = language;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  const faqs = await FAQ.find(filter)
    .select('title content category tags language views helpful notHelpful order')
    .sort({ order: 1, createdAt: -1 });

  res.json({ faqs });
});

// @desc    Get single published FAQ (public), increments view count
// @route   GET /api/support/faqs/:faqId
// @access  Public
exports.getPublicFAQ = asyncHandler(async (req, res) => {
  const { faqId } = req.params;
  const faq = await FAQ.findOneAndUpdate(
    { _id: faqId, isPublished: true },
    { $inc: { views: 1 } },
    { new: true }
  ).select('title content category tags language views helpful notHelpful order relatedArticles');

  if (!faq) {
    return res.status(404).json({ error: 'FAQ not found' });
  }

  res.json({ faq });
});

// @desc    Record helpful/not helpful feedback (public)
// @route   POST /api/support/faqs/:faqId/feedback
// @access  Public
exports.publicFAQFeedback = asyncHandler(async (req, res) => {
  const { faqId } = req.params;
  const { helpful } = req.body;

  const inc = helpful ? { helpful: 1 } : { notHelpful: 1 };
  const faq = await FAQ.findByIdAndUpdate(faqId, { $inc: inc }, { new: true });

  if (!faq) {
    return res.status(404).json({ error: 'FAQ not found' });
  }

  res.json({ message: 'Feedback recorded', faq });
});
