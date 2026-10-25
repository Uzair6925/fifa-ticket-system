const StadiumModel = require('../models/stadium.model');

exports.getAllStadiums = async (req, res, next) => {
  try {
    const { region } = req.query;
    
    let stadiums;
    if (region) {
      stadiums = await StadiumModel.getByRegion(region);
    } else {
      stadiums = await StadiumModel.getAll();
    }

    res.status(200).json({
      success: true,
      count: stadiums.length,
      data: stadiums
    });
  } catch (error) {
    next(error);
  }
};

exports.getStadiumById = async (req, res, next) => {
  try {
    const stadium = await StadiumModel.getById(req.params.id);
    
    if (!stadium) {
      return res.status(404).json({ success: false, message: 'Stadium not found.' });
    }

    res.status(200).json({
      success: true,
      data: stadium
    });
  } catch (error) {
    next(error);
  }
};
