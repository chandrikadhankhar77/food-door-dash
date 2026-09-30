import ApiError from '../utils/ApiError.js';

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Not authorized'));
  }
  if (!roles.includes(req.user.role)) {
    return next(
      new ApiError(403, `Role '${req.user.role}' is not allowed to access this resource`)
    );
  }
  next();
};

export default authorize;
