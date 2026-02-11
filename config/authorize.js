function authorize(allowedRoles = []) {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Time-based role override for "rp"
    if (user.role === "rp") {
      const now = new Date();
      const hour = now.getHours();  

      // Access window: 08:00 to 17:00 inclusive
      const allowedTime = hour >= 8 + 4 && hour < 17 + 4;

      if (!allowedTime) {
        return res.status(403).json({
          message: "Forbidden: RP role only allowed between 08:00 and 17:00"
        });
      }

      // If inside the window, treat RP as GDA
      user.effectiveRole = "gda";
    } else {
      user.effectiveRole = user.role;
    }

    // Check if the effective role is allowed
    if (!allowedRoles.includes(user.effectiveRole)) {
      return res.status(403).json({ message: "Forbidden: insufficient access" });
    }

    next();
  };
}

module.exports = authorize;
