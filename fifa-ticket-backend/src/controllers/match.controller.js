const MatchModel = require('../models/match.model');

exports.getAllMatches = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    // Fetch across all shards
    const matches = await MatchModel.getAll(status);

    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

exports.searchMatches = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query "q" is required.' });
    }

    const matches = await MatchModel.search(q);

    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

exports.getMatchById = async (req, res, next) => {
  try {
    const result = await MatchModel.getById(req.params.id);
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    res.status(200).json({
      success: true,
      region: result.region,
      data: result.match
    });
  } catch (error) {
    next(error);
  }
};
